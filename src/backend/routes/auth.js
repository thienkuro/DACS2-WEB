// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// Đăng ký
router.post('/register', async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Thiếu thông tin' });
    }

    try {
        const [existing] = await pool.query(
            'SELECT user_id FROM Users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email hoặc tên người dùng đã tồn tại' });
        }

        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hash]
        );

        req.session.user = { id: result.insertId, username };
        res.json({ success: true, user: { username } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

        req.session.user = { id: user.user_id, username: user.username };
        res.json({ success: true, user: { username: user.username } });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Kiểm tra trạng thái
router.get('/check', (req, res) => {
    if (req.session.user) {
        res.json({ logged_in: true, username: req.session.user.username });
    } else {
        res.json({ logged_in: false });
    }
});

// Đăng xuất
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

module.exports = router;