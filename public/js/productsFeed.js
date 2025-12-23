(function () {
    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatPrice(n) {
        try { return Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }); }
        catch { return n + ' đ'; }
    }

const CATEGORY_MAP = {
    'Chuột': ['Chuột', 'Mouse', 'Chuột + Lót chuột'],
    'Bàn phím': ['Bàn phím', 'Keyboard'],
    'Tai nghe': ['Tai nghe', 'Headset'],
    'Màn hình': ['Màn hình', 'Monitor', 'Display'],
    'RAM, SSD': ['RAM', 'SSD', 'Ổ cứng, RAM, Thẻ nhớ'],
    'Case': ['Case', 'Vỏ máy'],
    'Máy': ['Máy', 'PC', 'Computer'],
};



    async function loadProducts() {
        // Gọi API backend để lấy dữ liệu từ MySQL
        const res = await fetch('http://127.0.0.1:3000/api/products', { credentials: 'include' });
        if (!res.ok) throw new Error('Không tải được danh sách sản phẩm từ API');
        const data = await res.json();
        return Array.isArray(data) ? data : (data.products || []);
    }

    function renderIntoSection(sectionEl, products) {
        const grid = sectionEl.querySelector('.product-grid');
        if (!grid) return;

        const html = products.slice(0, 5).map(p => {
            const img = p.primaryImage || (p.images && p.images[0] && p.images[0].url) || '';
            const name = escapeHTML(p.name || '');
            const price = formatPrice(p.price || 0);
            const safeImg = escapeHTML(img);
            const alt = name;
            const fallback = 'https://via.placeholder.com/480x360?text=No+Image';
            // Ưu tiên dùng mã sản phẩm (code) nếu có, không thì dùng id
            const codeOrId = p.code || p.product_code || p.id || p.product_id;
            const href = codeOrId ? `product.html?code=${encodeURIComponent(codeOrId)}` : '#';
            return `
                <a class="product-item" href="${href}" title="${name}">
                    ${img ? `<img src="${safeImg}" alt="${alt}" loading="lazy" decoding="async" width="480" height="360" onerror="this.onerror=null;this.src='${fallback}';">` : ''}
                    <p>${name}<br><strong>${price}</strong></p>
                </a>`;
        }).join('');

        grid.innerHTML = html || '<p>Chưa có sản phẩm.</p>';
    }

    async function initProducts() {
        try {
            const all = await loadProducts();
            const groups = document.querySelectorAll('.product-list > .product-');
            groups.forEach(group => {
                const titleEl = group.querySelector('h2');
                if (!titleEl) return;
                const title = titleEl.textContent.trim();
                const aliases = CATEGORY_MAP[title] || [title];
                const items = all.filter(p => p.category && aliases.includes(p.category));
                renderIntoSection(group, items);
            });
        } catch (err) {
            console.warn('Không thể hiển thị sản phẩm:', err);
        }
    }

    window.initProducts = initProducts;
})();
