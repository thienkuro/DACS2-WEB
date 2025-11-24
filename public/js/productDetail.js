(function () {
    const API_BASE = 'http://127.0.0.1:3000/api/products';

    function qs(name) { return new URLSearchParams(location.search).get(name); }
    function formatPrice(v) { try { return Number(v).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }); } catch { return v + ' đ'; } }
    function escapeHTML(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

    async function fetchProduct() {
        const code = qs('code');
        const id = qs('id');
        let url;
        if (code) url = API_BASE + '/code/' + encodeURIComponent(code);
        else if (id) url = API_BASE + '/' + encodeURIComponent(id);
        else throw new Error('Thiếu tham số code hoặc id');
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('Không tìm thấy sản phẩm');
        return res.json();
    }

    function render(product) {
        const nameEl = document.getElementById('pdName');
        const descEl = document.getElementById('pdDesc');
        const codeEl = document.getElementById('pdCode');
        const catEl = document.getElementById('pdCategory');
        const stockEl = document.getElementById('pdStock');
        const priceEl = document.getElementById('pdPrice');
        const imgMain = document.getElementById('imageMain');
        const thumbs = document.getElementById('thumbs');
        const msg = document.getElementById('pdMessage');
        const extraGrid = document.getElementById('extraImages');
        const extraSection = document.getElementById('extraSection');
        const breadcrumb = document.getElementById('breadcrumb');

        nameEl.textContent = product.name || 'Không tên';
        descEl.textContent = product.description || '';
        codeEl.textContent = product.product_code || product.code || '—';
        catEl.textContent = product.category || '—';
        stockEl.textContent = (product.quantity ?? '—');
        priceEl.textContent = formatPrice(product.price);
        breadcrumb.innerHTML = `<a href="index.html">Trang chủ</a> / <span>${escapeHTML(product.category || 'Danh mục')}</span> / <strong>${escapeHTML(product.name || 'Sản phẩm')}</strong>`;

        const mainUrl = escapeHTML(product.primaryImage || (product.images && product.images[0] && product.images[0].url) || 'https://via.placeholder.com/640x480?text=No+Image');
        imgMain.innerHTML = `<img src="${mainUrl}" alt="${escapeHTML(product.name || '')}">`;

        const imgs = product.images || [];
        thumbs.innerHTML = imgs.map((im, i) => `<button data-url="${escapeHTML(im.url)}" class="${i === 0 ? 'active' : ''}" aria-label="Ảnh ${i + 1}"><img src="${escapeHTML(im.url)}" alt="thumb ${i + 1}"></button>`).join('');
        thumbs.addEventListener('click', e => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const url = btn.getAttribute('data-url');
            imgMain.innerHTML = `<img src="${url}" alt="${escapeHTML(product.name || '')}">`;
            thumbs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });

        if (imgs.length > 1) {
            extraSection.hidden = false;
            extraGrid.innerHTML = imgs.slice(1).map(im => `<img src="${escapeHTML(im.url)}" alt="${escapeHTML(product.name || '')}">`).join('');
        }

        msg.textContent = '';

        // --- Sản phẩm gợi ý ---
        showSuggest(product);

        // --- Sản phẩm đã xem ---
        saveViewed(product);
        showViewed(product);
        // Hiển thị sản phẩm gợi ý (cùng danh mục, loại trừ sản phẩm hiện tại)
        async function showSuggest(product) {
            const section = document.getElementById('suggestSection');
            const grid = document.getElementById('suggestGrid');
            if (!section || !grid || !product.category) return section && (section.hidden = true);
            try {
                const res = await fetch('http://127.0.0.1:3000/api/products');
                const data = await res.json();
                let products = data.products || [];
                products = products.filter(p => p.category === product.category && (p.product_code || p.code) !== (product.product_code || product.code));
                if (!products.length) return section.hidden = true;
                grid.innerHTML = products.slice(0, 6).map(p => renderCard(p)).join('');
                section.hidden = false;
            } catch { section.hidden = true; }
        }

        // Lưu sản phẩm đã xem vào localStorage
        function saveViewed(product) {
            if (!product || !product.product_code) return;
            let viewed = [];
            try { viewed = JSON.parse(localStorage.getItem('viewedProducts') || '[]'); } catch { }
            // Loại trùng
            viewed = viewed.filter(p => p.product_code !== product.product_code);
            viewed.unshift({
                product_code: product.product_code,
                name: product.name,
                price: product.price,
                primaryImage: product.primaryImage,
                category: product.category
            });
            if (viewed.length > 10) viewed = viewed.slice(0, 10);
            localStorage.setItem('viewedProducts', JSON.stringify(viewed));
        }

        // Hiển thị sản phẩm đã xem
        function showViewed(product) {
            const section = document.getElementById('viewedSection');
            const grid = document.getElementById('viewedGrid');
            if (!section || !grid) return;
            let viewed = [];
            try { viewed = JSON.parse(localStorage.getItem('viewedProducts') || '[]'); } catch { }
            // Loại bỏ sản phẩm hiện tại
            viewed = viewed.filter(p => p.product_code !== (product.product_code || product.code));
            if (!viewed.length) return section.hidden = true;
            grid.innerHTML = viewed.slice(0, 6).map(p => renderCard(p)).join('');
            section.hidden = false;
        }

        // Tạo card sản phẩm nhỏ
        function renderCard(p) {
            const img = p.primaryImage || (p.images && p.images[0] && p.images[0].url) || 'https://via.placeholder.com/480x360?text=No+Image';
            const name = escapeHTML(p.name || '');
            const price = formatPrice(p.price || 0);
            const codeOrId = p.code || p.product_code || p.id || p.product_id;
            const href = codeOrId ? `product.html?code=${encodeURIComponent(codeOrId)}` : '#';
            return `<a href="${href}" title="${name}">
                <img src="${escapeHTML(img)}" alt="${name}">
                <p>${name}<br><strong>${price}</strong></p>
            </a>`;
        }
    }

    async function init() {
        const msg = document.getElementById('pdMessage');
        try {
            const product = await fetchProduct();
            render(product);
        } catch (err) {
            console.error(err);
            msg.textContent = err.message;
        }
    }

    window.addEventListener('DOMContentLoaded', init);
})();
