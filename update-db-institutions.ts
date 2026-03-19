import Database from 'better-sqlite3';

const db = new Database('aimsrc.db');

const cols = db.prepare("PRAGMA table_info(institutions)").all();
const colNames = cols.map((c: any) => c.name);

['head_name', 'head_mobile'].forEach((col) => {
  if (!colNames.includes(col)) {
    db.exec(`ALTER TABLE institutions ADD COLUMN ${col} TEXT`);
    console.log(`Added column ${col}`);
  }
});
console.log('Database schema successfully updated with head_name and head_mobile!');
