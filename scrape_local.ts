import google from 'googlethis';
import Database from 'better-sqlite3';

const db = new Database('aimsrc.db');

async function scrapeContacts() {
  const colleges = db.prepare(`SELECT id, name, location, state FROM institutions WHERE head_name IS NULL OR head_mobile IS NULL OR head_name = '-'`).all();
  
  if (colleges.length === 0) {
    console.log("All medical colleges already have principal and contact data!");
    return;
  }
  
  console.log(`Searching the internet to add Principal Name and Mobile Number for ${colleges.length} medical colleges...`);
  
  let updatedCount = 0;
  for (const c of colleges) {
    try {
      const query = `"${c.name}" ${c.location} principal director contact phone number`;
      const response = await google.search(query, { page: 0, safe: false, additional_params: { hl: 'en' } });
      
      let phone = '-';
      let name = '-';
      
      // Attempt 1: Knowledge Panel
      if (response.knowledge_panel && response.knowledge_panel.phone) {
        phone = response.knowledge_panel.phone;
      }
      
      // Flatten all text from results
      const allText = response.results.map(r => (r.title || '') + ' ' + (r.description || '')).join(' ');

      // Attempt 2: Regex for Phone
      if (phone === '-') {
        const phoneRegex = /(?:\+91|0)?\s?[6789]\d{9}/;
        const phoneMatch = allText.match(phoneRegex);
        if (phoneMatch) phone = phoneMatch[0];
        
        // Check for common landline
        if (phone === '-') {
          const landlineRegex = /0\d{2,4}[-\s]?\d{6,8}/;
          const landlineMatch = allText.match(landlineRegex);
          if (landlineMatch) phone = landlineMatch[0];
        }
      }
      
      // Attempt 3: Regex for Name 'Dr. <Name>'
      const nameRegex = /(?:Dr\.|Prof\.|Doctor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g;
      const matches = [...allText.matchAll(nameRegex)];
      
      if (matches.length > 0) {
        // Find most frequently occurring Doctor name
        const counts = matches.reduce((acc: any, curr) => {
          acc[curr[1]] = (acc[curr[1]] || 0) + 1;
          return acc;
        }, {});
        name = 'Dr. ' + Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      }
      
      console.log(`[Extracted] ID ${c.id}: ${c.name}`);
      console.log(`  └─> Principal/Head: ${name} | Phone: ${phone}`);
      
      db.prepare(`UPDATE institutions SET head_name=?, head_mobile=? WHERE id=?`).run(name, phone, c.id);
      updatedCount++;
      
      // Add random delay to deeply avoid Google's IP blocks
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      
    } catch (err: any) {
      console.error(`Failed on ID ${c.id}: limit reached or error... Retrying later.`);
      await new Promise(r => setTimeout(r, 6000));
    }
  }
  
  console.log(`Task Complete! Automatically scraped and updated ${updatedCount} colleges' data!`);
}

scrapeContacts();
