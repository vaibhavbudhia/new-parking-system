const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSERNAME,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect((err) => {
    if (err) console.log('DB connection failed:', err.message);
    else     console.log('Connected to MySQL');
});

module.exports = db;
