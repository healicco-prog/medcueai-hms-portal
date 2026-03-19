import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || "https://nnolyyuvhdoyqmnlgwry.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY. Database operations will fail if not set.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

const PORT = parseInt(process.env.PORT || '3005');
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
app.post("/api/auth/register", async (req, res) => {
  const { name, username, email, mobile, designation, department, password, institutionName } = req.body;
  try {
    let institution_id = null;
    if (institutionName) {
      const { data: inst } = await supabase.from('institutions').select('id').ilike('name', institutionName).single();
      if (!inst) {
        const { data: newInst, error } = await supabase.from('institutions').insert({ name: institutionName }).select('id').single();
        if (error) throw error;
        if (newInst) institution_id = newInst.id;
      } else {
        institution_id = inst.id;
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const { error } = await supabase.from('users').insert({
      name, username, email, mobile, designation, department, password: hashedPassword, institution_id, role: 'Doctor/Staff', status: 'PENDING'
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message || "Email or username already exists" });
  }
});

app.get("/api/institutions", async (req, res) => {
  try {
    const { data, error } = await supabase.from('institutions').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch institutions" });
  }
});

app.put("/api/institutions/:id", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  try {
    const { name, location, state, established, university, ownership, head_name, head_mobile } = req.body;
    const { error } = await supabase.from('institutions').update({
      name, location, state, established, university, ownership, head_name, head_mobile
    }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update institution" });
  }
});

app.delete("/api/institutions/:id", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  try {
    const { error } = await supabase.from('institutions').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete institution. It may be in use." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Try by email first
    let { data: users } = await supabase.from('users').select('*').eq('email', email);
    
    // If not found by email, try by username
    if (!users || users.length === 0) {
      const { data: byUsername } = await supabase.from('users').select('*').eq('username', email);
      users = byUsername;
    }
      
    if (!users || users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user: any = users[0];

    // Get institution name if user has institution_id
    let institution_name = null;
    if (user.institution_id) {
      const { data: inst } = await supabase.from('institutions').select('name').eq('id', user.institution_id).single();
      institution_name = inst?.name || null;
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: "Account pending approval" });
    }
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, department: user.department }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, department: user.department, institution_name } });
  } catch(e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed" });
  }
});

// User Management
app.get("/api/users", authenticateToken, async (req: any, res) => {
  if (!['MASTER_ADMIN', 'Institute Admin', 'Pharmacology Admin', 'Admin-Pharmacology'].includes(req.user.role)) {
    return res.sendStatus(403);
  }
  const { data, error } = await supabase.from('users').select('id, name, username, mobile, email, role, status, department, designation, institution_id, institutions(name)');
  
  const mappedData = (data || []).map((u: any) => ({
    ...u,
    institution_name: u.institutions?.name || null
  }));
  res.json(mappedData);
});

app.post("/api/users", authenticateToken, async (req: any, res) => {
  if (!['MASTER_ADMIN', 'Institute Admin', 'Pharmacology Admin', 'Admin-Pharmacology'].includes(req.user.role)) {
    return res.sendStatus(403);
  }
  const { name, username, email, mobile, designation, department, password, role, status } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const { data: adminUser } = await supabase.from('users').select('institution_id').eq('id', req.user.id).single();
    const institution_id = adminUser?.institution_id || null;

    const { error } = await supabase.from('users').insert({
      name, username, email, mobile, designation, department, password: hashedPassword, role, status, institution_id
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Email or username already exists" });
  }
});

app.patch("/api/users/:id", authenticateToken, async (req: any, res) => {
  const { role, status } = req.body;
  if (!['MASTER_ADMIN', 'Institute Admin', 'Admin-Pharmacology'].includes(req.user.role)) return res.sendStatus(403);
  await supabase.from('users').update({ role, status }).eq('id', req.params.id);
  res.json({ success: true });
});

app.put("/api/users/:id", authenticateToken, async (req: any, res) => {
  if (!['MASTER_ADMIN', 'Institute Admin', 'Admin-Pharmacology', 'Pharmacology Admin'].includes(req.user.role)) return res.sendStatus(403);
  const { name, username, email, mobile, designation, department, role, status, password } = req.body;
  try {
    let updates: any = {};
    if (req.user.role === 'MASTER_ADMIN') {
      updates = { name, username, email, mobile, designation, department, role, status };
      if (password && password.trim() !== '') {
        updates.password = bcrypt.hashSync(password, 10);
      }
    } else {
      updates = { name, email, mobile, designation, department, role, status };
    }
    const { error } = await supabase.from('users').update(updates).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Failed to update user." });
  }
});

app.delete("/api/users/:id", authenticateToken, async (req: any, res) => {
  if (!['MASTER_ADMIN', 'Institute Admin', 'Admin-Pharmacology'].includes(req.user.role)) return res.sendStatus(403);
  try {
    await supabase.from('users').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Failed to delete user." });
  }
});

// Role Permissions
app.get("/api/role-permissions", authenticateToken, async (req: any, res) => {
  try {
    const { data } = await supabase.from('role_permissions').select('*');
    const permissionsMap: Record<string, string[]> = {};
    for (const r of data || []) {
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

app.post("/api/role-permissions", authenticateToken, async (req: any, res) => {
  if (!['MASTER_ADMIN', 'Institute Admin', 'Admin-Pharmacology'].includes(req.user.role)) return res.sendStatus(403);
  const { rolePermissions } = req.body; 
  
  try {
    const records = Object.entries(rolePermissions).map(([role, features]) => ({
      role_name: role,
      permissions_json: JSON.stringify(features)
    }));
    await supabase.from('role_permissions').upsert(records, { onConflict: 'role_name' });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Failed to update role permissions" });
  }
});

// Departments
app.get("/api/departments", async (req, res) => {
  const { data } = await supabase.from('departments').select('*').order('name');
  res.json(data || []);
});

app.post("/api/departments/upload", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { departments } = req.body;
  if (!Array.isArray(departments)) return res.status(400).json({ error: "Invalid data" });
  
  try {
    const validDepts = departments.filter((d: any) => typeof d === 'string' && d.trim()).map(name => ({name}));
    await supabase.from('departments').insert(validDepts);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Bulk upload failed" });
  }
});

app.post("/api/departments", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const { data: result } = await supabase.from('departments').insert({ name }).select('id').single();
    res.json({ id: result?.id, name });
  } catch (e) {
    res.status(400).json({ error: "Failed to create department" });
  }
});

app.delete("/api/departments/:id", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  await supabase.from('departments').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Formulary
app.get("/api/formulary", authenticateToken, async (req, res) => {
  const { search } = req.query;
  let query = supabase.from('formulary').select('*');
  if (search) {
    query = query.or(`generic_description.ilike.%${search}%,group_description.ilike.%${search}%,item_description.ilike.%${search}%`);
  }
  const { data } = await query;
  res.json(data || []);
});

app.post("/api/formulary/upload", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { drugs } = req.body; 
  try {
    const toInsert = drugs.map((item: any) => ({
      ...item,
      availability: item.availability || 'Available'
    }));
    await supabase.from('formulary').insert(toInsert);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: "Failed"}); }
});

app.post("/api/formulary", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { group_description, generic_description, dosage_form, item_description, manufacturer_name, unit_mrp, availability } = req.body;
  const { data: result } = await supabase.from('formulary').insert({
    group_description, generic_description, dosage_form, item_description, manufacturer_name, unit_mrp, availability: availability || 'Available'
  }).select('id').single();
  res.json({ id: result?.id });
});

app.put("/api/formulary/:id", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { group_description, generic_description, dosage_form, item_description, manufacturer_name, unit_mrp, availability } = req.body;
  await supabase.from('formulary').update({
    group_description, generic_description, dosage_form, item_description, manufacturer_name, unit_mrp, availability
  }).eq('id', req.params.id);
  res.json({ success: true });
});

app.delete("/api/formulary/:id", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  await supabase.from('formulary').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Essential Medicines
app.get("/api/essential-medicines", authenticateToken, async (req, res) => {
  const { search } = req.query;
  let query = supabase.from('essential_medicines').select('*');
  if (search) {
    query = query.or(`medicine.ilike.%${search}%,section_name.ilike.%${search}%,section_no.ilike.%${search}%`);
  }
  const { data } = await query;
  res.json(data || []);
});

app.post("/api/essential-medicines/upload", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  try {
    await supabase.from('essential_medicines').insert(req.body.medicines);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Failed to upload" });
  }
});

app.post("/api/essential-medicines", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { data } = await supabase.from('essential_medicines').insert(req.body).select('id').single();
  res.json({ id: data?.id });
});

app.put("/api/essential-medicines/:id", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  await supabase.from('essential_medicines').update({
    section_no: req.body.section_no, section_name: req.body.section_name, sub_section_no: req.body.sub_section_no, medicine: req.body.medicine, level_of_healthcare: req.body.level_of_healthcare, dosage_form: req.body.dosage_form
  }).eq('id', req.params.id);
  res.json({ success: true });
});

app.delete("/api/essential-medicines/:id", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  await supabase.from('essential_medicines').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Institute Essential Medicines
app.get("/api/institute-essential-medicines", authenticateToken, async (req, res) => {
  const { search } = req.query;
  let query = supabase.from('institute_essential_medicines').select('*');
  if (search) {
    query = query.or(`medicine.ilike.%${search}%,section_name.ilike.%${search}%,section_no.ilike.%${search}%`);
  }
  const { data } = await query;
  res.json(data || []);
});

app.post("/api/institute-essential-medicines/upload", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  try {
    await supabase.from('institute_essential_medicines').insert(req.body.medicines);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: "Failed" }); }
});

app.post("/api/institute-essential-medicines", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  const { data } = await supabase.from('institute_essential_medicines').insert(req.body).select('id').single();
  res.json({ id: data?.id });
});

app.put("/api/institute-essential-medicines/:id", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  await supabase.from('institute_essential_medicines').update({
    section_no: req.body.section_no, section_name: req.body.section_name, sub_section_no: req.body.sub_section_no, medicine: req.body.medicine, level_of_healthcare: req.body.level_of_healthcare, dosage_form: req.body.dosage_form
  }).eq('id', req.params.id);
  res.json({ success: true });
});

app.delete("/api/institute-essential-medicines/:id", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'Admin-Pharmacology' && req.user.role !== 'MASTER_ADMIN') return res.sendStatus(403);
  await supabase.from('institute_essential_medicines').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Prescription Audit
app.post("/api/prescriptions/upload", authenticateToken, async (req: any, res) => {
  const { image_data, department, prescription_date } = req.body;
  const { data } = await supabase.from('prescriptions').insert({
    uploader_id: req.user.id, department: department || 'General', prescription_date: prescription_date || new Date().toISOString().split('T')[0], image_data, status: 'PENDING'
  }).select('id').single();
  res.json({ id: data?.id });
});

app.get("/api/prescriptions", authenticateToken, async (req: any, res) => {
  let query = supabase.from('prescriptions').select('*, users(name)');
  if (!['MASTER_ADMIN', 'INSTITUTION_ADMIN', 'Admin-Pharmacology'].includes(req.user.role)) {
    query = query.eq('department', req.user.department || 'General');
  }
  const { data } = await query.order('created_at', { ascending: false });
  // Map users.name to uploader_name for frontend compatibility
  const mapped = (data || []).map((p: any) => ({ ...p, uploader_name: p.users?.name }));
  res.json(mapped);
});

app.patch("/api/prescriptions/:id", authenticateToken, async (req, res) => {
  const { verified_text, raw_text, status, evaluation_result } = req.body;
  let updates: any = { verified_text, status };
  if (evaluation_result) updates.evaluation_result = JSON.stringify(evaluation_result);
  if (raw_text !== undefined) updates.raw_text = raw_text;
  await supabase.from('prescriptions').update(updates).eq('id', req.params.id);
  res.json({ success: true });
});

// Med Error Prescription Audit
app.post("/api/med-error-prescriptions/upload", authenticateToken, async (req: any, res) => {
  const { image_data, department, prescription_date } = req.body;
  const { data } = await supabase.from('med_error_prescriptions').insert({
     uploader_id: req.user.id, department: department || 'General', prescription_date: prescription_date || new Date().toISOString().split('T')[0], image_data, status: 'PENDING'
  }).select('id').single();
  res.json({ id: data?.id });
});

app.get("/api/med-error-prescriptions", authenticateToken, async (req: any, res) => {
  let query = supabase.from('med_error_prescriptions').select('*, users(name)');
  if (!['MASTER_ADMIN', 'INSTITUTION_ADMIN', 'Admin-Pharmacology'].includes(req.user.role)) {
    query = query.eq('department', req.user.department || 'General');
  }
  const { data } = await query.order('created_at', { ascending: false });
  const mapped = (data || []).map((p: any) => ({ ...p, uploader_name: p.users?.name }));
  res.json(mapped);
});

app.patch("/api/med-error-prescriptions/:id", authenticateToken, async (req, res) => {
  const { verified_text, raw_text, status, evaluation_result } = req.body;
  let updates: any = { verified_text, status };
  if (evaluation_result) updates.evaluation_result = JSON.stringify(evaluation_result);
  if (raw_text !== undefined) updates.raw_text = raw_text;
  await supabase.from('med_error_prescriptions').update(updates).eq('id', req.params.id);
  res.json({ success: true });
});

// Consolidated Reports
app.get("/api/consolidated-reports", authenticateToken, async (req: any, res) => {
  const { data } = await supabase.from('consolidated_reports').select('*').order('month', { ascending: false });
  res.json(data || []);
});

app.post("/api/consolidated-reports", authenticateToken, async (req: any, res) => {
  const { month, report_data } = req.body;
  const { data: existing } = await supabase.from('consolidated_reports').select('id').eq('month', month).single();
  if (existing) {
    await supabase.from('consolidated_reports').update({ report_data: JSON.stringify(report_data) }).eq('month', month);
  } else {
    await supabase.from('consolidated_reports').insert({ month, report_data: JSON.stringify(report_data) });
  }
  res.json({ success: true });
});

app.delete("/api/consolidated-reports/:id", authenticateToken, async (req: any, res) => {
  await supabase.from('consolidated_reports').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Med Error Consolidated
app.get("/api/med-error-consolidated-reports", authenticateToken, async (req: any, res) => {
  const { data } = await supabase.from('med_error_consolidated_reports').select('*').order('month', { ascending: false });
  res.json(data || []);
});

app.post("/api/med-error-consolidated-reports", authenticateToken, async (req: any, res) => {
  const { month, report_data } = req.body;
  const { data: existing } = await supabase.from('med_error_consolidated_reports').select('id').eq('month', month).single();
  if (existing) {
    await supabase.from('med_error_consolidated_reports').update({ report_data: JSON.stringify(report_data) }).eq('month', month);
  } else {
    await supabase.from('med_error_consolidated_reports').insert({ month, report_data: JSON.stringify(report_data) });
  }
  res.json({ success: true });
});

app.delete("/api/med-error-consolidated-reports/:id", authenticateToken, async (req: any, res) => {
  await supabase.from('med_error_consolidated_reports').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// Pharmacovigilance (ADR)
app.post("/api/adr", authenticateToken, async (req: any, res) => {
  const body = req.body;
  const payload = { ...body, reporter_id: req.user.id, suspected_meds_json: JSON.stringify(body.suspected_meds || []), concomitant_meds: JSON.stringify(body.concomitant_meds || []) };
  delete payload.suspected_meds;
  
  await supabase.from('adr_reports').insert(payload);
  res.json({ success: true });
});

app.put("/api/adr/:id", authenticateToken, async (req: any, res) => {
  const body = req.body;
  const payload = { ...body, suspected_meds_json: JSON.stringify(body.suspected_meds || []), concomitant_meds: JSON.stringify(body.concomitant_meds || []) };
  delete payload.suspected_meds;
  
  await supabase.from('adr_reports').update(payload).eq('id', req.params.id);
  res.json({ success: true });
});

app.get("/api/adr", authenticateToken, async (req, res) => {
  const { data } = await supabase.from('adr_reports').select('*').order('created_at', { ascending: false });
  const reports = (data || []).map((report: any) => {
    try {
      report.suspected_meds = JSON.parse(report.suspected_meds_json || '[]');
      report.concomitant_meds = JSON.parse(report.concomitant_meds || '[]');
    } catch {
      report.suspected_meds = []; report.concomitant_meds = [];
    }
    return report;
  });
  res.json(reports);
});

// CDS Audits
app.get("/api/cds-audits", authenticateToken, async (req: any, res) => {
  let query = supabase.from('cds_audits').select('*, users(name, department)');
  if (!['MASTER_ADMIN', 'INSTITUTION_ADMIN'].includes(req.user.role)) {
    query = query.eq('uploader_id', req.user.id);
  }
  const { data } = await query.order('created_at', { ascending: false });
  
  res.json((data || []).map((a: any) => ({
    ...a,
    uploader_name: a.users?.name,
    uploader_department: a.users?.department,
    extracted_data: a.extracted_data ? JSON.parse(a.extracted_data) : null,
    ai_recommendations: a.ai_recommendations ? JSON.parse(a.ai_recommendations) : null
  })));
});

app.post("/api/cds-audits", authenticateToken, async (req: any, res) => {
  const { file_data, extracted_data, ai_recommendations } = req.body;
  const { data } = await supabase.from('cds_audits').insert({
    uploader_id: req.user.id, file_data, 
    extracted_data: JSON.stringify(extracted_data), 
    ai_recommendations: JSON.stringify(ai_recommendations), status: 'PENDING_REVIEW'
  }).select('id').single();
  res.json({ id: data?.id, success: true });
});

app.patch("/api/cds-audits/:id", authenticateToken, async (req: any, res) => {
  const { doctor_decision, status } = req.body;
  await supabase.from('cds_audits').update({ doctor_decision, status, updated_at: new Date().toISOString() }).eq('id', req.params.id);
  res.json({ success: true });
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
