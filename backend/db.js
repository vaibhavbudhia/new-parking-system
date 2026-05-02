const mysql = require('mysql2');

const db = mysql.createConnection({
    host     : process.env.MYSQLHOST     || 'localhost',
    user     : process.env.MYSQLUSER     || 'root',
    password : process.env.MYSQLPASSWORD || 'Vasura@736',
    database : 'parking_system',
    port     : process.env.MYSQLPORT     || 3306
});

db.connect((err) => {
    if (err) console.log('DB connection failed:', err.message);
    else     console.log('Connected to MySQL');
});

module.exports = db;
