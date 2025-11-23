// js/header.js
class HeaderManager {
    constructor() {
        this.init();
    }

    init() {
        // Đợi header được load vào DOM rồi mới chạy
        if (document.getElementById('header-placeholder')?.innerHTML.trim()) {
            this.setup();
        } else {
            // Nếu header chưa load xong → quan sát DOM
            const observer = new MutationObserver((mutations, obs) => {
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

    setup() {
        this.bindHoverEvents();
        this.bindModalEvents();
        console.log("Header script đã được khởi chạy thành công!");
    }

    bindHoverEvents() {
        const container = document.querySelector('.login-container');
        const popup = document.getElementById('loginPopup');
        let timeout;

        const show = () => { clearTimeout(timeout); popup.style.display = 'block'; };
        const hide = () => { timeout = setTimeout(() => popup.style.display = 'none', 200); };

        if (container && popup) {
            container.addEventListener('mouseenter', show);
            container.addEventListener('mouseleave', hide);
            popup.addEventListener('mouseenter', show);
            popup.addEventListener('mouseleave', hide);
        }
    }

    bindModalEvents() {
        document.getElementById('btnLogin')?.addEventListener('click', () => this.showLogin());
        document.getElementById('btnRegister')?.addEventListener('click', () => this.showRegister());

        document.getElementById('authModalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
    }

    showLogin() {
        this.openModal(this.getLoginHTML(), 'modallogin');
    }

    showRegister() {
        this.openModal(this.getRegisterHTML(), 'modalregis');
    }

    openModal(content, className) {
        const overlay = document.getElementById('authModalOverlay');
        overlay.innerHTML = `<div class="${className}">${content}</div>`;
        overlay.classList.add('active');
    }

    closeModal() {
        const overlay = document.getElementById('authModalOverlay');
        overlay.classList.remove('active');
        overlay.innerHTML = '';
    }

    getLoginHTML() {
        return `
            <div class="modal-content">
                <h2 style="text-align:center;margin-bottom:20px">ĐĂNG NHẬP TÀI KHOẢN</h2>
                <form onsubmit="event.preventDefault()">
                    <div class="input-container"><i class='bx bx-envelope'></i><input type="email" placeholder="Email" required></div>
                    <div class="input-container"><i class='bx bx-lock'></i><input type="password" placeholder="Mật khẩu" required></div>
                    <a href="#" style="display:block;text-align:right;margin:10px 0"><u>Quên mật khẩu?</u></a>
                    <button type="submit" style="width:100%;padding:12px;background:#e63946;color:white;border:none;border-radius:6px"><b>ĐĂNG NHẬP</b></button>
                </form>
                <div style="margin:20px 0;position:relative;text-align:center"><hr style="border:none;border-top:1px solid #ddd"><span style="background:white;padding:0 10px;position:absolute;top:-10px;left:50%;transform:translateX(-50%)">hoặc đăng nhập bằng</span></div>
                <div class="social-buttons">
                    <button class="google"><i class='bx bxl-google'></i> Google</button>
                    <button class="facebook"><i class='bx bxl-facebook'></i> Facebook</button>
                </div>
                <p style="margin-top:20px">Chưa có tài khoản? <a href="#" onclick="headerManager.showRegister()">Đăng ký ngay!</a></p>
            </div>`;
    }

    getRegisterHTML() {
        return `
            <div class="modal-content-regis">
                <h2 style="text-align:center;margin-bottom:20px">ĐĂNG KÝ TÀI KHOẢN</h2>
                <form onsubmit="event.preventDefault()">
                    <div class="input-container"><i class='bx bx-envelope'></i><input type="email" placeholder="Email" required></div>
                    <div class="input-container"><i class='bx bx-user'></i><input type="text" placeholder="Họ" required></div>
                    <div class="input-container"><i class='bx bx-user'></i><input type="text" placeholder="Tên" required></div>
                    <div class="input-container"><i class='bx bx-lock'></i><input type="password" placeholder="Mật khẩu" required></div>
                    <button type="submit" style="width:100%;padding:12px;background:#e63946;color:white;border:none;border-radius:6px;margin-top:15px"><b>TẠO TÀI KHOẢN</b></button>
                </form>
                <div style="margin:20px 0;position:relative;text-align:center"><hr style="border:none;border-top:1px solid #ddd"><span style="background:white;padding:0 10px;position:absolute;top:-10px;left:50%;transform:translateX(-50%)">hoặc đăng ký bằng</span></div>
                <div class="social-buttons">
                    <button class="google"><i class='bx bxl-google'></i> Google</button>
                    <button class="facebook"><i class='bx bxl-facebook'></i> Facebook</button>
                </div>
                <p style="margin-top:20px">Đã có tài khoản? <a href="#" onclick="headerManager.showLogin()">Đăng nhập</a></p>
            </div>`;
    }
}

// Khởi động khi DOM sẵn sàng + header đã được load
document.addEventListener('DOMContentLoaded', () => {
    window.headerManager = new HeaderManager();
});