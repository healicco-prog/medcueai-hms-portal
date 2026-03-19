import Database from 'better-sqlite3';
const db = new Database('aimsrc.db');
const users = db.prepare("SELECT * FROM users").all();
console.log(users);
