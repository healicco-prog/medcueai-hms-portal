const db = require('better-sqlite3')('database.sqlite');
console.log(db.prepare("SELECT * FROM users").all());
