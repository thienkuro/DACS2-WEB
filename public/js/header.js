// public/js/header.js
class HeaderManager {
    constructor() {
        this.API_URL = 'http://127.0.0.1:3000/api/auth'; // Backend Node.js
        this.user = null;
        this.init();
    }

    async init() {
        await this.checkLoginStatus(); // Kiểm tra đã login chưa ngay khi khởi động

        // Đợi header được load vào DOM
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
                this.updateUserUI(); // Hiển thị avatar ngay lập tức
            }
        } catch (err) {
            console.error('Check login failed:', err);
        }
    }

    setup() {
        // Nếu đã đăng nhập → không cần hover popup nữa
        if (this.user) {
            this.updateUserUI();
            this.bindAvatarHoverEvents(); // Thêm hover cho avatar dropdown
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

    // === Mới thêm: Hover cho avatar dropdown với delay ===
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
            }, 100); // Delay nhỏ để chuột di chuyển từ avatar sang dropdown
        };

        // Khi chuột vào avatar hoặc dropdown → hiện
        avatar.addEventListener('mouseenter', showDropdown);
        dropdown.addEventListener('mouseenter', showDropdown);

        // Chỉ khi chuột rời cả 2 → mới tắt
        avatar.addEventListener('mouseleave', () => {
            // Kiểm tra xem chuột có đang ở trong dropdown không
            if (!dropdown.matches(':hover')) {
                hideDropdown();
            }
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
        setTimeout(() => overlay.innerHTML = '', 300); // Delay để animation mượt
    }

    // === XỬ LÝ ĐĂNG KÝ ===
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
                this.bindAvatarHoverEvents(); // Gán lại hover cho avatar mới
                this.closeModal();
            } else {
                alert(data.error || 'Đăng ký thất bại');
            }
        } catch (err) {
            alert('Lỗi kết nối server');
            console.error(err);
        }
    }

    // === XỬ LÝ ĐĂNG NHẬP ===
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
                this.bindAvatarHoverEvents(); // Gán lại hover cho avatar mới
                this.closeModal();
            } else {
                alert(data.error || 'Sai email hoặc mật khẩu');
            }
        } catch (err) {
            alert('Lỗi kết nối server');
            console.error(err);
        }
    }

    // === ĐĂNG XUẤT ===
    async logout() {
        await fetch(`${this.API_URL}/logout`, { method: 'POST', credentials: 'include' });
        this.user = null;
        location.reload(); // Reload để về trạng thái chưa đăng nhập
    }

    // === CẬP NHẬT GIAO DIỆN KHI ĐÃ ĐĂNG NHẬP ===
    updateUserUI() {
        const container = document.querySelector('.login-container');
        if (!container) return;

        const firstLetter = this.user.charAt(0).toUpperCase();

        container.innerHTML = `
            <div class="user-avatar" title="Xin chào, ${this.user}">
                <span>${firstLetter}</span>
                <div class="user-dropdown">
                    <p>Xin chào, <strong>${this.user}</strong></p>
                    <button onclick="headerManager.logout()" class="logout-btn">Đăng xuất</button>
                </div>
            </div>
        `;
    }

    // === HTML MODAL ĐĂNG NHẬP ===
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

    // === HTML MODAL ĐĂNG KÝ ===
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

// Khởi động toàn bộ
document.addEventListener('DOMContentLoaded', () => {
    window.headerManager = new HeaderManager();
});