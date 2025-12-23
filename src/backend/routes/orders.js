const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ==========================  
   TẠO MÃ ĐƠN
========================== */
function genOrderCode() {
    return 'ORD' +
        Date.now().toString(36).toUpperCase() +
        Math.random().toString(36).substring(2, 6).toUpperCase();
}

/* ==========================  
   MIDDLEWARE CHECK LOGIN
========================== */
function requireLogin(req, res, next) {
    if (!req.session?.user?.id) {
        // Nếu render HTML, redirect sang login
        if (req.originalUrl.startsWith('/manage')) return res.redirect('/login');
        return res.status(401).json({ error: "Bạn cần đăng nhập trước" });
    }
    next();
}

/* ==========================  
   GET /api/orders 
   Lấy danh sách đơn hàng (API)
========================== */
router.get('/', requireLogin, async (req, res) => {
    const userId = req.session.user.id;

    const status = req.query.status;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(5, Number(req.query.limit || 10)));
    const offset = (page - 1) * limit;

    let where = "user_id = ?";
    const params = [userId];

    if (status && ['pending','paid','shipped','completed','cancelled'].includes(status)) {
        where += " AND status = ?";
        params.push(status);
    }

    const conn = await pool.getConnection();

    try {
        const [rows] = await conn.query(
            `
            SELECT SQL_CALC_FOUND_ROWS
                order_id, order_code, total_amount, status,
                payment_status, payment_method, shipping_name, phone, address, notes, created_at
            FROM orders
            WHERE ${where}
            ORDER BY order_id DESC
            LIMIT ? OFFSET ?
            `,
            [...params, limit, offset]
        );

        const [[count]] = await conn.query("SELECT FOUND_ROWS() AS total");

        res.json({
            page,
            limit,
            total: count.total,
            totalPages: Math.ceil(count.total / limit),
            orders: rows
        });

    } catch (err) {
        console.error("LIST ORDERS FAILED:", err);
        res.status(500).json({ error: "Server error" });
    } finally {
        conn.release();
    }
});


/* ==========================  
   POST /api/orders  
   Tạo đơn hàng mới
========================== */
router.post('/', requireLogin, async (req, res) => {
    const userId = req.session.user.id;

    const {
        shipping_name,
        phone,
        address,
        payment_method = 'cod',
        notes = '',
        items
    } = req.body;

    if (!shipping_name || !phone || !address) {
        return res.status(400).json({ error: "Thiếu thông tin giao hàng" });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Danh sách sản phẩm trống" });
    }

    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const codes = items.map(i => i.code);

        const [products] = await conn.query(
            `
            SELECT p.product_id, p.product_code, p.name, p.price, i.quantity AS stock
            FROM products p
            LEFT JOIN inventory i ON p.product_id = i.product_id
            WHERE p.product_code IN (?)
            `,
            [codes]
        );

        const map = {};
        products.forEach(p => map[p.product_code] = p);

        let total = 0;
        const orderItems = [];

        for (const it of items) {
            const p = map[it.code];

            if (!p) {
                await conn.rollback();
                return res.status(400).json({ error: `Sản phẩm không tồn tại: ${it.code}` });
            }

            const qty = Math.max(1, Number(it.qty));
            const stock = Number(p.stock || 0);

            if (qty > stock) {
                await conn.rollback();
                return res.status(400).json({
                    error: `Sản phẩm "${p.product_code}" chỉ còn ${stock} trong kho`
                });
            }

            orderItems.push({ product_id: p.product_id, qty, price: p.price });
            total += qty * p.price;
        }

        const order_code = genOrderCode();

        const [insert] = await conn.query(
            `
            INSERT INTO orders (
                order_code, user_id, total_amount, status,
                shipping_name, phone, address,
                payment_method, payment_status, notes
            )
            VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, 'unpaid', ?)
            `,
            [order_code, userId, total, shipping_name, phone, address, payment_method, notes]
        );

        const order_id = insert.insertId;

        for (const it of orderItems) {
            await conn.query(
                `INSERT INTO orderitems (order_id, product_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [order_id, it.product_id, it.qty, it.price]
            );

            await conn.query(
                `UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?`,
                [it.qty, it.product_id]
            );
        }

        await conn.commit();

        res.json({
            success: true,
            order_id,
            order_code,
            total_amount: total,
            payment_method
        });

    } catch (err) {
        await conn.rollback();
        console.error("CREATE ORDER FAILED:", err);
        res.status(500).json({ error: "Server error" });
    } finally {
        conn.release();
    }
});

/* ==========================
   GET /api/orders/:id
   Lấy chi tiết 1 đơn hàng
========================== */
router.get('/:id(\\d+)', requireLogin, async (req, res) => {
    const userId = req.session.user.id;
    const orderId = Number(req.params.id);

    const conn = await pool.getConnection();
    try {
        // Lấy đơn hàng
        const [orders] = await conn.query(
            `
            SELECT
                order_id, order_code, total_amount, status,
                payment_status, payment_method,
                shipping_name, phone, address, notes, created_at
            FROM orders
            WHERE order_id = ? AND user_id = ?
            `,
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
        }

        const order = orders[0];

        // Lấy sản phẩm trong đơn
        const [items] = await conn.query(
            `
            SELECT
                oi.product_id,
                p.product_code,
                p.name,
                oi.quantity,
                oi.price
            FROM orderitems oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
            `,
            [orderId]
        );

        order.items = items;

        res.json(order);

    } catch (err) {
        console.error("GET ORDER DETAIL FAILED:", err);
        res.status(500).json({ error: "Server error" });
    } finally {
        conn.release();
    }
});


module.exports = router;