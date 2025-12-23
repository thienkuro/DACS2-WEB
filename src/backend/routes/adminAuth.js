const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

/* ============ ADMIN LOGIN ============ */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.query(
            'SELECT user_id, username, password_hash, role FROM Users WHERE email = ?',
            [email]
        );

        if (users.length === 0)
            return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match)
            return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

        // 🚫 CHỈ ADMIN
        if (user.role !== 'admin')
            return res.status(403).json({ error: 'Không có quyền admin' });

        // ✅ ADMIN SESSION
        req.session.admin = {
            id: user.user_id,
            username: user.username,
            role: user.role
        };

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

/* ============ ADMIN CHECK ============ */
router.get('/check', (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ logged_in: false });
    }

    res.json({
        logged_in: true,
        admin: {
            username: req.session.admin.username
        }
    });
});

/* ============ ADMIN LOGOUT ============ */
router.post('/logout', (req, res) => {
    req.session.admin = null;
    res.clearCookie('connect.sid');
    res.json({ success: true });
});

module.exports = router;
