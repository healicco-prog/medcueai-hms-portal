import Database from 'better-sqlite3';
const db = new Database('aimsrc.db');
const stats = db.prepare("SELECT state, count(*) as c FROM institutions GROUP BY state ORDER BY c DESC LIMIT 15").all();
console.log(stats);
