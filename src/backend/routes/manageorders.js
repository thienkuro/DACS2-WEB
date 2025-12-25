// backend/routes/manageorders.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // hoặc ../db/index tùy project

// router.use(checkAdmin);
// ==============================
// GET /api/manageorders
// Lấy toàn bộ đơn hàng (admin)
// ==============================
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                o.order_id,
                o.order_code,
                o.user_id,
                u.username,
                o.shipping_name,
                o.phone,
                o.address,
                o.payment_method,
                o.payment_status,
                o.notes,
                o.total_amount,
                o.status,
                o.created_at
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.user_id
            ORDER BY o.created_at DESC
        `);

        res.json(rows);
    } catch (err) {
        console.error("GET manageorders error:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

router.get('/:id/details', async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT
                oi.order_item_id,
                oi.product_id,
                p.name AS product_name,
                oi.quantity,
                oi.price
            FROM orderitems oi
            JOIN products p ON p.product_id = oi.product_id
            WHERE oi.order_id = ?
        `, [id]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server" });
    }
});
// PUT /api/manageorders/item/:itemId
// Cập nhật order item + tính lại tổng tiền
// ==============================
router.put("/item/:id", async (req, res) => {
    const { id } = req.params;
    const { quantity, price } = req.body;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Update order item
        await conn.query(
            `UPDATE orderitems SET quantity = ?, price = ? WHERE order_item_id = ?`,
            [quantity, price, id]
        );

        // 2. Lấy order_id của item đó
        const [[item]] = await conn.query(
            `SELECT order_id FROM orderitems WHERE order_item_id = ?`,
            [id]
        );

        // 3. Tính lại tổng tiền
        const [[sum]] = await conn.query(
            `SELECT SUM(quantity * price) AS total FROM orderitems WHERE order_id = ?`,
            [item.order_id]
        );

        // 4. Update orders.total_amount
        await conn.query(
            `UPDATE orders SET total_amount = ? WHERE order_id = ?`,
            [sum.total || 0, item.order_id]
        );

        await conn.commit();
        res.json({ message: "Cập nhật thành công" });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: "Lỗi server" });
    } finally {
        conn.release();
    }
});



router.post("/", async (req, res) => {
    const {
        order_code,
        user_id,
        shipping_name,
        phone,
        address,
        payment_method,
        payment_status,
        notes,
        total_amount,
        status
    } = req.body;

    try {
        await pool.query(
            `
            INSERT INTO orders
            (order_code, user_id, shipping_name, phone, address,
            payment_method, payment_status, notes, total_amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                order_code,
                user_id || null,
                shipping_name,
                phone,
                address,
                payment_method,
                payment_status,
                notes,
                total_amount,
                status
            ]
        );
        if (
            !order_code ||
            !shipping_name ||
            !phone ||
            !address ||
            !payment_method ||
            !payment_status ||
            !total_amount ||
            !status
        ) {
            return res.status(400).json({ message: "Thiếu dữ liệu" });
        }

        res.json({ message: "Thêm đơn hàng thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server" });
    }
});


// ==============================
// PUT /api/manageorders/:id
// Cập nhật trạng thái đơn
// ==============================
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const {
        order_code,
        shipping_name,
        phone,
        address,
        payment_method,
        payment_status,
        notes,
        total_amount,
        status
    } = req.body;

    try {
        const [result] = await pool.query(
            `
            UPDATE orders SET
                shipping_name = ?,
                phone = ?,
                address = ?,
                payment_method = ?,
                payment_status = ?,
                notes = ?,
                total_amount = ?,
                status = ?
            WHERE order_id = ?
            `,
            [
                order_code,
                shipping_name,
                phone,
                address,
                payment_method,
                payment_status,
                notes,
                total_amount,
                status,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
        }

        res.json({ message: "Cập nhật đơn hàng thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server" });
    }
});


// ==============================
// DELETE /api/manageorders/:id
// Xóa đơn hàng
// ==============================
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            "DELETE FROM orderitems oi WHERE order_id = ?",
            [id]
        );

        const [result] = await conn.query(
            "DELETE FROM orders WHERE order_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
        }

        await conn.commit();
        res.json({ message: "Xóa thành công" });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: "Lỗi server" });
    } finally {
        conn.release();
    }
});


module.exports = router;
