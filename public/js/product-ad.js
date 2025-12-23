document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("productGrid");
    const noResult = document.getElementById("noResult");
    const keyDisplay = document.getElementById("searchKeyword");

    const params = new URLSearchParams(window.location.search);
    const keyword = params.get("q");

    keyDisplay.textContent = keyword ? `Từ khóa: "${keyword}"` : "";

    if (!keyword) {
        noResult.hidden = false;
        noResult.textContent = "Không có từ khóa tìm kiếm.";
        return;
    }

    fetch(`/products?q=${encodeURIComponent(keyword)}`)
        .then(res => res.json())
        .then(list => {
            if (!list || list.length === 0) {
                noResult.hidden = false;
                return;
            }

            grid.innerHTML = list.map(p => `
                <a href="product_detail.html?id=${p.id}" class="product-card">
                    <img src="${p.thumbnail}" alt="${p.name}">
                    <div class="product-name">${p.name}</div>
                    <div class="product-price">${p.price.toLocaleString()}₫</div>
                </a>
            `).join('');
        })
        .catch(err => {
            console.error("Lỗi load sản phẩm:", err);
            noResult.hidden = false;
            noResult.textContent = "Có lỗi khi tải sản phẩm.";
        });
});
