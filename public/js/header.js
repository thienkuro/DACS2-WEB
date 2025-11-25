// public/js/header.js
class HeaderManager {
    constructor() {
        this.API_URL = 'http://127.0.0.1:3000/api/auth';
        this.user = null;
        this.init();
    }

    async init() {
        await this.checkLoginStatus();
        if (document.getElementById('header-placeholder')?.innerHTML.trim()) {
            this.setup();
        } else {
            const observer = new MutationObserver((_, obs) => {
                if (document.querySelector('.login-container')) {
                    this.setup();
                    obs.disconnect();
                }
            });
            observer.observe(document.getElementById('header-placeholder'), {
                childList: true,
                subtree: true
            });
        }
    }

    async checkLoginStatus() {
        try {
            const res = await fetch(`${this.API_URL}/check`, { credentials: 'include' });
            const data = await res.json();
            if (data.logged_in) {
                this.user = data.username;
                this.updateUserUI();
            }
        } catch (err) {
            console.error('Check login failed:', err);
        }
    }

    setup() {
        // Cập nhật badge giỏ hàng nếu module Cart có
        if (typeof Cart !== 'undefined') {
            setTimeout(()=> Cart.renderCartBadge(), 50);
        }
        if (this.user) {
            this.updateUserUI();
            this.bindAvatarHoverEvents();
            return;
        }
        this.bindHoverEvents();
        this.bindModalEvents();
        console.log("Header script đã được khởi chạy thành công!");
    }

    bindHoverEvents() {
        const container = document.querySelector('.login-container');
        const popup = document.getElementById('loginPopup');
        if (!container || !popup) return;
        let timeout;
        const show = () => { clearTimeout(timeout); popup.style.display = 'block'; };
        const hide = () => { timeout = setTimeout(() => popup.style.display = 'none', 200); };
        container.addEventListener('mouseenter', show);
        container.addEventListener('mouseleave', hide);
        popup.addEventListener('mouseenter', show);
        popup.addEventListener('mouseleave', hide);
    }

    bindAvatarHoverEvents() {
        const avatar = document.querySelector('.user-avatar');
        const dropdown = document.querySelector('.user-dropdown');
        if (!avatar || !dropdown) return;
        let isHovering = false;
        const showDropdown = () => {
            isHovering = true;
            dropdown.style.display = 'block';
            dropdown.style.opacity = '1';
            dropdown.style.transform = 'translateY(0)';
        };
        const hideDropdown = () => {
            isHovering = false;
            setTimeout(() => {
                if (!isHovering) {
                    dropdown.style.display = 'none';
                    dropdown.style.opacity = '0';
                    dropdown.style.transform = 'translateY(-10px)';
                }
            }, 100);
        };
        avatar.addEventListener('mouseenter', showDropdown);
        dropdown.addEventListener('mouseenter', showDropdown);
        avatar.addEventListener('mouseleave', () => {
            if (!dropdown.matches(':hover')) hideDropdown();
        });
        dropdown.addEventListener('mouseleave', hideDropdown);
    }

    bindModalEvents() {
        document.getElementById('btnLogin')?.addEventListener('click', () => this.showLogin());
        document.getElementById('btnRegister')?.addEventListener('click', () => this.showRegister());
        document.getElementById('authModalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
    }

    showLogin() { this.openModal(this.getLoginHTML(), 'modallogin'); }
    showRegister() { this.openModal(this.getRegisterHTML(), 'modalregis'); }

    openModal(content, className) {
        const overlay = document.getElementById('authModalOverlay');
        overlay.innerHTML = `<div class="${className}">${content}</div>`;
        overlay.classList.add('active');
    }

    closeModal() {
        const overlay = document.getElementById('authModalOverlay');
        overlay.classList.remove('active');
        setTimeout(() => overlay.innerHTML = '', 300);
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value.trim();
        const username = form.querySelector('input[placeholder="Tên người dùng"]').value.trim();
        const password = form.querySelector('input[type="password"]').value;
        if (!email || !username || !password) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }
        try {
            const res = await fetch(`${this.API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, username, password })
            });
            const data = await res.json();
            if (data.success) {
                alert('Đăng ký thành công! Chào ' + username);
                this.user = username;
                this.updateUserUI();
                this.bindAvatarHoverEvents();
                this.closeModal();
            } else {
                alert(data.error || 'Đăng ký thất bại');
            }
        } catch (err) {
            alert('Lỗi kết nối server');
            console.error(err);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value.trim();
        const password = form.querySelector('input[type="password"]').value;
        try {
            const res = await fetch(`${this.API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                alert('Đăng nhập thành công! Chào ' + data.user.username);
                this.user = data.user.username;
                this.updateUserUI();
                this.bindAvatarHoverEvents();
                this.closeModal();
            } else {
                alert(data.error || 'Sai email hoặc mật khẩu');
            }
        } catch (err) {
            alert('Lỗi kết nối server');
            console.error(err);
        }
    }

    async logout() {
        await fetch(`${this.API_URL}/logout`, { method: 'POST', credentials: 'include' });
        this.user = null;
        location.reload();
    }

    updateUserUI() {
        const container = document.querySelector('.login-container');
        if (!container) return;
        const firstLetter = this.user.charAt(0).toUpperCase();
        container.innerHTML = `
            <div class="user-avatar" title="Xin chào, ${this.user}">
                <span>${firstLetter}</span>
                <div class="user-dropdown">
                    <p>Xin chào, <strong>${this.user}</strong></p>
                    <p style="margin:6px 0">
                    <button onclick="location.href='my-orders.html'" class="btn-primary" style="width:100%;margin-bottom:6px">Đơn hàng của tôi</button>
                    </p>
                    <button onclick="headerManager.logout()" class="logout-btn">Đăng xuất</button>
                </div>
            </div>
        `;
    }

    getLoginHTML() {
        return `
            <div class="modal-content">
                <h2 style="text-align:center;margin-bottom:20px">ĐĂNG NHẬP</h2>
                <form onsubmit="headerManager.handleLogin(event)">
                    <div class="input-container"><i class='bx bx-envelope'></i><input type="email" placeholder="Email" required></div>
                    <div class="input-container"><i class='bx bx-lock'></i><input type="password" placeholder="Mật khẩu" required></div>
                    <button type="submit" class="submit-btn">ĐĂNG NHẬP</button>
                </form>
                <p style="margin-top:15px; text-align:center">
                    Chưa có tài khoản? <a href="#" onclick="headerManager.showRegister()">Đăng ký</a>
                </p>
            </div>`;
    }

    getRegisterHTML() {
        return `
            <div class="modal-content-regis">
                <h2 style="text-align:center;margin-bottom:20px">ĐĂNG KÝ TÀI KHOẢN</h2>
                <form onsubmit="headerManager.handleRegister(event)">
                    <div class="input-container"><i class='bx bx-envelope'></i><input type="email" placeholder="Email" required></div>
                    <div class="input-container"><i class='bx bx-user'></i><input type="text" placeholder="Tên người dùng" required></div>
                    <div class="input-container"><i class='bx bx-lock'></i><input type="password" placeholder="Mật khẩu" required></div>
                    <button type="submit" class="submit-btn">TẠO TÀI KHOẢN</button>
                </form>
                <p style="margin-top:15px; text-align:center">
                    Đã có tài khoản? <a href="#" onclick="headerManager.showLogin()">Đăng nhập</a>
                </p>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.headerManager = new HeaderManager();
    // Cập nhật badge (nếu Cart đã load)
    if (typeof Cart !== 'undefined') Cart.renderCartBadge();
});