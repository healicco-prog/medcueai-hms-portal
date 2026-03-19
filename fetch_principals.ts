import fs from 'fs';
import Database from 'better-sqlite3';
import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const db = new Database('aimsrc.db');

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

async function main() {
  const colleges = db.prepare(`SELECT id, name, location, state FROM institutions WHERE head_name IS NULL OR head_mobile IS NULL OR head_name = '' `).all();
  
  console.log(`Found ${colleges.length} colleges missing principal info.`);
  
  const BATCH_SIZE = 30; // 30 colleges per API call (to avoid hitting max tokens/search grounding limits)
  let updatedCount = 0;
  
  for (let i = 0; i < colleges.length; i += BATCH_SIZE) {
    const batch = colleges.slice(i, i + BATCH_SIZE);
    
    console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(colleges.length / BATCH_SIZE)}...`);
    
    // Create a compact list format for the prompt
    const collegeList = batch.map(c => `ID ${c.id}: ${c.name}, ${c.location}, ${c.state}`).join('\n');
    
    const prompt = `Use an internet search to find the "Principal" or "Dean" or "Director" name AND "Contact Mobile Number" (or Landline phone number) for the following medical colleges in India.

Return ONLY a JSON array containing objects exactly in this format. Do not use markdown wraps if not necessary or properly format as valid json:
[
  { "id": <number>, "principal_name": "<string or '-'>", "phone_number": "<string or '-'>" }
]

Here is the list of colleges to find:
${collegeList}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
          tools: [{ googleSearch: {} }] // Enable Google Search grounding
        }
      });
      
      const text = response.text;
      if (text) {
        const results = JSON.parse(text);
        
        for (const res of results) {
          db.prepare(
            `UPDATE institutions SET head_name=?, head_mobile=? WHERE id=?`
          ).run(res.principal_name, res.phone_number, res.id);
          updatedCount++;
        }
        console.log(`Successfully updated batch (Cumulative: ${updatedCount})`);
      }
      
      // Delay to avoid strict rate limits (Google API is 15 RPM for free tier, so ~4 seconds per request)
      await new Promise(resolve => setTimeout(resolve, 4500));
      
    } catch (e) {
      console.error(`Error processing batch:`, e);
      // Wait a bit longer if rate limited
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  console.log(`Finished processing! Updated ${updatedCount} colleges.`);
}

main().catch(console.error);
