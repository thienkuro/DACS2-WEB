const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper: Lấy chi tiết sản phẩm kèm ảnh
async function getProduct(whereClause, value) {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT p.product_id, p.product_code, p.name, p.description, p.price,
                    p.category_id, c.name AS category, i.quantity
             FROM Products p
             LEFT JOIN Categories c ON p.category_id = c.category_id
             LEFT JOIN Inventory i ON p.product_id = i.product_id
             WHERE ${whereClause} = ?
             LIMIT 1`,
            [value]
        );
        if (!rows.length) return null;
        const product = rows[0];

        // Lấy ảnh
        const [images] = await conn.query(
            `SELECT image_id, type, url
             FROM ProductImages
             WHERE product_id = ?
             ORDER BY image_id ASC`,
            [product.product_id]
        );

        product.images = images.map(img => ({
            id: img.image_id,
            type: img.type,
            url: img.url
        }));
        product.primaryImage = product.images[0] ? product.images[0].url : null;

        return product;
    } finally {
        conn.release();
    }
}

// GET /api/products - Lấy danh sách sản phẩm
router.get('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        // Lấy thông tin cơ bản
        const [rows] = await conn.query(
            `SELECT p.product_id, p.product_code, p.name, p.description, p.price,
                    p.category_id, c.name AS category, i.quantity
             FROM Products p
             LEFT JOIN Categories c ON p.category_id = c.category_id
             LEFT JOIN Inventory i ON p.product_id = i.product_id
             ORDER BY p.product_id ASC`
        );

        // Lấy ảnh cho tất cả sản phẩm (tối ưu query)
        const ids = rows.map(r => r.product_id);
        let imageMap = {};
        if (ids.length) {
            const [images] = await conn.query(
                `SELECT image_id, product_id, type, url
                 FROM ProductImages
                 WHERE product_id IN (?)
                 ORDER BY image_id ASC`,
                [ids]
            );
            images.forEach(img => {
                if (!imageMap[img.product_id]) imageMap[img.product_id] = [];
                imageMap[img.product_id].push({
                    id: img.image_id,
                    type: img.type,
                    url: img.url
                });
            });
        }

        // Gộp ảnh vào sản phẩm
        const products = rows.map(r => {
            const images = imageMap[r.product_id] || [];
            return {
                id: r.product_id,
                code: r.product_code,
                name: r.name,
                description: r.description,
                price: Number(r.price),
                categoryId: r.category_id,
                category: r.category,
                quantity: r.quantity ?? 0,
                images,
                primaryImage: images[0] ? images[0].url : null
            };
        });

        res.json({ products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
});

// GET /api/products/:id - Lấy theo ID
router.get('/:id(\\d+)', async (req, res) => {
    try {
        const product = await getProduct('p.product_id', req.params.id);
        if (!product) return res.status(404).json({ error: 'Not found' });
        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/products/code/:code - Lấy theo Mã (MLT01...)
router.get('/code/:code', async (req, res) => {
    try {
        const product = await getProduct('p.product_code', req.params.code);
        if (!product) return res.status(404).json({ error: 'Not found' });
        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
