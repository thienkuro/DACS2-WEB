const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// =======================
// Lấy toàn bộ user
// =======================
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT user_id, username, email, role, created_at FROM users"
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// =======================
// Lấy user theo ID
// =======================
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT user_id, username, email, role, created_at FROM users WHERE user_id = ?",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy user" });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server" });
    }
});

// =======================
// Thêm user mới
// =======================
router.post('/add', async (req, res) => {
    try {
        // 🔥 BẮT BUỘC
        const { username, email, role, password } = req.body;

        if (!username || !email || !role || !password) {
            return res.status(400).json({ message: "Thiếu dữ liệu" });
        }

        // Check trùng username
        const [exist] = await db.execute(
            "SELECT user_id FROM users WHERE username = ?",
            [username]
        );

        if (exist.length > 0) {
            return res.status(400).json({ message: "Username đã tồn tại" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        await db.execute(
            `INSERT INTO users (username, email, password_hash, role, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [username, email, hashedPassword, role]
        );

        res.json({ message: "Thêm user thành công" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server" });
    }
});

// =======================
// Cập nhật user
// =======================
router.put('/:id', async (req, res) => {
    try {
        const { username, email, role } = req.body;
        const { id } = req.params;

        if (!username || !email || !role) {
            return res.status(400).json({ message: "Thiếu dữ liệu" });
        }

        const [result] = await db.execute(
            "UPDATE users SET username=?, email=?, role=? WHERE user_id=?",
            [username, email, role, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User không tồn tại" });
        }

        res.json({ message: "Cập nhật user thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;
