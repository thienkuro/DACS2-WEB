// 1. Import package
const mysql = require('mysql2');

// 2. Thiết lập thông tin kết nối với MySQL Workbench
const connection = mysql.createConnection({
    host: 'localhost',         
    user: 'root',              
    password: '',              
    port: 3306,                
    database: 'db_dacs2' 
});

// 3. Kết nối CSDL:
connection.connect(err => {
    if (err) {
        console.error('Lỗi kết nối MySQL: ' + err.stack);
        return;
    }
    console.log('Kết nối MySQL thành công với ID: ' + connection.threadId);

    // 4. Đóng
    connection.end();
});