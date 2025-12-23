document.addEventListener("DOMContentLoaded", () => {
    loadUsers();

    // Form submit
    const form = document.getElementById('add-user-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            role: formData.get('role'),
            password: formData.get('password')
        };

        try {
            const res = await fetch('http://127.0.0.1:3000/api/users/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok) {
                alert(result.message);

                addUser({
                    id: result.userId,
                    username: data.username,
                    email: data.email,
                    role: data.role,
                    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
                });

                form.reset();
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi server, thử lại sau.');
        }
    });
});

// Load danh sách user
function loadUsers() {
    fetch("http://127.0.0.1:3000/api/users", { method: "GET", credentials: "include" })
        .then(res => res.json())
        .then(res => {
            const tbody = document.getElementById("user-list");
            tbody.innerHTML = "";

            if (!res.success || res.data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center">Không có dữ liệu</td></tr>`;
                return;
            }

            res.data.forEach(user => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="text-center">${user.user_id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td class="text-center">${user.role}</td>
                    <td class="text-center">${user.created_at}</td>
                    <td class="text-center">
                        <button class="action-btn text-primary" onclick="editUser(${user.user_id})" title="Sửa">
                            <i class='bx bx-edit-alt'></i>
                        </button>
                        <button class="action-btn text-danger" onclick="deleteUser(${user.user_id})" title="Xóa">
                            <i class='bx bx-trash'></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(err => console.error(err));
}

// Hàm sửa user (ví dụ alert trước)
function editUser(id) {
    alert('Chức năng sửa user ID: ' + id);
}

// Hàm xóa user
function deleteUser(id) {
    if (!confirm('Bạn có chắc muốn xóa user ID: ' + id + '?')) return;

    fetch(`http://127.0.0.1:3000/api/users/${id}`, { method: 'DELETE', credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Xóa thành công!');
                loadUsers(); // reload danh sách
            } else {
                alert('Xóa thất bại!');
            }
        })
        .catch(err => console.error(err));
}

// Hàm thêm user vào bảng
function addUser(user) {
    const tbody = document.getElementById("user-list");
    const row = `
        <tr>
            <td class="text-center">${user.user_id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td class="text-center">${user.role}</td>
            <td class="text-center">${user.created_at}</td>
            <td class="text-center">
                <button class="action-btn text-primary" title="Sửa" onclick="editUser(${user.user_id})">
                    <i class='bx bx-edit-alt'></i>
                </button>
                <button class="action-btn text-danger" title="Xóa" onclick="deleteUser(${user.user_id})">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
        </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", row);
}

