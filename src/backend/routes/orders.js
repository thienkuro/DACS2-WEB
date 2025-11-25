const express = require('express');
const router = express.Router();
const pool = require('../db');

function genOrderCode() {
    return 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,6).toUpperCase();
}

function requireLogin(req, res, next) {
    if (!req.session?.user?.id) {
        return res.status(401).json({ error: 'Bạn cần đăng nhập' });
    }
    next();
}

// LIST orders của user hiện tại (GET /api/orders?status=&page=&limit=)
router.get('/', requireLogin, async (req, res) => {
    const userId = req.session.user.id;
    const status = req.query.status && ['pending','paid','shipped','completed','cancelled'].includes(req.query.status)
        ? req.query.status
        : null;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const conn = await pool.getConnection();
    try {
        let where = 'user_id = ?';
        const params = [userId];
        if (status) {
            where += ' AND status = ?';
            params.push(status);
        }

        // Lấy danh sách đơn của user, sắp theo mới nhất
        const [rows] = await conn.query(
            `SELECT SQL_CALC_FOUND_ROWS
                    order_id, order_code, total_amount, status, payment_status,
                    payment_method, created_at
             FROM Orders
             WHERE ${where}
             ORDER BY order_id DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // Lấy tổng bằng FOUND_ROWS
        const [[found]] = await conn.query('SELECT FOUND_ROWS() AS total');
        const total = found?.total ? Number(found.total) : 0;
        const totalPages = Math.ceil(total / limit);

        res.json({
            page,
            limit,
            total,
            totalPages,
            orders: rows
        });
    } catch (err) {
        console.error('LIST ORDERS FAILED:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
});

// CREATE order (yêu cầu login)
router.post('/', requireLogin, async (req, res) => {
    const sessionUserId = req.session.user.id;
    const {
        shipping_name,
        phone,
        address,
        payment_method = 'cod',
        notes = '',
        items
    } = req.body || {};

    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Danh sách sản phẩm trống' });
    if (!shipping_name || !phone || !address) return res.status(400).json({ error: 'Thiếu thông tin giao hàng' });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const codes = items.map(i => i.code);
        const [products] = await conn.query(
            `SELECT p.product_id, p.product_code, p.name, p.price, i.quantity AS stock
             FROM Products p
             LEFT JOIN Inventory i ON p.product_id = i.product_id
             WHERE p.product_code IN (?)`,
            [codes]
        );

        const map = {};
        products.forEach(p => { map[p.product_code] = p; });

        let total = 0;
        const orderItems = [];
        for (const it of items) {
            const p = map[it.code];
            if (!p) { await conn.rollback(); return res.status(400).json({ error: `Sản phẩm không tồn tại: ${it.code}` }); }
            const qty = Math.max(1, Number(it.qty || 0));
            const stock = p.stock == null ? 0 : Number(p.stock);
            if (qty > stock) { await conn.rollback(); return res.status(400).json({ error: `Vượt tồn kho cho ${p.product_code} (còn ${stock})` }); }
            const price = Number(p.price);
            total += qty * price;
            orderItems.push({ product_id: p.product_id, qty, price });
        }

        const order_code = genOrderCode();
        const [orderResult] = await conn.query(
            `INSERT INTO Orders (order_code, user_id, total_amount, status,
                                 shipping_name, phone, address, payment_method,
                                 payment_status, notes)
             VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, 'unpaid', ?)`,
            [order_code, sessionUserId, total, shipping_name, phone, address, payment_method, notes]
        );
        const order_id = orderResult.insertId;

        for (const oi of orderItems) {
            await conn.query(
                `INSERT INTO OrderItems (order_id, product_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [order_id, oi.product_id, oi.qty, oi.price]
            );
            await conn.query(
                `UPDATE Inventory SET quantity = quantity - ? WHERE product_id = ?`,
                [oi.qty, oi.product_id]
            );
        }

        await conn.commit();
        res.json({ success: true, order_id, order_code, total_amount: total, payment_method });
    } catch (err) {
        await conn.rollback();
        console.error('CREATE ORDER FAILED:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
});

// GET chi tiết theo id (yêu cầu login & chỉ xem đơn của chính user)
router.get('/:id(\\d+)', requireLogin, async (req, res) => {
    const id = req.params.id;
    const userId = req.session.user.id;
    const conn = await pool.getConnection();
    try {
        const [orders] = await conn.query(
            `SELECT order_id, order_code, user_id, total_amount, status, payment_status,
                    shipping_name, phone, address, payment_method, notes, created_at
             FROM Orders WHERE order_id = ? LIMIT 1`,
            [id]
        );
        if (!orders.length) return res.status(404).json({ error: 'Not found' });
        const order = orders[0];
        if (order.user_id !== userId) return res.status(403).json({ error: 'Không có quyền xem đơn hàng này' });

        const [items] = await conn.query(
            `SELECT oi.order_item_id, oi.quantity, oi.price,
                    p.product_code, p.name, p.product_id
             FROM OrderItems oi
             JOIN Products p ON oi.product_id = p.product_id
             WHERE oi.order_id = ?`,
            [id]
        );
        order.items = items;
        res.json(order);
    } catch (err) {
        console.error('GET ORDER FAILED:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
});

// GET chi tiết theo order_code (yêu cầu login & quyền)
router.get('/code/:code', requireLogin, async (req, res) => {
    const code = req.params.code;
    const userId = req.session.user.id;
    const conn = await pool.getConnection();
    try {
        const [orders] = await conn.query(
            `SELECT order_id, order_code, user_id, total_amount, status, payment_status,
                    shipping_name, phone, address, payment_method, notes, created_at
             FROM Orders WHERE order_code = ? LIMIT 1`,
            [code]
        );
        if (!orders.length) return res.status(404).json({ error: 'Not found' });
        const order = orders[0];
        if (order.user_id !== userId) return res.status(403).json({ error: 'Không có quyền xem đơn hàng này' });

        const [items] = await conn.query(
            `SELECT oi.order_item_id, oi.quantity, oi.price,
                    p.product_code, p.name, p.product_id
             FROM OrderItems oi
             JOIN Products p ON oi.product_id = p.product_id
             WHERE oi.order_id = ?`,
            [order.order_id]
        );
        order.items = items;
        res.json(order);
    } catch (err) {
        console.error('GET ORDER CODE FAILED:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
});

module.exports = router;