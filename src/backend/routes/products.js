const express = require('express');
const router = express.Router();
const pool = require('../db');


// Helper lấy 1 sản phẩm đầy đủ
async function getProduct(column, value) {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT p.product_id, p.product_code, p.name, p.description, p.price,
                    p.category_id, c.name AS category, i.quantity, p.refresh_rate
             FROM Products p
             LEFT JOIN Categories c ON p.category_id = c.category_id
             LEFT JOIN Inventory i ON p.product_id = i.product_id
             WHERE ${column} = ?
             LIMIT 1`,
            [value]
        );

        if (!rows.length) return null;
        const product = rows[0];

        const [images] = await conn.query(
            `SELECT image_id, type, url
             FROM ProductImages
             WHERE product_id = ?
             ORDER BY image_id ASC`,
            [product.product_id]
        );

        product.images = images;
        product.primaryImage = images[0]?.url || null;
        return product;

    } finally {
        conn.release();
    }
}

/* ==========================  
   GET /api/products - Danh sách sản phẩm
==========================*/
router.get('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT p.product_id, p.product_code, p.name, p.description, p.price,
                    p.category_id, c.name AS category, i.quantity, p.refresh_rate
             FROM Products p
             LEFT JOIN Categories c ON p.category_id = c.category_id
             LEFT JOIN Inventory i ON p.product_id = i.product_id
             ORDER BY p.product_id ASC`
        );

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

        const products = rows.map(r => {
            const imgs = imageMap[r.product_id] || [];
            return {
                id: r.product_id,
                code: r.product_code,
                name: r.name,
                description: r.description,
                price: Number(r.price),
                categoryId: r.category_id,
                category: r.category,
                quantity: r.quantity ?? 0,
                refreshRate: r.refresh_rate,
                images: imgs,
                primaryImage: imgs[0]?.url || null
            };
        });

        res.json({ products });

    } catch (err) {
        console.error('PRODUCT API ERROR:', err.sqlMessage || err);
        res.status(500).json({ error: err.sqlMessage });
    } finally {
        conn.release();
    }
});

/* ==========================  
   DELETE /api/products/:id  
==========================*/
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const conn = await pool.getConnection();

    try {
        const [result] = await conn.query(
            `DELETE FROM Products WHERE product_id = ?`,
            [id]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });

        res.json({ success: true, message: "Xóa sản phẩm thành công" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server khi xóa sản phẩm" });
    } finally {
        conn.release();
    }
});

/* ==========================  
   SEARCH /api/products/search?q=
==========================*/
router.get('/search', async (req, res) => {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Missing query" });

    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT p.product_id, p.product_code, p.name, p.description, p.price,
                    p.category_id, c.name AS category, i.quantity, p.refresh_rate
             FROM Products p
             LEFT JOIN Categories c ON p.category_id = c.category_id
             LEFT JOIN Inventory i ON p.product_id = i.product_id
             WHERE p.name LIKE ?
             ORDER BY p.product_id ASC`,
            [`%${q}%`]
        );

        if (!rows.length)
            return res.json({ products: [] });

        const ids = rows.map(r => r.product_id);

        const [images] = await conn.query(
            `SELECT image_id, product_id, type, url
             FROM ProductImages
             WHERE product_id IN (?)
             ORDER BY image_id ASC`,
            [ids]
        );

        let map = {};
        images.forEach(img => {
            if (!map[img.product_id]) map[img.product_id] = [];
            map[img.product_id].push(img);
        });

        const products = rows.map(r => {
            const imgs = map[r.product_id] || [];
            return {
                id: r.product_id,
                code: r.product_code,
                name: r.name,
                description: r.description,
                price: Number(r.price),
                categoryId: r.category_id,
                category: r.category,
                quantity: r.quantity ?? 0,
                refreshRate: r.refresh_rate,
                images: imgs,
                primaryImage: imgs[0]?.url || null
            };
        });

        res.json({ products });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    } finally {
        conn.release();
    }
});


/* ==========================  
   GET /api/products/code/:code  
==========================*/
router.get('/code/:code', async (req, res) => {
    try {
        const product = await getProduct("p.product_code", req.params.code);
        if (!product) return res.status(404).json({ error: "Not found" });

        res.json(product);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

/* ==========================  
   GET /api/products/:id  
==========================*/
router.get('/:id(\\d+)', async (req, res) => {
    try {
        const product = await getProduct("p.product_id", req.params.id);
        if (!product) return res.status(404).json({ error: "Not found" });

        res.json(product);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});


/* ==========================  
   PUT /api/products/:id  
==========================*/
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  const {
    imageUrl,
    code,
    name,
    description,
    price,
    categoryId,
    refreshRate
  } = req.body;

  if (!code || !categoryId) {
    return res.status(400).json({
      success: false,
      message: 'Mã sản phẩm và danh mục không được để trống'
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[cat]] = await conn.query(
      'SELECT category_id FROM Categories WHERE category_id=?',
      [categoryId]
    );
    if (!cat) throw new Error('Danh mục không tồn tại');

    const [[dup]] = await conn.query(
      'SELECT product_id FROM Products WHERE product_code=? AND product_id!=?',
      [code, id]
    );
    if (dup) throw new Error('Mã sản phẩm đã tồn tại');

    const [result] = await conn.query(
      `UPDATE Products
       SET product_code=?, name=?, description=?, price=?,
           category_id=?, refresh_rate=?
       WHERE product_id=?`,
      [code, name, description, price, categoryId, refreshRate, id]
    );

    if (result.affectedRows === 0)
      throw new Error('Không tìm thấy sản phẩm');

    // ẢNH
    if (imageUrl !== undefined) {
      if (imageUrl) {
        const [[img]] = await conn.query(
          `SELECT image_id FROM ProductImages
           WHERE product_id=? AND type='primary'`,
          [id]
        );

        if (img) {
          await conn.query(
            `UPDATE ProductImages SET url=? WHERE image_id=?`,
            [imageUrl, img.image_id]
          );
        } else {
          await conn.query(
            `INSERT INTO ProductImages (product_id, type, url)
             VALUES (?, 'primary', ?)`,
            [id, imageUrl]
          );
        }
      } else {
        await conn.query(
          `DELETE FROM ProductImages
           WHERE product_id=? AND type='primary'`,
          [id]
        );
      }
    }
    if (imageUrl && imageUrl.startsWith('data:image')) {
    return res.status(400).json({
        success: false,
        message: 'Chỉ chấp nhận link ảnh (http/https), không chấp nhận base64'
    });
    }

    await conn.commit();
    res.json({ success: true, message: 'Cập nhật thành công' });

  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || 'Lỗi server'
    });
  } finally {
    conn.release();
  }
});


router.post('/', async (req, res) => {
    const {
        code,
        name,
        description,
        price,
        categoryId,
        refreshRate,
        imageUrl
    } = req.body;

    if (!code || !name || !price || !categoryId) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu dữ liệu bắt buộc'
        });
    }

    const conn = await pool.getConnection();
    try {
        // Check trùng mã
        const [[dup]] = await conn.query(
            'SELECT product_id FROM Products WHERE product_code = ?',
            [code]
        );
        if (dup) {
            return res.status(409).json({
                success: false,
                message: 'Mã sản phẩm đã tồn tại'
            });
        }

        // Insert product
        const [result] = await conn.query(
            `INSERT INTO Products
            (product_code, name, description, price, category_id, refresh_rate)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                code,
                name,
                description || null,
                price,
                categoryId,
                refreshRate || null
            ]
        );

        const productId = result.insertId;

        // Insert ảnh
        if (imageUrl) {
            await conn.query(
                `INSERT INTO ProductImages (product_id, type, url)
                 VALUES (?, 'primary', ?)`,
                [productId, imageUrl]
            );
        }
        if (imageUrl && imageUrl.startsWith('data:image')) {
        return res.status(400).json({
            success: false,
            message: 'Chỉ chấp nhận link ảnh (http/https), không chấp nhận base64'
        });
        }

        res.json({
            success: true,
            message: 'Thêm sản phẩm thành công',
            productId
        });

    } catch (err) {
        console.error('POST PRODUCT ERROR:', err.sqlMessage || err);
        res.status(500).json({
            success: false,
            message: err.sqlMessage || 'Lỗi server'
        });
    } finally {
        conn.release();
    }
});

module.exports = router;
