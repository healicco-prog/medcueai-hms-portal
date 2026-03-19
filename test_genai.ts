import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "hello",
    });
    console.log(res.text);
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
