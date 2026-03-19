import google from 'googlethis';
import Database from 'better-sqlite3';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const db = new Database('aimsrc.db');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function scrapeSmartContacts() {
  const BATCH = 3; // Number to test for now
  const colleges = db.prepare(`SELECT id, name, location, state FROM institutions WHERE head_name IS NULL OR head_mobile IS NULL OR head_name = '' LIMIT ${BATCH}`).all();
  
  if (colleges.length === 0) {
    console.log("All colleges updated.");
    return;
  }
  
  console.log(`Starting Smart Web Agent to find contacts for ${colleges.length} medical colleges...`);
  
  for (const c of colleges) {
    try {
      const query = `"${c.name}" ${c.location} ${c.state} medical college principal director phone number email`;
      const response = await google.search(query, { page: 0, safe: false, additional_params: { hl: 'en' } });
      
      const dumpText = `
        KNOWLEDGE: ${JSON.stringify(response.knowledge_panel)}
        SNIPPETS: ${response.results.slice(0, 5).map(r => r.title + " - " + r.description).join('\n')}
      `;

      // Pass dump logic to Gemini to cleanly extract names using 1.5-flash
      const prompt = `Extract the Principal, Dean, or Director's Name and their best Contact Phone Number (Mobile or Landline preferred) from the following Google Search dump for "${c.name}".
      
      Return ONLY a JSON matching exactly this:
      {"principal_name": "extracted name or '-'", "phone_number": "extracted number or '-'"}
      
      Data Dump:
      ${dumpText}
      `;

      const genRes = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
      });

      if (genRes.text) {
        const extracted = JSON.parse(genRes.text);
        console.log(`[Success] ID ${c.id}: ${c.name} -> Head: ${extracted.principal_name}, Phone: ${extracted.phone_number}`);
        db.prepare(`UPDATE institutions SET head_name=?, head_mobile=? WHERE id=?`).run(extracted.principal_name, extracted.phone_number, c.id);
      }
      
      await new Promise(r => setTimeout(r, 4000)); // Rate limit 
      
    } catch (err: any) {
      console.error(`Failed on ID ${c.id}:`, err.message);
    }
  }
}

scrapeSmartContacts();
