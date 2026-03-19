export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  mobile?: string;
  designation?: string;
  role: string;
  department: string;
  status: 'PENDING' | 'APPROVED';
  institution_name?: string;
}

export interface Drug {
  id: number;
  group_description: string;
  generic_description: string;
  dosage_form: string;
  item_description: string;
  manufacturer_name: string;
  unit_mrp: number;
  availability: string;
}

export interface EssentialMedicine {
  id: number;
  section_no: string;
  section_name: string;
  sub_section_no: string;
  medicine: string;
  level_of_healthcare: string;
  dosage_form: string;
}

export interface Prescription {
  id: number;
  uploader_id: number;
  uploader_name?: string;
  image_data: string;
  department: string;
  prescription_date: string;
  raw_text: string;
  verified_text: string;
  status: 'PENDING' | 'OCR_COMPLETED' | 'APPROVED' | 'EVALUATED';
  evaluation_result?: string;
  created_at: string;
}

export interface SuspectedMedication {
  name: string;
  manufacturer: string;
  batch_no: string;
  expiry_date: string;
  dose: string;
  route: string;
  frequency: string;
  date_started: string;
  date_stopped: string;
  indication: string;
  causality: string;
  action_taken: string;
  reintroduction_result: string;
  reintroduction_dose: string;
}

export interface ConcomitantMedication {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  date_started: string;
  date_stopped: string;
  indication: string;
}

export interface ADRReport {
  id: number;
  patient_name: string;
  patient_initials: string;
  age: number;
  dob: string;
  gender: string;
  weight: string;
  reaction_details: string;
  reaction_start_date: string;
  reaction_stop_date: string;
  reaction_management: string;
  suspected_drug: string; // Keep for backward compatibility or simple view
  suspected_meds: SuspectedMedication[];
  suspected_meds_json?: string; // Store the array as JSON
  seriousness: string;
  outcome: string;
  amc_reg_no?: string;
  amc_report_no?: string;
  worldwide_unique_no?: string;
  concomitant_meds: ConcomitantMedication[];
  relevant_investigations: string;
  medical_history: string;
  reporter_name: string;
  reporter_address: string;
  reporter_pin: string;
  reporter_email: string;
  reporter_contact: string;
  reporter_occupation: string;
  reporter_department?: string;
  death_date?: string;
  reporter_signature?: string;
  report_date: string;
  status: string;
  created_at: string;
}
