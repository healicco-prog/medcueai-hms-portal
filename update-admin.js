import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('aimsrc.db');

const email = 'drnarayanak@gmail.com';
const plainPassword = 'Tata-vidhya@1969';
const hashedPassword = bcrypt.hashSync(plainPassword, 10);

const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

if (user) {
  db.prepare("UPDATE users SET password = ?, role = 'MASTER_ADMIN', status = 'APPROVED' WHERE email = ?").run(hashedPassword, email);
  console.log("Updated existing Master Admin password and role.");
} else {
  db.prepare("INSERT INTO users (name, email, username, password, role, status) VALUES (?, ?, ?, ?, ?, ?)").run(
    "Dr. Narayana",
    email,
    "drnarayanak",
    hashedPassword,
    "MASTER_ADMIN",
    "APPROVED"
  );
  console.log("Created Master Admin.");
}
