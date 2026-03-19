import fs from 'fs';
import sqlite3 from 'better-sqlite3';

const db = new sqlite3('aimsrc.db');
let text = fs.readFileSync('nlem-full.txt', 'utf8');
text = text.replace(/(\s+)(?=\d+\.\d+\.\d+(?:\.\d+)?\s+[A-Za-z])/g, '\n');
const lines = text.split('\n').map(l => l.trim()).filter(l => l);

const medicines = [];
let currentSectionNo = '';
let currentSectionName = 'General';
let currentItem = null;

// Heuristic parsing
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for sections e.g. "Section 1 Medicines used in Anaesthesia"
    const sectionMatch = line.match(/^Section\s+(\d+(?:\.\d+)?)\s*\-?\s*(.+)/i);
    if (sectionMatch) {
        currentSectionNo = sectionMatch[1].trim();
        currentSectionName = sectionMatch[2].trim();
        continue;
    }
    
    // Check if line starts with item number
    const itemStartMatch = line.match(/^(\d+\.\d+\.\d+(?:\.\d+)?)\s+(.+)$/);
    
    if (itemStartMatch) {
        if (currentItem) medicines.push(currentItem);
        
        const itemNo = itemStartMatch[1];
        const rest = itemStartMatch[2];
        
        let name = rest;
        let healthLevel = '';
        let dosage = '';
        
        // Find health level tokens: 'P,S,T', 'S,T', 'T' etc
        const healthLevelMatch = rest.match(/^(.*?)\s+((?:[PST],\s*)*(?:[PST]))\s+(.+)$/);
        
        if (healthLevelMatch && healthLevelMatch[2].replace(/\s/g, '').match(/^[PST,]+$/)) {
             name = healthLevelMatch[1];
             healthLevel = healthLevelMatch[2].replace(/\s/g, ''); // normalize P,S,T
             dosage = healthLevelMatch[3];
        } else {
             // Let's try matching when dosage form is empty
             const healthLevelMatchEnd = rest.match(/^(.*?)\s+((?:[PST],\s*)*(?:[PST]))$/);
             if (healthLevelMatchEnd && healthLevelMatchEnd[2].replace(/\s/g, '').match(/^[PST,]+$/)) {
                 name = healthLevelMatchEnd[1];
                 healthLevel = healthLevelMatchEnd[2].replace(/\s/g, ''); 
             }
        }
        
        // clean up name
        name = name.replace(/\*+$/, '').replace(/\#$/, '').trim();
        
        currentItem = {
            section_no: currentSectionNo,
            section_name: currentSectionName,
            item_no: itemNo,
            medicine: name,
            level_of_healthcare: healthLevel,
            dosage_form: dosage
        };
    } else if (currentItem) {
        // Stop accumulation if we hit pagebreak or index or new section
        const lower = line.toLowerCase();
        if (lower.includes('----------------page') || lower.startsWith('medicine level') || line.startsWith('*') || line.startsWith('#') || lower.startsWith('alphabetical') || lower.startsWith('medicines added') || lower.startsWith('medicines deleted')) {
            // ignore
        } else if (!line.match(/^\d+\.\d+/)) {
            // Append to dosage form
            currentItem.dosage_form += (currentItem.dosage_form ? ' | ' : '') + line;
        }
    }
}

if (currentItem) medicines.push(currentItem);

// Clean up
const finalMedicines = medicines.map(m => {
    // some names are wrapped
    if (m.medicine === 'Sodium Valproate*' || m.medicine.toLowerCase().includes('section')) {
        m.medicine = m.medicine.replace(/\*+$/, '');
    }
    
    // Extract subsection number from the item number (e.g. 1.1.1 -> 1.1)
    let subSectionNo = '';
    const parts = m.item_no.split('.');
    if (parts.length >= 2) {
      subSectionNo = parts.slice(0, 2).join('.');
    }
    
    m.dosage_form = m.dosage_form.substring(0, 150); // truncate if too long
    
    return {
      section_no: m.section_no,
      section_name: m.section_name,
      sub_section_no: subSectionNo,
      medicine: m.medicine,
      level_of_healthcare: m.level_of_healthcare,
      dosage_form: m.dosage_form
    };
}).filter(m => m.medicine.length > 2 && m.medicine.length < 100);

console.log(`Parsed ${finalMedicines.length} medicines. Sample:`, finalMedicines.slice(0, 3));
console.log(`Missing health level: ${finalMedicines.filter(m => !m.level_of_healthcare).length}`);

db.exec(`
  DROP TABLE IF EXISTS essential_medicines;
  CREATE TABLE essential_medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_no TEXT,
    section_name TEXT,
    sub_section_no TEXT,
    medicine TEXT,
    level_of_healthcare TEXT,
    dosage_form TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert into DB
const insert = db.prepare(`
    INSERT INTO essential_medicines (
      section_no, 
      section_name, 
      sub_section_no, 
      medicine, 
      level_of_healthcare, 
      dosage_form
    ) VALUES (?, ?, ?, ?, ?, ?)
`);

const transaction = db.transaction((data) => {
    for (const item of data) {
        insert.run(
            item.section_no, 
            item.section_name, 
            item.sub_section_no, 
            item.medicine, 
            item.level_of_healthcare,
            item.dosage_form
        );
    }
});

transaction(finalMedicines);
console.log(`Successfully imported ${finalMedicines.length} items from NLEM 2022 to the database!`);
