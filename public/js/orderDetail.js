(function(){
    function qs(name){ return new URLSearchParams(location.search).get(name); }
    function formatPrice(v){ try { return Number(v).toLocaleString('vi-VN',{style:'currency',currency:'VND'});} catch { return v + ' ₫'; } }

    async function loadOrder() {
        const id = qs('order_id');
        const msgEl = document.getElementById('orderMessage');
        const infoEl = document.getElementById('orderInfo');
        if (!id) {
            msgEl.textContent = 'Thiếu tham số order_id.';
            return;
        }
        try {
            const res = await fetch(`http://127.0.0.1:3000/api/orders/${encodeURIComponent(id)}`, { credentials:'include' });
            if (!res.ok) {
                const err = await res.json().catch(()=>({error:'Lỗi server'}));
                throw new Error(err.error || 'Không tải được đơn hàng.');
            }
            const order = await res.json();
            document.getElementById('odCode').textContent = order.order_code || order.order_id;
            document.getElementById('odDate').textContent = new Date(order.created_at).toLocaleString('vi-VN');
            document.getElementById('odStatus').textContent = order.status;
            document.getElementById('odPayStatus').textContent = order.payment_status;
            document.getElementById('odShipName').textContent = order.shipping_name;
            document.getElementById('odPhone').textContent = order.phone;
            document.getElementById('odAddress').textContent = order.address;
            document.getElementById('odPaymentMethod').textContent = order.payment_method;
            document.getElementById('odTotal').textContent = formatPrice(order.total_amount);

            const itemsWrap = document.getElementById('odItems');
            itemsWrap.innerHTML = order.items.map(it => `
                <div class="order-item-row">
                    <div>
                        <strong>${it.name}</strong><br>
                        Mã: ${it.product_code}
                    </div>
                    <div>Số lượng: ${it.quantity}</div>
                    <div>Đơn giá: ${formatPrice(it.price)}</div>
                    <div>Thành tiền: ${formatPrice(it.price * it.quantity)}</div>
                </div>
            `).join('');
            msgEl.textContent = '';
            infoEl.hidden = false;
        } catch (err) {
            console.error(err);
            msgEl.textContent = err.message;
        }
    }

    window.addEventListener('DOMContentLoaded', loadOrder);
})();