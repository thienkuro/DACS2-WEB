(function() {
    function formatPrice(v) {
        try { return Number(v).toLocaleString('vi-VN',{style:'currency',currency:'VND'}); }
        catch { return v + ' ₫'; }
    }
    

    function renderCartSummary() {
        const itemsWrap = document.getElementById('checkoutItems');
        const totalQtyEl = document.getElementById('checkoutTotalQty');
        const totalAmountEl = document.getElementById('checkoutTotalAmount');

        const items = Cart.getItems();
        if (!items.length) {
            itemsWrap.innerHTML = '<p>Giỏ hàng trống. <a href="index.html">Quay lại mua sắm</a></p>';
            document.getElementById('submitOrderBtn').disabled = true;
            return;
        }
        document.getElementById('submitOrderBtn').disabled = false;

        itemsWrap.innerHTML = items.map(i => `
            <div class="checkout-item">
                <img src="${Cart.escapeHTML(i.img || 'https://via.placeholder.com/60')}" alt="${Cart.escapeHTML(i.name)}">
                <div>
                    <strong>${Cart.escapeHTML(i.name)}</strong><br>
                    Mã: ${Cart.escapeHTML(i.code)}<br>
                    Giá: ${formatPrice(i.price)}<br>
                    Số lượng: ${i.qty} (còn ${i.stock})
                </div>
                <div class="ci-subtotal">${formatPrice(i.price * i.qty)}</div>
            </div>
        `).join('');

        const totals = Cart.getTotals();
        totalQtyEl.textContent = totals.totalItems;
        totalAmountEl.textContent = formatPrice(totals.totalAmount);
    }

    async function ensureLoggedIn() {
    const res = await fetch('http://127.0.0.1:3000/api/auth/check', { credentials: 'include' });
    const data = await res.json();
    return data.logged_in;
}

    async function submitOrder(e) {
        e.preventDefault();
        const loggedIn = await ensureLoggedIn();
    if (!loggedIn) {
        Toast.show('Vui lòng đăng nhập trước khi thanh toán', 'error');
        return;
    }
        const btn = document.getElementById('submitOrderBtn');
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';

        const form = e.target;
        const fd = new FormData(form);
        const payload = {
            shipping_name: fd.get('shipping_name').trim(),
            phone: fd.get('phone').trim(),
            address: fd.get('address').trim(),
            payment_method: fd.get('payment_method'),
            notes: fd.get('notes')?.trim() || '',
            // userId: truyền nếu có session (ví dụ)
            items: Cart.getItems().map(i => ({ code: i.code, qty: i.qty }))
        };

        if (!payload.items.length) {
            Toast.show('Giỏ hàng trống!', 'error');
            btn.disabled = false;
            btn.textContent = 'Xác nhận thanh toán';
            return;
        }

        try {
            const res = await fetch('http://127.0.0.1:3000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            if (!res.ok) {
                const err = await res.json().catch(()=>({error:'Lỗi server'}));
                throw new Error(err.error || 'Đặt hàng thất bại');
            }
            const data = await res.json();
            Toast.show(`Đặt hàng thành công! Mã đơn: <strong>${data.order_code}</strong>`);
            // Xóa giỏ
            Cart.clear();
            setTimeout(() => {
                location.href = `order.html?order_id=${data.order_id}`;
            }, 1200);
        } catch (err) {
            console.error(err);
            Toast.show(err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Xác nhận thanh toán';
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        renderCartSummary();
        document.getElementById('checkoutForm').addEventListener('submit', submitOrder);
    });
})();