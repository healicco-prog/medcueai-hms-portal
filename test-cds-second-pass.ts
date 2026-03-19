import 'dotenv/config';
import { runCDSAnalysis } from './src/services/geminiService.js';
(async () => {
  try {
    const text = `Suresh complains of pain in right knee

[Additional Information Provided by User: Test Clinical Scenario (Knee Pain)

Patient Name: Suresh Kumar
Age: 55 years
Sex: Male

Chief Complaint:
Pain in the right knee for the past 3 months, gradually worsening.

History of Present Illness:
Suresh reports dull aching pain in the right knee that increases while walking, climbing stairs, and standing for long periods. The pain is worse in the morning and after prolonged activity. He also notices mild swelling and stiffness lasting about 20 minutes in the morning. There is no history of trauma.

Relevant Medical History:

Hypertension for 8 years

Type 2 Diabetes Mellitus for 5 years

Overweight (BMI 29)

Current Medications:

Tab Metformin 500 mg twice daily

Tab Amlodipine 5 mg once daily

Tab Atorvastatin 10 mg once daily

Allergies:

No known drug allergies

Vital Signs:

Blood Pressure: 138/88 mmHg

Heart Rate: 82 bpm

Temperature: 98.6°F (37°C)

Respiratory Rate: 18/min

Oxygen Saturation: 98%

Physical Examination:

Mild swelling over right knee joint

Crepitus on movement

Pain on flexion and extension

Reduced range of motion

Investigations:

X-ray right knee shows joint space narrowing and osteophyte formation.

Provisional Diagnosis:
Right Knee Osteoarthritis.]`;

    const res = await runCDSAnalysis(text, 1, true);
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  }
})();
