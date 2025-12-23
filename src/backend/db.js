// backend/db.js
// const mysql = require('mysql2/promise');
// require('dotenv').config();

// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// module.exports = pool;

// backend/db.js
const mysql = require('mysql2/promise'); // Dùng thư viện promise

// Cấu hình theo máy của bạn
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',        // Điền password nếu có
    database: 'gaming_store', // Đổi tên này cho đúng với database trong máy bạn (db_dacs2 hoặc gaming_store)
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;