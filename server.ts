import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("aimsrc.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    address TEXT,
    logo TEXT
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id INTEGER,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS formulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_description TEXT,
    generic_description TEXT,
    dosage_form TEXT,
    item_description TEXT,
    manufacturer_name TEXT,
    unit_mrp REAL,
    availability TEXT DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS essential_medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_no TEXT,
    section_name TEXT,
    sub_section_no TEXT,
    medicine TEXT,
    level_of_healthcare TEXT,
    dosage_form TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS institute_essential_medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_no TEXT,
    section_name TEXT,
    sub_section_no TEXT,
    medicine TEXT,
    level_of_healthcare TEXT,
    dosage_form TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department TEXT,
    prescription_date TEXT,
    uploader_id INTEGER,
    image_data TEXT,
    raw_text TEXT,
    verified_text TEXT,
    status TEXT DEFAULT 'PENDING',
    evaluation_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS med_error_prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department TEXT,
    prescription_date TEXT,
    uploader_id INTEGER,
    image_data TEXT,
    raw_text TEXT,
    verified_text TEXT,
    status TEXT DEFAULT 'PENDING',
    evaluation_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS adr_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS consolidated_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT,
    report_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS med_error_consolidated_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL,
    report_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cds_audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uploader_id INTEGER,
    file_data TEXT,
    extracted_data TEXT,
    ai_recommendations TEXT,
    doctor_decision TEXT,
    status TEXT DEFAULT 'PENDING_REVIEW',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(uploader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE,
    permissions_json TEXT
  );
`);

// Safely add columns if they don't exist (for existing databases)
const columns = db.prepare("PRAGMA table_info(adr_reports)").all();
const columnNames = columns.map((c: any) => (c as any).name);

if (!columnNames.includes('amc_reg_no')) {
  db.exec("ALTER TABLE adr_reports ADD COLUMN amc_reg_no TEXT");
}
if (!columnNames.includes('amc_report_no')) {
  db.exec("ALTER TABLE adr_reports ADD COLUMN amc_report_no TEXT");
}
if (!columnNames.includes('worldwide_unique_no')) {
  db.exec("ALTER TABLE adr_reports ADD COLUMN worldwide_unique_no TEXT");
}
if (!columnNames.includes('reporter_department')) {
  db.exec("ALTER TABLE adr_reports ADD COLUMN reporter_department TEXT");
}
if (!columnNames.includes('death_date')) {
  db.exec("ALTER TABLE adr_reports ADD COLUMN death_date TEXT");
}
if (!columnNames.includes('reporter_signature')) {
  db.exec("ALTER TABLE adr_reports ADD COLUMN reporter_signature TEXT");
}

// Safely add columns to prescriptions if they don't exist
const prescriptionCols = db.prepare("PRAGMA table_info(prescriptions)").all();
const prescriptionColNames = prescriptionCols.map((c: any) => (c as any).name);

if (!prescriptionColNames.includes('department')) {
  db.exec("ALTER TABLE prescriptions ADD COLUMN department TEXT");
}
if (!prescriptionColNames.includes('prescription_date')) {
  db.exec("ALTER TABLE prescriptions ADD COLUMN prescription_date TEXT");
}

// Safely add columns to med_error_prescriptions if they don't exist
const errorPrescriptionCols = db.prepare("PRAGMA table_info(med_error_prescriptions)").all();
const errorPrescriptionColNames = errorPrescriptionCols.map((c: any) => (c as any).name);

if (!errorPrescriptionColNames.includes('department')) {
  db.exec("ALTER TABLE med_error_prescriptions ADD COLUMN department TEXT");
}
if (!errorPrescriptionColNames.includes('prescription_date')) {
  db.exec("ALTER TABLE med_error_prescriptions ADD COLUMN prescription_date TEXT");
}

const userCols = db.prepare("PRAGMA table_info(users)").all();
const userColNames = userCols.map((c: any) => (c as any).name);
if (!userColNames.includes('username')) {
  db.exec("ALTER TABLE users ADD COLUMN username TEXT");
}

const formularyCols = db.prepare("PRAGMA table_info(formulary)").all();
const formularyColNames = formularyCols.map((c: any) => (c as any).name);
if (!formularyColNames.includes('created_at')) {
  db.exec("ALTER TABLE formulary ADD COLUMN created_at DATETIME");
  db.exec("UPDATE formulary SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL");
}

const essentialMedicinesCols = db.prepare("PRAGMA table_info(essential_medicines)").all();
const essentialMedicinesColNames = essentialMedicinesCols.map((c: any) => (c as any).name);
if (!essentialMedicinesColNames.includes('created_at')) {
  try { db.exec("ALTER TABLE essential_medicines ADD COLUMN created_at DATETIME"); } catch(e) {}
  try { db.exec("UPDATE essential_medicines SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"); } catch(e) {}
}

// Seed Master Admin
const masterAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get("drnarayanak@gmail.com");
if (!masterAdmin) {
  const hashedPassword = bcrypt.hashSync("Tata-vidhya@1969", 10);
  db.prepare("INSERT INTO users (name, email, username, password, role, status) VALUES (?, ?, ?, ?, ?, ?)").run(
    "Master Admin",
    "drnarayanak@gmail.com",
    "drnarayanak",
    hashedPassword,
    "MASTER_ADMIN",
    "APPROVED"
  );
}

// Seed New Super Admin
const newSuperAdmin = db.prepare("SELECT * FROM users WHERE username = ?").get("SuperAdmin-MedcueAI");
if (!newSuperAdmin) {
  const hashedPassword = bcrypt.hashSync("Healic-Narayana@#2026", 10);
  db.prepare("INSERT INTO users (name, email, username, password, role, status) VALUES (?, ?, ?, ?, ?, ?)").run(
    "Super Admin MedcueAI",
    "superadmin@medcueai.com",
    "SuperAdmin-MedcueAI",
    hashedPassword,
    "MASTER_ADMIN",
    "APPROVED"
  );
}

// Seed Departments
const deptCount = db.prepare("SELECT COUNT(*) as count FROM departments").get() as { count: number };
if (deptCount.count === 0) {
  const defaultDepts = ['Pharmacology', 'General Medicine', 'Pediatrics', 'Surgery', 'OBG'];
  const insertDept = db.prepare("INSERT INTO departments (name) VALUES (?)");
  const transaction = db.transaction((depts) => {
    for (const name of depts) insertDept.run(name);
  });
  transaction(defaultDepts);
}

// Seed Default Role Permissions
const defaultPermissions: Record<string, string[]> = {
  'Institute Admin': ['Dashboard', 'Pharmacovigilance', 'Prescription Upload', 'Prescription Audit', 'Prescription Audit Report', 'Medication Error Audit', 'Digital Prescription System', 'Patient Triage', 'CDS tools', 'Formulary Upload', 'Formulary Check', 'Data Upload'],
  'Pharmacology Admin': ['Dashboard', 'Pharmacovigilance', 'Prescription Upload', 'Prescription Audit', 'Prescription Audit Report', 'Medication Error Audit'],
  'Clinical Pharmacologist': ['Dashboard', 'Pharmacovigilance', 'Prescription Upload', 'Prescription Audit', 'Prescription Audit Report', 'Medication Error Audit'],
  'Medical Superintendent': ['Dashboard', 'Digital Prescription System', 'Patient Triage', 'CDS tools'],
  'Department Head': ['Pharmacovigilance', 'Prescription Upload', 'Prescription Audit', 'Medication Error Audit', 'Digital Prescription System', 'Patient Triage', 'CDS tools'],
  'Doctor/ Staff': ['Pharmacovigilance', 'Prescription Upload', 'Prescription Audit', 'Medication Error Audit', 'Digital Prescription System', 'Patient Triage', 'CDS tools'],
  'Department In-charge': ['Pharmacovigilance', 'Prescription Upload', 'Prescription Audit', 'Prescription Audit Report', 'Medication Error Audit', 'Digital Prescription System', 'Patient Triage', 'CDS tools'],
  'Pharmacy Manager': ['Formulary Upload', 'Formulary Check'],
  'Pharmacist': ['Formulary Upload', 'Formulary Check'],
  'Nursing In-charge': ['Pharmacovigilance', 'Prescription Upload', 'Prescription Audit', 'Medication Error Audit', 'Patient Triage'],
  'Nurse': ['Pharmacovigilance', 'Prescription Upload', 'Prescription Audit', 'Medication Error Audit', 'Patient Triage'],
  'Reception': ['Patient Triage']
};

const upsertPerms = db.prepare(`
  INSERT INTO role_permissions (role_name, permissions_json) 
  VALUES (?, ?) 
  ON CONFLICT(role_name) DO UPDATE SET permissions_json=excluded.permissions_json
`);

db.transaction(() => {
  for (const [role, features] of Object.entries(defaultPermissions)) {
    upsertPerms.run(role, JSON.stringify(features));
  }
})();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = 3005;
const JWT_SECRET = process.env.JWT_SECRET || "aimsrc_secret_key_2026";

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  if (token === 'bypass-token-dev') {
    req.user = { id: 1, name: 'Super Admin', role: 'MASTER_ADMIN', email: 'drnarayanak@gmail.com', department: 'Admin' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Auth
app.post("/api/auth/register", (req, res) => {
  const { name, username, email, mobile, designation, department, password, institutionName } = req.body;
  try {
    let institution_id = null;
    if (institutionName) {
      const inst: any = db.prepare("SELECT id FROM institutions WHERE name = ? COLLATE NOCASE").get(institutionName);
      if (!inst) {
        const result = db.prepare("INSERT INTO institutions (name) VALUES (?)").run(institutionName);
        institution_id = result.lastInsertRowid;
      } else {
        institution_id = inst.id;
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare("INSERT INTO users (name, username, email, mobile, designation, department, password, institution_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      name, username, email, mobile, designation, department, hashedPassword, institution_id
    );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Email or username already exists" });
  }
});

app.get("/api/institutions", (req, res) => {
  try {
    const institutions = db.prepare("SELECT * FROM institutions ORDER BY name").all();
    res.json(institutions);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch institutions" });
  }
});

app.put("/api/institutions/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  try {
    const { name, location, state, established, university, ownership, head_name, head_mobile } = req.body;
    db.prepare("UPDATE institutions SET name=?, location=?, state=?, established=?, university=?, ownership=?, head_name=?, head_mobile=? WHERE id=?").run(
      name, location, state, established, university, ownership, head_name, head_mobile, req.params.id
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update institution" });
  }
});

app.delete("/api/institutions/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  try {
    db.prepare("DELETE FROM institutions WHERE id=?").run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete institution. It may be in use." });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  // Use email variable interchangeably as email or username
  const user: any = db.prepare(`
    SELECT users.*, institutions.name as institution_name 
    FROM users 
    LEFT JOIN institutions ON users.institution_id = institutions.id 
    WHERE users.email = ? OR users.username = ?
  `).get(email, email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  if (user.status !== 'APPROVED') {
    return res.status(403).json({ error: "Account pending approval" });
  }
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email, department: user.department }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, department: user.department, institution_name: user.institution_name } });
});

// User Management
app.get("/api/users", authenticateToken, (req: any, res) => {
  if (!['MASTER_ADMIN', 'Institute Admin', 'Pharmacology Admin', 'Admin-Pharmacology'].includes(req.user.role)) {
    return res.sendStatus(403);
  }
  const users = db.prepare("SELECT id, name, username, mobile, email, role, status, department, designation FROM users").all();
  res.json(users);
});

app.post("/api/users", authenticateToken, (req: any, res) => {
  if (!['MASTER_ADMIN', 'Institute Admin', 'Pharmacology Admin', 'Admin-Pharmacology'].includes(req.user.role)) {
    return res.sendStatus(403);
  }
  const { name, username, email, mobile, designation, department, password, role, status } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    // Get institution_id from the admin making the request
    const adminInst: any = db.prepare("SELECT institution_id FROM users WHERE id = ?").get(req.user.id);
    const institution_id = adminInst?.institution_id || null;

    db.prepare("INSERT INTO users (name, username, email, mobile, designation, department, password, role, status, institution_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      name, username, email, mobile, designation, department, hashedPassword, role, status, institution_id
    );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Email or username already exists" });
  }
});

app.patch("/api/users/:id", authenticateToken, (req: any, res) => {
  const { role, status } = req.body;
  if (!['MASTER_ADMIN', 'Institute Admin', 'Admin-Pharmacology'].includes(req.user.role)) return res.sendStatus(403);
  db.prepare("UPDATE users SET role = ?, status = ? WHERE id = ?").run(role, status, req.params.id);
  res.json({ success: true });
});

app.put("/api/users/:id", authenticateToken, (req: any, res) => {
  if (!['MASTER_ADMIN', 'Institute Admin', 'Admin-Pharmacology', 'Pharmacology Admin'].includes(req.user.role)) return res.sendStatus(403);
  const { name, username, email, mobile, designation, department, role, status, password } = req.body;
  try {
    if (req.user.role === 'MASTER_ADMIN') {
      if (password && password.trim() !== '') {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare("UPDATE users SET name = ?, username = ?, email = ?, mobile = ?, designation = ?, department = ?, role = ?, status = ?, password = ? WHERE id = ?").run(name, username, email, mobile, designation, department, role, status, hashedPassword, req.params.id);
      } else {
        db.prepare("UPDATE users SET name = ?, username = ?, email = ?, mobile = ?, designation = ?, department = ?, role = ?, status = ? WHERE id = ?").run(name, username, email, mobile, designation, department, role, status, req.params.id);
      }
    } else {
      // Non-Master Admins cannot update username or password
      db.prepare("UPDATE users SET name = ?, email = ?, mobile = ?, designation = ?, department = ?, role = ?, status = ? WHERE id = ?").run(name, email, mobile, designation, department, role, status, req.params.id);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Failed to update user." });
  }
});

app.delete("/api/users/:id", authenticateToken, (req: any, res) => {
  if (!['MASTER_ADMIN', 'Institute Admin', 'Admin-Pharmacology'].includes(req.user.role)) return res.sendStatus(403);
  try {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Failed to delete user." });
  }
});

// Role Permissions
app.get("/api/role-permissions", authenticateToken, (req: any, res) => {
  try {
    const roles = db.prepare("SELECT * FROM role_permissions").all();
    const permissionsMap: Record<string, string[]> = {};
    for (const r of roles as any[]) {
      try {
        permissionsMap[r.role_name] = JSON.parse(r.permissions_json);
      } catch (e) {
        permissionsMap[r.role_name] = [];
      }
    }
    res.json(permissionsMap);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch role permissions" });
  }
});

app.post("/api/role-permissions", authenticateToken, (req: any, res) => {
  if (!['MASTER_ADMIN', 'Institute Admin', 'Admin-Pharmacology'].includes(req.user.role)) return res.sendStatus(403);
  const { rolePermissions } = req.body; // { role_name: [permissions...] }
  
  const upsert = db.prepare(`
    INSERT INTO role_permissions (role_name, permissions_json) 
    VALUES (?, ?) 
    ON CONFLICT(role_name) DO UPDATE SET permissions_json=excluded.permissions_json
  `);
  
  const transaction = db.transaction((perms: Record<string, string[]>) => {
    for (const [role, features] of Object.entries(perms)) {
      upsert.run(role, JSON.stringify(features));
    }
  });

  try {
    transaction(rolePermissions);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Failed to update role permissions" });
  }
});

// Departments
app.get("/api/departments", (req, res) => {
  const departments = db.prepare("SELECT * FROM departments ORDER BY name").all();
  res.json(departments);
});

app.post("/api/departments/upload", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { departments } = req.body;
  if (!Array.isArray(departments)) return res.status(400).json({ error: "Invalid data" });
  
  const insert = db.prepare("INSERT INTO departments (name) VALUES (?)");
  const transaction = db.transaction((data: string[]) => {
    for (const name of data) insert.run(name);
  });
  
  try {
    transaction(departments.filter((d: any) => typeof d === 'string' && d.trim()));
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Bulk upload failed" });
  }
});

app.post("/api/departments", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const result = db.prepare("INSERT INTO departments (name) VALUES (?)").run(name);
    res.json({ id: result.lastInsertRowid, name });
  } catch (e) {
    res.status(400).json({ error: "Failed to create department" });
  }
});

app.delete("/api/departments/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  db.prepare("DELETE FROM departments WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Formulary
app.get("/api/formulary", authenticateToken, (req, res) => {
  const { search } = req.query;
  let drugs;
  if (search) {
    drugs = db.prepare(`
      SELECT * FROM formulary 
      WHERE generic_description LIKE ? 
      OR group_description LIKE ? 
      OR item_description LIKE ?
    `).all(`%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    drugs = db.prepare("SELECT * FROM formulary").all();
  }
  res.json(drugs);
});

app.post("/api/formulary/upload", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { drugs } = req.body; // Expecting array of objects
  const insert = db.prepare(`
    INSERT INTO formulary (
      group_description, 
      generic_description, 
      dosage_form, 
      item_description, 
      manufacturer_name, 
      unit_mrp, 
      availability
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const transaction = db.transaction((data) => {
    for (const item of data) {
      insert.run(
        item.group_description, 
        item.generic_description, 
        item.dosage_form, 
        item.item_description, 
        item.manufacturer_name,
        item.unit_mrp,
        item.availability || 'Available'
      );
    }
  });
  transaction(drugs);
  res.json({ success: true });
});

app.get("/api/essential-medicines", authenticateToken, (req, res) => {
  const { search } = req.query;
  let drugs;
  if (search) {
    drugs = db.prepare(`
      SELECT * FROM essential_medicines 
      WHERE medicine LIKE ? 
      OR section_name LIKE ? 
      OR section_no LIKE ?
    `).all(`%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    drugs = db.prepare("SELECT * FROM essential_medicines").all();
  }
  res.json(drugs);
});

app.post("/api/essential-medicines/upload", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { medicines } = req.body; 
  const insert = db.prepare(`
    INSERT INTO essential_medicines (
      section_no, 
      section_name, 
      sub_section_no, 
      medicine, 
      level_of_healthcare, 
      dosage_form
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const transaction = db.transaction((data) => {
    for (const item of data) {
      insert.run(
        item.section_no, 
        item.section_name, 
        item.sub_section_no, 
        item.medicine, 
        item.level_of_healthcare,
        item.dosage_form
      );
    }
  });
  
  try {
    transaction(medicines);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Failed to upload essential medicines" });
  }
});

app.post("/api/essential-medicines", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { section_no, section_name, sub_section_no, medicine, level_of_healthcare, dosage_form } = req.body;
  const result = db.prepare(`
    INSERT INTO essential_medicines (
      section_no, 
      section_name, 
      sub_section_no, 
      medicine, 
      level_of_healthcare, 
      dosage_form
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(section_no, section_name, sub_section_no, medicine, level_of_healthcare, dosage_form);
  res.json({ id: result.lastInsertRowid });
});

app.put("/api/essential-medicines/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { section_no, section_name, sub_section_no, medicine, level_of_healthcare, dosage_form } = req.body;
  db.prepare(`
    UPDATE essential_medicines SET 
      section_no = ?, 
      section_name = ?, 
      sub_section_no = ?, 
      medicine = ?, 
      level_of_healthcare = ?, 
      dosage_form = ?
    WHERE id = ?
  `).run(section_no, section_name, sub_section_no, medicine, level_of_healthcare, dosage_form, req.params.id);
  res.json({ success: true });
});

app.delete("/api/essential-medicines/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  db.prepare("DELETE FROM essential_medicines WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.get("/api/institute-essential-medicines", authenticateToken, (req, res) => {
  const { search } = req.query;
  let drugs;
  if (search) {
    drugs = db.prepare(`
      SELECT * FROM institute_essential_medicines 
      WHERE medicine LIKE ? 
      OR section_name LIKE ? 
      OR section_no LIKE ?
    `).all(`%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    drugs = db.prepare("SELECT * FROM institute_essential_medicines").all();
  }
  res.json(drugs);
});

app.post("/api/institute-essential-medicines/upload", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { medicines } = req.body; 
  const insert = db.prepare(`
    INSERT INTO institute_essential_medicines (
      section_no, 
      section_name, 
      sub_section_no, 
      medicine, 
      level_of_healthcare, 
      dosage_form
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const transaction = db.transaction((data) => {
    for (const item of data) {
      insert.run(
        item.section_no, 
        item.section_name, 
        item.sub_section_no, 
        item.medicine, 
        item.level_of_healthcare,
        item.dosage_form
      );
    }
  });
  
  try {
    transaction(medicines);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Failed to upload institute essential medicines" });
  }
});

app.post("/api/institute-essential-medicines", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { section_no, section_name, sub_section_no, medicine, level_of_healthcare, dosage_form } = req.body;
  const result = db.prepare(`
    INSERT INTO institute_essential_medicines (
      section_no, 
      section_name, 
      sub_section_no, 
      medicine, 
      level_of_healthcare, 
      dosage_form
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(section_no, section_name, sub_section_no, medicine, level_of_healthcare, dosage_form);
  res.json({ id: result.lastInsertRowid });
});

app.put("/api/institute-essential-medicines/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { section_no, section_name, sub_section_no, medicine, level_of_healthcare, dosage_form } = req.body;
  db.prepare(`
    UPDATE institute_essential_medicines SET 
      section_no = ?, 
      section_name = ?, 
      sub_section_no = ?, 
      medicine = ?, 
      level_of_healthcare = ?, 
      dosage_form = ?
    WHERE id = ?
  `).run(section_no, section_name, sub_section_no, medicine, level_of_healthcare, dosage_form, req.params.id);
  res.json({ success: true });
});

app.delete("/api/institute-essential-medicines/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  db.prepare("DELETE FROM institute_essential_medicines WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.post("/api/formulary", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { group_description, generic_description, dosage_form, item_description, manufacturer_name, unit_mrp, availability } = req.body;
  const result = db.prepare(`
    INSERT INTO formulary (
      group_description, 
      generic_description, 
      dosage_form, 
      item_description, 
      manufacturer_name, 
      unit_mrp, 
      availability
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(group_description, generic_description, dosage_form, item_description, manufacturer_name, unit_mrp, availability || 'Available');
  res.json({ id: result.lastInsertRowid });
});

app.put("/api/formulary/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { group_description, generic_description, dosage_form, item_description, manufacturer_name, unit_mrp, availability } = req.body;
  db.prepare(`
    UPDATE formulary SET 
      group_description = ?, 
      generic_description = ?, 
      dosage_form = ?, 
      item_description = ?, 
      manufacturer_name = ?, 
      unit_mrp = ?, 
      availability = ?
    WHERE id = ?
  `).run(group_description, generic_description, dosage_form, item_description, manufacturer_name, unit_mrp, availability, req.params.id);
  res.json({ success: true });
});

app.delete("/api/formulary/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  db.prepare("DELETE FROM formulary WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Prescription Audit
app.post("/api/prescriptions/upload", authenticateToken, (req: any, res) => {
  const { image_data, department, prescription_date } = req.body;
  const result = db.prepare("INSERT INTO prescriptions (uploader_id, department, prescription_date, image_data, status) VALUES (?, ?, ?, ?, ?)").run(
    req.user.id, department || 'General', prescription_date || new Date().toISOString().split('T')[0], image_data, 'PENDING'
  );
  res.json({ id: result.lastInsertRowid });
});

app.get("/api/prescriptions", authenticateToken, (req: any, res) => {
  let prescriptions;
  // If master admin or institution admin or pharma admin, they see everything or depending on design.
  // The user says "The recent audits should contain all audits conducted by all the users Name, Department, Date of Audit, Report"
  if (['MASTER_ADMIN', 'INSTITUTION_ADMIN', 'Admin-Pharmacology'].includes(req.user.role)) {
    prescriptions = db.prepare(`
      SELECT p.*, u.name as uploader_name 
      FROM prescriptions p 
      LEFT JOIN users u ON p.uploader_id = u.id 
      ORDER BY p.created_at DESC
    `).all();
  } else {
    // Other roles might only see their department's prescriptions
    prescriptions = db.prepare(`
      SELECT p.*, u.name as uploader_name 
      FROM prescriptions p 
      LEFT JOIN users u ON p.uploader_id = u.id 
      WHERE p.department = ? 
      ORDER BY p.created_at DESC
    `).all(req.user.department || 'General');
  }
  res.json(prescriptions);
});

app.patch("/api/prescriptions/:id", authenticateToken, (req, res) => {
  const { verified_text, raw_text, status, evaluation_result } = req.body;
  if (evaluation_result) {
    db.prepare("UPDATE prescriptions SET verified_text = ?, status = ?, evaluation_result = ? WHERE id = ?").run(
      verified_text, status, JSON.stringify(evaluation_result), req.params.id
    );
  } else if (raw_text !== undefined) {
    db.prepare("UPDATE prescriptions SET raw_text = ?, verified_text = ?, status = ? WHERE id = ?").run(
      raw_text, verified_text, status, req.params.id
    );
  } else {
    db.prepare("UPDATE prescriptions SET verified_text = ?, status = ? WHERE id = ?").run(
      verified_text, status, req.params.id
    );
  }
  res.json({ success: true });
});

// Med Error Prescription Audit
app.post("/api/med-error-prescriptions/upload", authenticateToken, (req: any, res) => {
  const { image_data, department, prescription_date } = req.body;
  const result = db.prepare("INSERT INTO med_error_prescriptions (uploader_id, department, prescription_date, image_data, status) VALUES (?, ?, ?, ?, ?)").run(
    req.user.id, department || 'General', prescription_date || new Date().toISOString().split('T')[0], image_data, 'PENDING'
  );
  res.json({ id: result.lastInsertRowid });
});

app.get("/api/med-error-prescriptions", authenticateToken, (req: any, res) => {
  let prescriptions;
  // If master admin or institution admin or pharma admin, they see everything or depending on design.
  if (['MASTER_ADMIN', 'INSTITUTION_ADMIN', 'Admin-Pharmacology'].includes(req.user.role)) {
    prescriptions = db.prepare(`
      SELECT p.*, u.name as uploader_name 
      FROM med_error_prescriptions p 
      LEFT JOIN users u ON p.uploader_id = u.id 
      ORDER BY p.created_at DESC
    `).all();
  } else {
    // Other roles might only see their department's prescriptions
    prescriptions = db.prepare(`
      SELECT p.*, u.name as uploader_name 
      FROM med_error_prescriptions p 
      LEFT JOIN users u ON p.uploader_id = u.id 
      WHERE p.department = ? 
      ORDER BY p.created_at DESC
    `).all(req.user.department || 'General');
  }
  res.json(prescriptions);
});

app.patch("/api/med-error-prescriptions/:id", authenticateToken, (req, res) => {
  const { verified_text, raw_text, status, evaluation_result } = req.body;
  if (evaluation_result) {
    db.prepare("UPDATE med_error_prescriptions SET verified_text = ?, status = ?, evaluation_result = ? WHERE id = ?").run(
      verified_text, status, JSON.stringify(evaluation_result), req.params.id
    );
  } else if (raw_text !== undefined) {
    db.prepare("UPDATE med_error_prescriptions SET raw_text = ?, verified_text = ?, status = ? WHERE id = ?").run(
      raw_text, verified_text, status, req.params.id
    );
  } else {
    db.prepare("UPDATE med_error_prescriptions SET verified_text = ?, status = ? WHERE id = ?").run(
      verified_text, status, req.params.id
    );
  }
  res.json({ success: true });
});

// Consolidated Reports (Standard)
app.get("/api/consolidated-reports", authenticateToken, (req: any, res) => {
  const reports = db.prepare(`SELECT * FROM consolidated_reports ORDER BY month DESC`).all();
  res.json(reports);
});

app.post("/api/consolidated-reports", authenticateToken, (req: any, res) => {
  const { month, report_data } = req.body;
  
  // Check if report already exists for this month, if so update, else insert
  const existing = db.prepare("SELECT * FROM consolidated_reports WHERE month = ?").get(month);
  
  if (existing) {
    db.prepare("UPDATE consolidated_reports SET report_data = ?, created_at = CURRENT_TIMESTAMP WHERE month = ?").run(JSON.stringify(report_data), month);
  } else {
    db.prepare("INSERT INTO consolidated_reports (month, report_data) VALUES (?, ?)").run(month, JSON.stringify(report_data));
  }
  
  res.json({ success: true });
});

app.delete("/api/consolidated-reports/:id", authenticateToken, (req: any, res) => {
  db.prepare("DELETE FROM consolidated_reports WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// CONSOLIDATED REPORTS (MED ERROR)
// ==========================================

app.get("/api/med-error-consolidated-reports", authenticateToken, (req: any, res) => {
  const reports = db.prepare(`SELECT * FROM med_error_consolidated_reports ORDER BY month DESC`).all();
  res.json(reports);
});

app.post("/api/med-error-consolidated-reports", authenticateToken, (req: any, res) => {
  const { month, report_data } = req.body;
  
  const existing = db.prepare("SELECT * FROM med_error_consolidated_reports WHERE month = ?").get(month);
  
  if (existing) {
    db.prepare("UPDATE med_error_consolidated_reports SET report_data = ?, created_at = CURRENT_TIMESTAMP WHERE month = ?").run(JSON.stringify(report_data), month);
  } else {
    db.prepare("INSERT INTO med_error_consolidated_reports (month, report_data) VALUES (?, ?)").run(month, JSON.stringify(report_data));
  }
  
  res.json({ success: true });
});

app.delete("/api/med-error-consolidated-reports/:id", authenticateToken, (req: any, res) => {
  db.prepare("DELETE FROM med_error_consolidated_reports WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// CLINICAL DECISION SUPPORT (CDS)
// ==========================================

app.get("/api/cds-audits", authenticateToken, (req: any, res) => {
  try {
    const records = db.prepare(`
      SELECT c.*, u.full_name as uploader_name 
      FROM cds_audits c 
      LEFT JOIN users u ON c.uploader_id = u.id 
      ORDER BY c.created_at DESC
    `).all();
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch CDS audits" });
  }
});

app.post("/api/cds-audits", authenticateToken, (req: any, res) => {
  try {
    const { file_data, extracted_data, ai_recommendations } = req.body;
    const stmt = db.prepare(`
      INSERT INTO cds_audits (uploader_id, file_data, extracted_data, ai_recommendations) 
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(
      req.user.id,
      file_data || null,
      extracted_data ? JSON.stringify(extracted_data) : null,
      ai_recommendations ? JSON.stringify(ai_recommendations) : null
    );
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error: any) {
    console.error("DB Error in /api/cds-audits:", error);
    res.status(500).json({ error: error.message || "Failed to save CDS audit" });
  }
});

app.patch("/api/cds-audits/:id", authenticateToken, (req: any, res) => {
  try {
    const { doctor_decision, status } = req.body;
    const stmt = db.prepare(`
      UPDATE cds_audits 
      SET doctor_decision = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(doctor_decision, status, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update CDS audit" });
  }
});

// Pharmacovigilance
app.post("/api/adr", authenticateToken, (req: any, res) => {
  const { 
    patient_name, patient_initials, age, dob, gender, weight,
    reaction_details, reaction_start_date, reaction_stop_date, reaction_management,
    suspected_drug, suspected_meds, seriousness, outcome, concomitant_meds,
    relevant_investigations, medical_history,
    reporter_name, reporter_address, reporter_pin, reporter_email, reporter_contact, reporter_occupation,
    reporter_department, death_date, reporter_signature,
    report_date, amc_reg_no, amc_report_no, worldwide_unique_no
  } = req.body;
  
  const suspected_meds_json = JSON.stringify(suspected_meds || []);
  const concomitant_meds_json = JSON.stringify(concomitant_meds || []);

  db.prepare(`
    INSERT INTO adr_reports (
      reporter_id, patient_name, patient_initials, age, dob, gender, weight,
      reaction_details, reaction_start_date, reaction_stop_date, reaction_management,
      suspected_drug, suspected_meds_json, seriousness, outcome, concomitant_meds,
      relevant_investigations, medical_history,
      reporter_name, reporter_address, reporter_pin, reporter_email, reporter_contact, reporter_occupation,
      reporter_department, death_date, reporter_signature,
      report_date, amc_reg_no, amc_report_no, worldwide_unique_no
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, patient_name, patient_initials, age, dob, gender, weight,
    reaction_details, reaction_start_date, reaction_stop_date, reaction_management,
    suspected_drug, suspected_meds_json, seriousness, outcome, concomitant_meds_json,
    relevant_investigations, medical_history,
    reporter_name, reporter_address, reporter_pin, reporter_email, reporter_contact, reporter_occupation,
    reporter_department, death_date, reporter_signature,
    report_date, amc_reg_no, amc_report_no, worldwide_unique_no
  );
  res.json({ success: true });
});

app.put("/api/adr/:id", authenticateToken, (req: any, res) => {
  const { 
    patient_name, patient_initials, age, dob, gender, weight,
    reaction_details, reaction_start_date, reaction_stop_date, reaction_management,
    suspected_drug, suspected_meds, seriousness, outcome, concomitant_meds,
    relevant_investigations, medical_history,
    reporter_name, reporter_address, reporter_pin, reporter_email, reporter_contact, reporter_occupation,
    reporter_department, death_date, reporter_signature,
    report_date, amc_reg_no, amc_report_no, worldwide_unique_no
  } = req.body;
  
  const suspected_meds_json = JSON.stringify(suspected_meds || []);
  const concomitant_meds_json = JSON.stringify(concomitant_meds || []);

  db.prepare(`
    UPDATE adr_reports SET
      patient_name=?, patient_initials=?, age=?, dob=?, gender=?, weight=?,
      reaction_details=?, reaction_start_date=?, reaction_stop_date=?, reaction_management=?,
      suspected_drug=?, suspected_meds_json=?, seriousness=?, outcome=?, concomitant_meds=?,
      relevant_investigations=?, medical_history=?,
      reporter_name=?, reporter_address=?, reporter_pin=?, reporter_email=?, reporter_contact=?, reporter_occupation=?,
      reporter_department=?, death_date=?, reporter_signature=?,
      report_date=?, amc_reg_no=?, amc_report_no=?, worldwide_unique_no=?
    WHERE id=?
  `).run(
    patient_name, patient_initials, age, dob, gender, weight,
    reaction_details, reaction_start_date, reaction_stop_date, reaction_management,
    suspected_drug, suspected_meds_json, seriousness, outcome, concomitant_meds_json,
    relevant_investigations, medical_history,
    reporter_name, reporter_address, reporter_pin, reporter_email, reporter_contact, reporter_occupation,
    reporter_department, death_date, reporter_signature,
    report_date, amc_reg_no, amc_report_no, worldwide_unique_no,
    req.params.id
  );
  res.json({ success: true });
});

app.get("/api/adr", authenticateToken, (req, res) => {
  const reports = db.prepare("SELECT * FROM adr_reports ORDER BY created_at DESC").all().map((report: any) => {
    try {
      report.suspected_meds = JSON.parse(report.suspected_meds_json || '[]');
      report.concomitant_meds = JSON.parse(report.concomitant_meds || '[]');
    } catch (e) {
      report.suspected_meds = [];
      report.concomitant_meds = [];
    }
    return report;
  });
  res.json(reports);
});

// CDS Audits
app.get("/api/cds-audits", authenticateToken, (req: any, res) => {
  try {
    let audits;
    if (['MASTER_ADMIN', 'INSTITUTION_ADMIN'].includes(req.user.role)) {
      audits = db.prepare(`
        SELECT a.*, u.name as uploader_name, u.department as uploader_department
        FROM cds_audits a 
        LEFT JOIN users u ON a.uploader_id = u.id 
        ORDER BY a.created_at DESC
      `).all();
    } else {
      audits = db.prepare(`
        SELECT a.*, u.name as uploader_name, u.department as uploader_department
        FROM cds_audits a 
        LEFT JOIN users u ON a.uploader_id = u.id 
        WHERE a.uploader_id = ?
        ORDER BY a.created_at DESC
      `).all(req.user.id);
    }
    
    // Parse JSON fields
    res.json(audits.map((a: any) => ({
      ...a,
      extracted_data: a.extracted_data ? JSON.parse(a.extracted_data) : null,
      ai_recommendations: a.ai_recommendations ? JSON.parse(a.ai_recommendations) : null
    })));
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch CDS audits" });
  }
});

app.post("/api/cds-audits", authenticateToken, (req: any, res) => {
  const { file_data, extracted_data, ai_recommendations } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO cds_audits (
        uploader_id, 
        file_data, 
        extracted_data, 
        ai_recommendations,
        status
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      file_data,
      JSON.stringify(extracted_data),
      JSON.stringify(ai_recommendations),
      'PENDING_REVIEW'
    );
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to create CDS audit" });
  }
});

app.patch("/api/cds-audits/:id", authenticateToken, (req: any, res) => {
  const { doctor_decision, status } = req.body;
  try {
    db.prepare(`
      UPDATE cds_audits 
      SET doctor_decision = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(doctor_decision, status, req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update CDS audit" });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

