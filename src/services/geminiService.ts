import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const evaluatePrescription = async (prescriptionText: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Evaluate the following prescription text based on WHO and National guidelines. 
    Prescription Text:
    ${prescriptionText}
    
    Critically evaluate the prescription strictly against the following 27 parameters of the WHO Reporting Format. For each criterion, indicate if it's fulfilled ("Y", "N", or "N/A") and provide a brief remark:
    1. OPD Registration Number mentioned?
    2. Complete Name of the patient is written?
    3. Age in years (>= 5 in years) in case of < 5 years (in months)
    4. Weight in Kg (only patients of paediatric age group)
    5. Date of consultation - day / month / year
    6. Gender of the patient
    7. Handwriting is Legible in Capital letter (Assume N/A or derive from text quality)
    8. Brief history Written
    9. Allergy status mentioned
    10. Salient features of Clinical Examination recorded
    11. Presumptive / definitive diagnosis written
    12. Medicines are prescribed by generic names
    13. Medicines prescribed are in line with STG (Standard Treatment Guidelines)
    14. Medicine Schedule / doses clearly written
    15. Duration of treatment written
    16. Date of next visit (review) written
    17. In case of referral, the relevant clinical details and reason for referral given
    18. Follow-up advise and precautions (do's and don'ts) are recorded
    19. Prescription duly signed (legibly)
    20. Medicines Prescribed are as per EML/ Formulary
    21. Medicines advised are available in the dispensary
    22. Vitamins, Tonics or Enzymes prescribed?
    23. Antibiotics prescribed?
    24. Antibiotics are prescribed as per facility's Antibiotic Policy
    25. Investigations advised?
    26. Injections prescribed?
    27. Number of Medicines prescribed. (write the number in remarks)
    
    Provide a detailed audit report in JSON format as specified. Return ONLY valid JSON and no markdown formatting.`,
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prescription_id: { type: Type.STRING },
          scores: {
            type: Type.OBJECT,
            properties: {
              patient_information: { type: Type.NUMBER },
              facility_prescriber: { type: Type.NUMBER },
              clinical_documentation: { type: Type.NUMBER },
              drug_information: { type: Type.NUMBER },
              rational_prescribing: { type: Type.NUMBER },
              safety_compliance: { type: Type.NUMBER },
              legibility_structure: { type: Type.NUMBER }
            }
          },
          overall_score: { type: Type.NUMBER },
          quality_level: { type: Type.STRING },
          who_core_indicators: {
            type: Type.OBJECT,
            properties: {
              avg_drugs_per_encounter: { type: Type.NUMBER },
              percent_generic: { type: Type.NUMBER },
              percent_antibiotic: { type: Type.NUMBER },
              percent_injection: { type: Type.NUMBER },
              percent_from_eml: { type: Type.NUMBER }
            }
          },
          major_deficiencies: { type: Type.ARRAY, items: { type: Type.STRING } },
          minor_deficiencies: { type: Type.ARRAY, items: { type: Type.STRING } },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          who_compliance_percentage: { type: Type.NUMBER },
          who_criteria_audit: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sn: { type: Type.NUMBER },
                criterion: { type: Type.STRING },
                fulfilled: { type: Type.STRING },
                remarks: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const performOCR = async (base64Image: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { text: "Perform OCR on this prescription image. Extract all text accurately." },
      { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
    ]
  });
  return response.text;
};

export const runCDSAnalysis = async (structuredText: string, retries = 3, isSecondPass = false) => {
  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
  let delay = 2000;

  for (let attempt = 1; attempt <= retries; attempt++) {
    for (const modelName of models) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Act as an advanced Clinical Decision Support (CDS) system. 
          Analyze the following patient clinical documentation:
          
          --- START OF DOCUMENTATION ---
          ${structuredText}
          --- END OF DOCUMENTATION ---
          
          Extract the available patient data and provide evidence-based clinical decision support.
          Identify potential diagnoses, generate real-time safety alerts (e.g. drug interactions, allergies, early warnings), and provide treatment recommendations.
          
          CRITICAL INSTRUCTIONS TO PREVENT HALLUCINATIONS:
          1. DO NOT invent, hallucinate, or assume any patient data (e.g., do NOT use names like "John Doe", do NOT invent age, vitals, labs, allergies, or symptoms).
          2. If a specific piece of information (like demographics, vitals, allergies, medications) is NOT explicitly mentioned in the input text, you MUST return "Not provided", "None detected", or an empty array [] for that field. 
          3. Only base your diagnoses, alerts, and recommendations strictly on the information provided in the input text.
          4. ${isSecondPass 
            ? `THIS IS THE SECOND AND FINAL PASS. You MUST set requires_more_info to false and generate the full analysis using whatever data is available. Do NOT ask for more information. Base your suggestions entirely on the provided text.` 
            : `If the provided clinical scenario is too brief, vague, or lacks essential clinical context to safely form an accurate diagnosis or safety alert (e.g., just "pain in knee"), you MUST set requires_more_info to true. The missing_info_prompt MUST be formatted EXACTLY like this (use '\\n' for new lines):
"Good to go, that you have entered the brief scenario. The probable clinical conditions could be [List 2-3 probable conditions], but I require the following things:\\n- [Required information 1]\\n- [Required information 2]\\n\\nIf further information is provided with regards to the points I share, I can give a better suggestion."`}
          
          Provide your analysis in the specified JSON format strictly. Return ONLY valid JSON and no markdown formatting.`,
          config: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                requires_more_info: { type: Type.BOOLEAN, description: "True if more clinical details are needed from the user." },
                missing_info_prompt: { type: Type.STRING, description: "The specific question asking the user for the missing details. Empty if requires_more_info is false." },
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

        if (response.text) return JSON.parse(response.text);
      } catch (error: any) {
        console.warn(`Attempt ${attempt} with ${modelName} failed: ${error.message || 'Unknown error'}`);
        
        // If it's not a server error/rate limit, and it's not a parsing error, we shouldn't necessarily retry,
        // but for simplicity and robustness we'll just fall back and retry.
      }
    }
    
    // If we reach here, both models failed on this attempt. Wait before retrying.
    if (attempt < retries) {
      console.log(`All models failed. Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = delay === 2000 ? 5000 : 10000; // 2s -> 5s -> 10s
    }
  }

  throw new Error("AI service is busy right now. Please try again in a minute.");
};

const triageSchema = {
  type: Type.OBJECT,
  properties: {
    detectedLanguage: {
      type: Type.STRING,
      description: "The language detected from the user's input (e.g. Hindi, Tamil, English)"
    },
    translatedText: {
      type: Type.STRING,
      description: "The accurately translated English text of the input."
    },
    symptoms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of extracted symptoms, duration, severity, and critical indicators."
    },
    primaryDepartment: {
      type: Type.STRING,
      description: "The main suggested hospital department for triage."
    },
    secondaryDepartment: {
      type: Type.STRING,
      description: "Optional secondary department if needed. Else 'None'."
    },
    triagePriority: {
      type: Type.STRING,
      description: "Must be exactly one of: 'Emergency', 'Urgent', 'Semi-urgent', or 'Routine'."
    },
    reasoning: {
      type: Type.STRING,
      description: "Short clinical explanation for why this department and priority is recommended."
    }
  },
  required: [
    "detectedLanguage",
    "translatedText",
    "symptoms",
    "primaryDepartment",
    "triagePriority",
    "reasoning"
  ]
};

export const runPatientTriageAnalysis = async (inputText: string): Promise<any> => {
  try {
    const prompt = `You are an AI-powered hospital triage assistant designed to help route patients to the most appropriate hospital department based on their symptoms. Analyze the following patient input (which may be in any language including Hindi, Kannada, Tamil, Telugu, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, or English).

Patient Input: "${inputText}"

Step 1: Detect the language and accurately translate the input into English, preserving the medical meaning of the symptoms.
Step 2: Extract the main complaint, listed symptoms, duration, severity indicators, injury/trauma details, and pregnancy status (if mentioned).
Step 3: Analyze the symptoms and determine the most appropriate primary hospital department(s) from this possible list: Emergency Medicine, General Medicine, Cardiology, Neurology, Orthopedics, General Surgery, Obstetrics and Gynecology, Pediatrics, Dermatology, ENT, Psychiatry, Gastroenterology, Pulmonology, Urology, Ophthalmology. Assign a secondary department if cross-consultation is warranted.
Step 4: Classify the urgency into one of these strict levels:
- Emergency – Immediate medical attention required
- Urgent – Should be seen within 1 hour
- Semi-urgent – Needs same day consultation
- Routine – Normal outpatient consultation
Step 5: Provide a short clinical reasoning explaining your triage recommendation.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: triageSchema,
        temperature: 0.2
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Error running Patient Triage analysis:", error);
    throw error;
  }
};

const prescriptionSchema = {
  type: Type.OBJECT,
  properties: {
    patientDetails: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Patient Name" },
        age: { type: Type.STRING, description: "Patient Age (optional)" },
        gender: { type: Type.STRING, description: "Patient Gender (optional)" },
        phone: { type: Type.STRING, description: "Patient WhatsApp number (optional)" }
      }
    },
    clinicalInformation: {
      type: Type.OBJECT,
      properties: {
        chiefComplaint: { type: Type.STRING, description: "Chief complaint or symptoms" },
        findings: { type: Type.STRING, description: "Clinical findings (optional)" },
        provisionalDiagnosis: { type: Type.STRING, description: "Provisional diagnosis" }
      }
    },
    medications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          genericName: { type: Type.STRING, description: "Generic drug name" },
          strength: { type: Type.STRING, description: "Strength (e.g. 500mg)" },
          dosageForm: { type: Type.STRING, description: "Dosage form (e.g. Tablet, Syrup)" },
          dose: { type: Type.STRING, description: "Dose (e.g. 1 tab, 10ml, 1 puff)" },
          frequency: { type: Type.STRING, description: "Frequency (e.g. 3 times daily, OD, BD)" },
          duration: { type: Type.STRING, description: "Duration (e.g. 5 days, 1 week)" },
          route: { type: Type.STRING, description: "Route of administration (e.g. Oral route, Topical)" },
        }
      }
    },
    instructions: {
      type: Type.OBJECT,
      properties: {
        dietaryAdvice: { type: Type.STRING, description: "Dietary advice (optional)" },
        lifestyleAdvice: { type: Type.STRING, description: "Lifestyle advice (optional)" },
        specialPrecautions: { type: Type.STRING, description: "Special precautions (optional)" }
      }
    },
    followUpDate: { type: Type.STRING, description: "Follow-up date or instruction (optional)" },
    validationAlerts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of warnings for missing data: e.g. Missing drug dosage, missing duration, ambiguous instructions, or drug duplication."
    }
  },
  required: [
    "patientDetails",
    "clinicalInformation",
    "medications",
    "instructions",
    "validationAlerts"
  ]
};

export const runDigitalPrescriptionAnalysis = async (inputText: string): Promise<any> => {
  try {
    const prompt = `You are an AI-powered medical documentation assistant assisting doctors in generating standard digital prescriptions following WHO prescription writing standards.
The doctor has dictated or typed the following information (in English or any Indian language):

Input: "${inputText}"

Step 1: Convert non-English input to English preserving medical terminology.
Step 2: Extract details for Patient (Name, Age, Gender, Phone), Clinical Information (Complaint, Findings, Diagnosis), and Medications.
Step 3: Format the medications to include generic name, strength, dosage form, dose, frequency, duration, and route.
Step 4: Check for missing critical details. If any medication is missing dosage, duration, or has ambiguous instructions, list it in 'validationAlerts'. Also flag drug duplication.
Step 5: Extract instructions and follow up date. Output strictly as JSON based on the schema.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: prescriptionSchema,
        temperature: 0.1
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Error generating Digital Prescription:", error);
    throw error;
  }
};

