-- Supabase PostgreSQL Schema for MedCueAI HMS Portal

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    mobile TEXT,
    designation TEXT,
    department TEXT,
    password TEXT,
    role TEXT DEFAULT 'Doctor/Staff',
    status TEXT DEFAULT 'PENDING',
    institution_id INTEGER
);

CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    name TEXT,
    address TEXT,
    logo TEXT
);

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER,
    name TEXT
);

CREATE TABLE IF NOT EXISTS formulary (
    id SERIAL PRIMARY KEY,
    group_description TEXT,
    generic_description TEXT,
    dosage_form TEXT,
    item_description TEXT,
    manufacturer_name TEXT,
    unit_mrp REAL,
    availability TEXT DEFAULT 'Available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS essential_medicines (
    id SERIAL PRIMARY KEY,
    section_no TEXT,
    section_name TEXT,
    sub_section_no TEXT,
    medicine TEXT,
    level_of_healthcare TEXT,
    dosage_form TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institute_essential_medicines (
    id SERIAL PRIMARY KEY,
    section_no TEXT,
    section_name TEXT,
    sub_section_no TEXT,
    medicine TEXT,
    level_of_healthcare TEXT,
    dosage_form TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    department TEXT,
    prescription_date TEXT,
    uploader_id INTEGER,
    image_data TEXT,
    raw_text TEXT,
    verified_text TEXT,
    status TEXT DEFAULT 'PENDING',
    evaluation_result TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS med_error_prescriptions (
    id SERIAL PRIMARY KEY,
    department TEXT,
    prescription_date TEXT,
    uploader_id INTEGER,
    image_data TEXT,
    raw_text TEXT,
    verified_text TEXT,
    status TEXT DEFAULT 'PENDING',
    evaluation_result TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adr_reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER,
    patient_name TEXT,
    patient_initials TEXT,
    age INTEGER,
    dob TEXT,
    gender TEXT,
    weight TEXT,
    reaction_details TEXT,
    reaction_start_date TEXT,
    reaction_stop_date TEXT,
    reaction_management TEXT,
    suspected_drug TEXT,
    suspected_meds_json TEXT,
    seriousness TEXT,
    outcome TEXT,
    concomitant_meds TEXT,
    relevant_investigations TEXT,
    medical_history TEXT,
    reporter_name TEXT,
    reporter_address TEXT,
    reporter_pin TEXT,
    reporter_email TEXT,
    reporter_contact TEXT,
    reporter_occupation TEXT,
    report_date TEXT,
    status TEXT DEFAULT 'SUBMITTED',
    causality TEXT,
    severity TEXT,
    amc_reg_no TEXT,
    amc_report_no TEXT,
    worldwide_unique_no TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consolidated_reports (
    id SERIAL PRIMARY KEY,
    month TEXT,
    report_data TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS med_error_consolidated_reports (
    id SERIAL PRIMARY KEY,
    month TEXT NOT NULL,
    report_data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cds_audits (
    id SERIAL PRIMARY KEY,
    uploader_id INTEGER REFERENCES users(id),
    file_data TEXT,
    extracted_data TEXT,
    ai_recommendations TEXT,
    doctor_decision TEXT,
    status TEXT DEFAULT 'PENDING_REVIEW',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_name TEXT UNIQUE,
    permissions_json TEXT
);
