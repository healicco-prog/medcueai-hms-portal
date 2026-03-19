import Database from 'better-sqlite3';
const db = new Database('aimsrc.db');
db.prepare("UPDATE users SET role = 'MASTER_ADMIN' WHERE id = 1").run();
console.log("Reverted Master Admin to MASTER_ADMIN.");
