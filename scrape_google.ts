import google from 'googlethis';
import Database from 'better-sqlite3';

const db = new Database('aimsrc.db');

async function scrapeContacts() {
  // Let's get top 20 empty colleges to test
  const colleges = db.prepare(`SELECT id, name, location, state FROM institutions WHERE head_name IS NULL OR head_mobile IS NULL OR head_name = '' LIMIT 10`).all();
  
  if (colleges.length === 0) {
    console.log("All colleges updated.");
    return;
  }
  
  console.log(`Searching contacts for ${colleges.length} medical colleges via Google Search...`);
  
  for (const c of colleges) {
    try {
      const query = `${c.name} ${c.location} ${c.state} medical college principal contact number`;
      
      const options = {
        page: 0,
        safe: false,
        additional_params: {
          hl: 'en',
        }
      };
      
      const response = await google.search(query, options);
      
      let phone = '-';
      let name = '-';
      
      // Try to get phone from Knowledge Panel if available
      if (response.knowledge_panel && response.knowledge_panel.phone) {
        phone = response.knowledge_panel.phone;
      }
      
      // Extract phone from search snippets if not in knowledge panel
      if (phone === '-') {
        const phoneRegex = /(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}/g;
        for (const res of response.results) {
          const text = (res.description || '') + ' ' + (res.title || '');
          const match = text.match(phoneRegex);
          if (match) {
            phone = match[0];
            break;
          }
        }
      }
      
      // Attempt to extract typical Principal/Dean name from snippets (Dr. <Name>)
      const nameRegex = /(?:Principal|Dean|Director)\s*(?:is|:)?\s*(Dr\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;
      for (const res of response.results) {
        const text = (res.description || '') + ' ' + (res.title || '');
        const match = text.match(nameRegex);
        if (match && match[1]) {
          name = match[1].trim();
          break;
        }
      }
      
      console.log(`ID ${c.id}: ${c.name} -> Head: ${name}, Phone: ${phone}`);
      
      db.prepare(`UPDATE institutions SET head_name=?, head_mobile=? WHERE id=?`).run(name, phone, c.id);
      
      // Delay so Google doesn't block the IP (3 seconds)
      await new Promise(r => setTimeout(r, 3000));
      
    } catch (err: any) {
      console.error(`Failed on ID ${c.id}:`, err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

scrapeContacts();
