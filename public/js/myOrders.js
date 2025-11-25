(function(){
    const API_BASE = 'http://127.0.0.1:3000/api/orders';

    function formatPrice(v){
        try { return Number(v).toLocaleString('vi-VN',{style:'currency',currency:'VND'}); }
        catch { return v + ' ₫'; }
    }

    async function checkLogin() {
        try {
            const res = await fetch('http://127.0.0.1:3000/api/auth/check', { credentials:'include' });
            const data = await res.json();
            return data.logged_in;
        } catch {
            return false;
        }
    }

    async function fetchOrders(status='', page=1, limit=10) {
        const url = new URL(API_BASE, window.location.origin);
        url.searchParams.set('page', page);
        url.searchParams.set('limit', limit);
        if (status) url.searchParams.set('status', status);
        const res = await fetch(url.toString(), { credentials:'include' });
        if (!res.ok) {
            const err = await res.json().catch(()=>({error:'Lỗi server'}));
            throw new Error(err.error || 'Không tải được danh sách đơn hàng');
        }
        return res.json();
    }

    function renderOrders(data) {
        const listEl = document.getElementById('ordersList');
        if (!data.orders.length) {
            listEl.innerHTML = `<div class="empty">Chưa có đơn hàng nào.</div>`;
            document.getElementById('pagination').innerHTML = '';
            return;
        }
        listEl.innerHTML = data.orders.map(o => `
            <div class="order-row">
                <div class="order-code">${o.order_code || ('#'+o.order_id)}</div>
                <div class="hide-mobile">${new Date(o.created_at).toLocaleString('vi-VN')}</div>
                <div>${formatPrice(o.total_amount)}</div>
                <div class="order-status ${o.status}">${o.status}</div>
                <div class="order-actions">
                    <button class="btn-primary" data-id="${o.order_id}">Chi tiết</button>
                </div>
            </div>
        `).join('');

        // Pagination
        const pagEl = document.getElementById('pagination');
        let html = '';
        for (let p=1; p <= data.totalPages; p++) {
            html += `<button class="page-btn ${p===data.page?'active':''}" data-p="${p}">${p}</button>`;
        }
        pagEl.innerHTML = html;
    }

    function attachEvents(currentStatus, currentLimit) {
        document.getElementById('ordersList').addEventListener('click', e => {
            const btn = e.target.closest('button[data-id]');
            if (!btn) return;
            const id = btn.getAttribute('data-id');
            localStorage.setItem('lastOrderId', id);
            // Điều hướng tới trang chi tiết đơn
            location.href = `order.html?order_id=${id}`;
        });
        document.getElementById('pagination').addEventListener('click', async e => {
            const b = e.target.closest('.page-btn');
            if (!b) return;
            const page = parseInt(b.getAttribute('data-p'),10);
            await load(currentStatus, page, currentLimit);
        });
    }

    async function load(status='', page=1, limit=10) {
        const msgEl = document.getElementById('ordersMessage');
        msgEl.textContent = 'Đang tải...';
        try {
            const data = await fetchOrders(status, page, limit);
            renderOrders(data);
            msgEl.textContent = '';
            attachEvents(status, limit);
        } catch (err) {
            msgEl.textContent = err.message;
            document.getElementById('ordersList').innerHTML = '';
            document.getElementById('pagination').innerHTML = '';
        }
    }

    window.addEventListener('DOMContentLoaded', async () => {
        const logged = await checkLogin();
        if (!logged) {
            document.getElementById('loginNotice').style.display = 'block';
            document.getElementById('ordersFilter').style.display = 'none';
            return;
        }
        const statusSelect = document.getElementById('statusSelect');
        document.getElementById('reloadBtn').addEventListener('click', ()=> {
            load(statusSelect.value);
        });
        statusSelect.addEventListener('change', ()=> {
            load(statusSelect.value);
        });
        load();
    });
})();