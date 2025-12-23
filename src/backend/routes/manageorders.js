// backend/routes/manageorders.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // hoặc ../db/index tùy project

router.use(checkAdmin);
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

// ==============================
// PUT /api/manageorders/:id
// Cập nhật trạng thái đơn
// ==============================
router.put("/:id", async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
        return res.status(400).json({ error: "Thiếu trạng thái" });
    }

    try {
        const [result] = await pool.query(
            "UPDATE orders SET status = ? WHERE order_id = ?",
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
        }

        res.json({ message: "Cập nhật thành công" });
    } catch (err) {
        console.error("PUT manageorders error:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// ==============================
// DELETE /api/manageorders/:id
// Xóa đơn hàng
// ==============================
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query(
            "DELETE FROM orders WHERE order_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
        }

        res.json({ message: "Xóa thành công" });
    } catch (err) {
        console.error("DELETE manageorders error:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

module.exports = router;
