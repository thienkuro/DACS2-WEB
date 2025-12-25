const API_URL = "http://127.0.0.1:3000/api/users";

const roleMap = {
    admin: "Quản trị viên",
    user: "Người dùng"
};

async function loadUsers() {
    const tbody = document.getElementById("user-list");
    tbody.innerHTML = "";

    const res = await fetch(API_URL);
    const result = await res.json();

    result.data.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${user.user_id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${roleMap[user.role] || user.role}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <i class='bx bx-edit action-btn'
                   onclick="editUser(${user.user_id}, '${user.username}', '${user.email}', '${user.role}')">
                </i>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function editUser(id, username, email, role) {
    const newUsername = prompt("Username:", username);
    const newEmail = prompt("Email:", email);
    const newRole = prompt("Role:", role);

    if (!newUsername || !newEmail || !newRole) return;

    await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: newUsername,
            email: newEmail,
            role: newRole
        })
    });

    loadUsers();
}

document.getElementById("add-user-form").addEventListener("submit", async e => {
    e.preventDefault();

    const data = {
        username: e.target.username.value,
        email: e.target.email.value,
        role: e.target.role.value,
        password: e.target.password.value
    };

    await fetch(`${API_URL}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    e.target.reset();
    loadUsers();
});

loadUsers();
