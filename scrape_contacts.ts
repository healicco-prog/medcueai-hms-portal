import Database from 'better-sqlite3';
import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const db = new Database('aimsrc.db');

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const colleges = db.prepare(`SELECT id, name, location, state FROM institutions WHERE head_name IS NULL OR head_mobile IS NULL OR head_name = '' `).all();
  
  console.log(`Searching the internet to add Principal's Name and Mobile Number for ${colleges.length} colleges...`);
  
  const BATCH_SIZE = 15; // Manageable chunk
  let updatedCount = 0;
  
  for (let i = 0; i < colleges.length; i += BATCH_SIZE) {
    const batch = colleges.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(colleges.length / BATCH_SIZE)}...`);
    
    const collegeList = batch.map(c => `ID ${c.id}: ${c.name}, ${c.location}, ${c.state}`).join('\n');
    const prompt = `Perform an internet search to find the "Principal" (or Dean/Director) name AND their "Contact Mobile Number" (or Landline telephone) for each of these Medical Colleges in India.

CRITICAL: You must return a strict JSON array exactly in this format. No other text.
[
  { "id": <number corresponding to the ID>, "principal_name": "<found name, or '-'>", "phone_number": "<found number, or '-'>" }
]

Medical Colleges to search for:
${collegeList}`;

    let success = false;
    let attempts = 0;
    
    while (!success && attempts < 3) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  principal_name: { type: Type.STRING },
                  phone_number: { type: Type.STRING }
                },
                required: ["id", "principal_name", "phone_number"]
              }
            },
            tools: [{ googleSearch: {} }] // Trigger internet search
          }
        });
        
        if (response.text) {
          const results = JSON.parse(response.text);
          for (const res of results) {
            db.prepare(
              `UPDATE institutions SET head_name=?, head_mobile=? WHERE id=?`
            ).run(res.principal_name, res.phone_number, res.id);
            updatedCount++;
          }
          console.log(`Success! Updated batch. Cumulative Updated: ${updatedCount}`);
          success = true;
          // Avoid 429 by sleeping for 10 seconds between requests
          await sleep(10000); 
        }
      } catch (e: any) {
        attempts++;
        if (e.status === 429) {
          console.error(`Rate limited (429). Retrying in ${attempts * 20} seconds...`);
          await sleep(attempts * 20000); 
        } else {
          console.error(`Failed on batch: ${e.message}. Retrying...`);
          await sleep(5000);
        }
      }
    }
  }
  
  console.log(`Finished processing all colleges! ${updatedCount} colleges internet-searched and updated!`);
}

main().catch(console.error);
