import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "aimsrc_secret_key_2026";
const token = jwt.sign({ id: 1, role: 'MASTER_ADMIN', email: 'drnarayanak@gmail.com', department: 'Pharmacology' }, JWT_SECRET);

fetch('http://localhost:3005/api/users/1', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ role: 'Institute Admin', status: 'APPROVED' })
}).then(res => res.text()).then(console.log).catch(console.error);
