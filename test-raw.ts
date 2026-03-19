import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function testRaw() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Act as an advanced Clinical Decision Support (CDS) system. 
    Analyze the following patient clinical documentation:
    
    Suresh complains of severe stomach pain
    
    Extract the available patient data and provide evidence-based clinical decision support.
    Identify potential diagnoses, generate real-time safety alerts (e.g. drug interactions, allergies, early warnings), and provide treatment recommendations.
    
    Provide your analysis in the specified JSON format strictly. Return ONLY valid JSON and no markdown formatting.`,
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          extracted_data: {
            type: Type.OBJECT,
            properties: {
              demographics: { type: Type.STRING },
              symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
              current_diagnosis: { type: Type.ARRAY, items: { type: Type.STRING } },
              medication_history: { type: Type.ARRAY, items: { type: Type.STRING } },
              lab_values: { type: Type.ARRAY, items: { type: Type.STRING } },
              allergies: { type: Type.ARRAY, items: { type: Type.STRING } },
              vital_signs: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          ai_recommendations: {
            type: Type.OBJECT,
            properties: {
              possible_diagnoses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    condition: { type: Type.STRING },
                    probability: { type: Type.STRING },
                    reasoning: { type: Type.STRING }
                  }
                }
              },
              alerts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    description: { type: Type.STRING },
                    action_required: { type: Type.STRING }
                  }
                }
              },
              treatment_recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                    guideline_reference: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  console.log("Raw output exactly:");
  console.log("---START---");
  console.log(response.text);
  console.log("---END---");
}

testRaw();
