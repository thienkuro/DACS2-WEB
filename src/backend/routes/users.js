// backend/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Lấy toàn bộ user
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT user_id, username, email, role, created_at FROM users");
        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// Lấy user theo ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT user_id, username, email, role, created_at FROM users WHERE user_id = ?", [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy user" });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

router.post('/add', async (req, res) => {
    try {
        const { username, email, role, password } = req.body;
        if (!username || !email || !role || !password) {
            return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
        }

        // Thêm vào database
        const [result] = await db.execute(
            "INSERT INTO users (username, email, role, password, created_at) VALUES (?, ?, ?, ?, NOW())",
            [username, email, role, password]
        );

        res.json({ message: "Thêm user thành công", userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;
