import axios from 'axios';
import * as cheerio from 'cheerio';
import Database from 'better-sqlite3';

const db = new Database('aimsrc.db');

// Add new columns to DB if they don't exist
const cols = db.prepare("PRAGMA table_info(institutions)").all();
const colNames = cols.map((c: any) => c.name);

['location', 'state', 'established', 'university', 'ownership'].forEach((col) => {
  if (!colNames.includes(col)) {
    db.exec(`ALTER TABLE institutions ADD COLUMN ${col} TEXT`);
    console.log(`Added column ${col}`);
  }
});

const url = 'https://en.wikipedia.org/wiki/List_of_medical_colleges_in_India';

async function scrape() {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'MedCueAI-SetupBot/1.0 (drnarayanak@gmail.com)'
      }
    });
    const $ = cheerio.load(response.data);
    
    // Wikipedia lists medical colleges by state in different tables, often with class 'wikitable'
    let count = 0;
    let currentState = 'Unknown';
    
    // We iterate over all h2, h3 and tables in order
    const elements = $('h2, h3, table.wikitable');
    
    elements.each((_, el) => {
      if (el.tagName === 'h2' || el.tagName === 'h3') {
        const title = $(el).find('.mw-headline').text().trim() || $(el).text().replace(/\[edit\]/g, '').trim();
        if (title && !title.toLowerCase().includes("see also") && !title.toLowerCase().includes("references") && !title.toLowerCase().includes("external links")) {
          currentState = title;
        }
      } else if (el.tagName === 'table') {
        const table = el;
        // Find headers
        const headers: string[] = [];
        $(table).find('tr').first().find('th, td').each((_, th) => {
          headers.push($(th).text().trim().replace(/\n/g, ' '));
        });
        
        const headerObj: any = {};
        headers.forEach((h, idx) => {
          const lowerH = h.toLowerCase();
          if (lowerH.includes('name')) headerObj.name = idx;
          else if (lowerH.includes('city') || lowerH.includes('location')) headerObj.location = idx;
          else if (lowerH.includes('state')) headerObj.state = idx;
          else if (lowerH.includes('established') || lowerH.includes('founded')) headerObj.established = idx;
          else if (lowerH.includes('university') || lowerH.includes('affiliat')) headerObj.university = idx;
          else if (lowerH.includes('management') || lowerH.includes('type') || lowerH.includes('ownership') || lowerH.includes('status')) headerObj.ownership = idx;
        });
        
        if (headerObj.name === undefined) {
          // Assume first column is name if no 'name' header
          headerObj.name = 0;
        }

        $(table).find('tr:not(:first-child)').each((_, tr) => {
          const row = $(tr).find('th, td');
          if (row.length === 0) return;
          
          let name = headerObj.name !== undefined && row.eq(headerObj.name).text() ? row.eq(headerObj.name).text().trim() : '';
          name = name.replace(/\[\d+\]/g, ''); // Remove reference numbers like [1]
          
          if (!name) return;
          
          let location = headerObj.location !== undefined ? row.eq(headerObj.location).text().trim() : '';
          location = location.replace(/\[\d+\]/g, '');
          
          let rowState = headerObj.state !== undefined && row.eq(headerObj.state).text() ? row.eq(headerObj.state).text().trim() : currentState;
          rowState = rowState.replace(/\[\d+\]/g, '');
          
          let established = headerObj.established !== undefined ? row.eq(headerObj.established).text().trim() : '';
          established = established.replace(/\[\d+\]/g, '');

          let university = headerObj.university !== undefined ? row.eq(headerObj.university).text().trim() : '';
          university = university.replace(/\[\d+\]/g, '');
          
          let ownership = headerObj.ownership !== undefined ? row.eq(headerObj.ownership).text().trim() : '';
          ownership = ownership.replace(/\[\d+\]/g, '');
          
          // Insert or update
          const existing = db.prepare("SELECT id FROM institutions WHERE name = ? COLLATE NOCASE").get(name);
          
          if (existing) {
            db.prepare("UPDATE institutions SET location=?, state=?, established=?, university=?, ownership=? WHERE id=?").run(
              location, rowState, established, university, ownership, (existing as any).id
            );
          } else {
            db.prepare("INSERT INTO institutions (name, location, state, established, university, ownership) VALUES (?, ?, ?, ?, ?, ?)").run(
              name, location, rowState, established, university, ownership
            );
            count++;
          }
        });
      }
    });
    
    console.log(`Finished processing. Inserted ${count} new medical colleges.`);
  } catch (error) {
    console.error("Error scraping:", error);
  }
}

scrape();
