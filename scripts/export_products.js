// Export products from MySQL to a public JSON file for the frontend
// Usage: NODE_ENV vars optional, then run `npm run export:products`
// DB envs: DB_HOST, DB_USER, DB_PASS, DB_PORT, DB_NAME

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        port: Number(process.env.DB_PORT || 3306),
        database: process.env.DB_NAME || 'gaming_store',
    };

    const outDir = path.join(__dirname, '..', 'public', 'data');
    const outFile = path.join(outDir, 'products.json');

    let conn;
    try {
        conn = await mysql.createConnection(config);

        const [rows] = await conn.execute(
            `SELECT 
                 p.product_id,
                 p.product_code,
                 p.name,
                 p.description,
                 p.price,
                 p.category_id,
                 c.name AS category,
                 i.quantity,
                 img.image_id,
                 img.type AS img_type,
                 img.url AS img_url
             FROM Products p
             LEFT JOIN Categories c ON p.category_id = c.category_id
             LEFT JOIN Inventory i ON i.product_id = p.product_id
             LEFT JOIN ProductImages img ON img.product_id = p.product_id
             ORDER BY p.product_id`
        );

        // Group by product
        const byId = new Map();
        for (const r of rows) {
            if (!byId.has(r.product_id)) {
                byId.set(r.product_id, {
                    id: r.product_id,
                    code: r.product_code || null,
                    name: r.name,
                    description: r.description || '',
                    price: Number(r.price),
                    categoryId: r.category_id || null,
                    category: r.category || null,
                    quantity: r.quantity != null ? Number(r.quantity) : null,
                    images: [],
                });
            }
            const item = byId.get(r.product_id);
            if (r.img_url) {
                item.images.push({ id: r.image_id, type: r.img_type, url: r.img_url });
            }
        }

        const products = Array.from(byId.values()).map(p => ({
            ...p,
            primaryImage: p.images.find(i => i.type === 'static')?.url || p.images[0]?.url || null,
        }));

        // Ensure output directory exists
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outFile, JSON.stringify({ updatedAt: new Date().toISOString(), products }, null, 2), 'utf8');

        console.log(`Exported ${products.length} products -> ${path.relative(process.cwd(), outFile)}`);
    } catch (err) {
        console.error('Export failed:', err.message);
        process.exitCode = 1;
    } finally {
        if (conn) await conn.end();
    }
}

main();
