import sqlite3 from 'better-sqlite3';

try {
  const db = new sqlite3('aimsrc.db');
  const term = "para";
  const drugs = db.prepare(`
      SELECT * FROM essential_medicines 
      WHERE generic_description LIKE ? 
      OR group_description LIKE ? 
      OR item_description LIKE ?
    `).all(`%${term}%`, `%${term}%`, `%${term}%`);
  
  console.log(drugs.length);
  
  const allDrugs = db.prepare("SELECT count(*) as c FROM essential_medicines").get();
  console.log("Total:", allDrugs.c);
} catch (e) {
  console.error("ERROR:");
  console.error(e.message);
}
