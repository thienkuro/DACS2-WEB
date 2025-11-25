// Quản lý giỏ hàng (LocalStorage) với kiểm tra tồn kho
const Cart = {
    STORAGE_KEY: 'cartItems',

    _read() {
        try {
            const arr = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    },

    _write(items) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items } }));
    },

    // STOCK CHECK: kiểm tra tồn kho trước khi thêm
    add(product, qty = 1) {
        if (!product) return;
        const code = product.product_code || product.code || product.id || product.product_id;
        if (!code) return;

        // Lấy tồn kho từ product (quantity). Nếu không có xem như vô hạn.
        const stock = Number(product.quantity ?? product.stock ?? Infinity);
        if (Number.isNaN(stock)) {
            // Nếu dữ liệu hỏng → xem như vô hạn
            console.warn('Stock không hợp lệ, coi như Infinity', product);
        }

        if (stock <= 0) {
            Toast.show(`Sản phẩm <strong>${this.escapeHTML(product.name || 'N/A')}</strong> đã hết hàng!`, 'error');
            return;
        }

        const items = this._read();
        const idx = items.findIndex(i => i.code === code);

        if (idx >= 0) {
            const current = items[idx];
            const newQty = current.qty + qty;
            if (newQty > current.stock) {
                // Vượt quá tồn kho
                Toast.show(`Vượt quá tồn kho. Còn tối đa <strong>${current.stock}</strong> sản phẩm cho "${this.escapeHTML(current.name)}".`, 'error');
                return;
                // Nếu muốn tự động cắt về stock thay vì báo lỗi:
                // current.qty = current.stock;
            } else {
                current.qty = newQty;
                this._write(items);
                Toast.show(`Đã cập nhật <strong>${this.escapeHTML(current.name)}</strong> (x${current.qty}) trong giỏ!`);
            }
        } else {
            // Lần đầu thêm
            const item = {
                code,
                name: product.name || 'Sản phẩm',
                price: Number(product.price || 0),
                img: product.primaryImage || (product.images && product.images[0]?.url) || '',
                qty: Math.min(qty, stock),
                stock: stock // STOCK CHECK: lưu tồn kho
            };
            this._write([...items, item]);
            Toast.show(`Đã thêm <strong>${this.escapeHTML(item.name)}</strong> vào giỏ!`);
        }
    },

    // STOCK CHECK: giới hạn số lượng không vượt stock
    update(code, qty) {
        const items = this._read();
        const it = items.find(i => i.code === code);
        if (!it) return;
        const desired = Math.max(1, qty);
        if (desired > it.stock) {
            Toast.show(`Tồn kho tối đa: <strong>${it.stock}</strong>.`, 'error');
            it.qty = it.stock;
        } else {
            it.qty = desired;
        }
        this._write(items);
    },

    remove(code) {
        let items = this._read();
        items = items.filter(i => i.code !== code);
        this._write(items);
    },

    clear() {
        this._write([]);
    },

    getItems() {
        return this._read();
    },

    getTotals() {
        const items = this._read();
        let totalItems = 0;
        let totalAmount = 0;
        items.forEach(i => {
            totalItems += i.qty;
            totalAmount += i.qty * i.price;
        });
        return { totalItems, totalAmount };
    },

    escapeHTML(str) {
        return String(str)
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#39;');
    },

    formatPrice(v) {
        try { return Number(v).toLocaleString('vi-VN', { style:'currency', currency:'VND' }); }
        catch { return v + ' ₫'; }
    },

    renderCartBadge() {
        const cartIndicator = document.querySelector('.cart-link .cart-badge');
        if (!cartIndicator) return;
        const { totalItems } = this.getTotals();
        cartIndicator.textContent = totalItems;
    },

    renderCartPage() {
        const items = this.getItems();
        const emptyEl = document.getElementById('cartEmpty');
        const contentEl = document.getElementById('cartContent');
        const tbody = document.getElementById('cartTableBody');
        const totalItemsEl = document.getElementById('cartTotalItems');
        const totalAmountEl = document.getElementById('cartTotalAmount');
        const checkoutBtn = document.getElementById('cartCheckoutBtn');

        if (!items.length) {
            emptyEl.hidden = false;
            contentEl.hidden = true;
            return;
        }
        emptyEl.hidden = true;
        contentEl.hidden = false;

        tbody.innerHTML = items.map(i => `
            <tr data-code="${i.code}">
                <td>
                    <div class="cart-item-info">
                        <img src="${this.escapeHTML(i.img || 'https://via.placeholder.com/70?text=No+Image')}" alt="${this.escapeHTML(i.name)}">
                        <span class="cart-item-name">${this.escapeHTML(i.name)}<br><small>Còn: ${i.stock}</small></span>
                    </div>
                </td>
                <td>${this.formatPrice(i.price)}</td>
                <td>
                    <input type="number" min="1" max="${i.stock}" class="cart-qty-input" value="${i.qty}" aria-label="Số lượng">
                </td>
                <td>${this.formatPrice(i.price * i.qty)}</td>
                <td><button class="cart-remove-btn" title="Xóa"><i class='bx bx-trash'></i></button></td>
            </tr>
        `).join('');

        const totals = this.getTotals();
        totalItemsEl.textContent = totals.totalItems;
        totalAmountEl.textContent = this.formatPrice(totals.totalAmount);
        checkoutBtn.disabled = !items.length;

        tbody.addEventListener('input', e => {
            const input = e.target.closest('.cart-qty-input');
            if (!input) return;
            const tr = input.closest('tr');
            const code = tr.dataset.code;
            this.update(code, Number(input.value));
            this.renderCartPage();
        });
        tbody.addEventListener('click', e => {
            const btn = e.target.closest('.cart-remove-btn');
            if (!btn) return;
            const tr = btn.closest('tr');
            const code = tr.dataset.code;
            this.remove(code);
            this.renderCartPage();
        });
    }
};

// Toast đơn giản
const Toast = {
    show(html, type='success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const div = document.createElement('div');
        div.className = 'toast' + (type === 'error' ? ' toast-error' : '');
        div.innerHTML = `<i class='bx ${type === 'error' ? 'bx-error' : 'bx-check-circle'}'></i><span>${html}</span>`;
        container.appendChild(div);
        setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(()=> div.remove(), 600);
        }, 4200);
    }
};

// Cập nhật badge khi giỏ thay đổi
window.addEventListener('cart:updated', () => {
    Cart.renderCartBadge();
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => Cart.renderCartBadge(), 100);
});