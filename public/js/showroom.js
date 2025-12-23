document.addEventListener('DOMContentLoaded', () => {
    const REGIONS = {
        "TP.HCM": [
            {
                name: "HOÀNG HOA THÁM",
                address: "78-80-82 Hoàng Hoa Thám, P.12, Q.Tân Bình, TP.HCM",
                map: "https://www.google.com/maps?q=78-80-82+Hoàng+Hoa+Thám,+Tân+Bình",
                img: "https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=RphyZDH9ZlqWPqsOFGRYXg&cb_client=search.gws-prod.gps&w=408&h=240&yaw=273.75818&pitch=0&thumbfov=100"
            },
            {
                name: "KHA VẠN CÂN",
                address: "905 Kha Vạn Cân, P.Linh Tây, TP.Thủ Đức, TP.HCM",
                map: "https://www.google.com/maps?q=905+Kha+Vạn+Cân,+Thủ+Đức",
                img: "https://lh3.googleusercontent.com/p/AF1QipM7Ai23DDBSPQhHEJV-cP6ckYvjZ7h5_cM1ZY6L=w600-h400-k-no"
            },
            {
                name: "TRẦN HƯNG ĐẠO",
                address: "1081-1083 Trần Hưng Đạo, P.5, Q.5, TP.HCM",
                map: "https://www.google.com/maps?q=1081-1083+Trần+Hưng+Đạo,+Q.5",
                img: "https://lh3.googleusercontent.com/p/AF1QipP9QiUq_2gjTwJmjsNPMBW5S4eh3YFEwiwk2w8I=w600-h600-k-no"
            },
            {
                name: "QUANG TRUNG",
                address: "666 Quang Trung, P.11, Q.Gò Vấp, TP.HCM",
                map: "https://www.google.com/maps?q=666+Quang+Trung,+Gò+Vấp",
                img: "https://picsum.photos/seed/hcm-qt/600/400"
            },
            {
                name: "NGUYỄN THỊ MINH KHAI",
                address: "123 Nguyễn Thị Minh Khai, P.Bến Nghé, Q.1, TP.HCM",
                map: "https://www.google.com/maps?q=123+Nguyễn+Thị+Minh+Khai,+Quận+1",
                img: "https://picsum.photos/seed/hcm-ntmk/600/400"
            },
            {
                name: "NGUYỄN HỮU THỌ",
                address: "950 Nguyễn Hữu Thọ, P.Tân Phong, Q.7, TP.HCM",
                map: "https://www.google.com/maps?q=950+Nguyễn+Hữu+Thọ,+Quận+7",
                img: "https://picsum.photos/seed/hcm-nht/600/400"
            }
        ],
        "Hà Nội": [
            {
                name: "THÁI HÀ",
                address: "162-164 Thái Hà, P.Trung Liệt, Q.Đống Đa, Hà Nội",
                map: "https://www.google.com/maps?q=162-164+Thái+Hà,+Đống+Đa",
                img: "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSx5JHC6NHjfTOW-4jvmYeZm9lV3yUfBUpDEm4JKEJZIiQYC5UKoOjQ9x9B0LBfW6onOWKczGsfJ8ZW3ycl6H43uorAJjxfnpugUPil44OF5JqybIQGW9krCLeBSV4LDBvvO-Jo0ig=w408-h306-k-no"
            },
            {
                name: "CẦU GIẤY",
                address: "175 Xuân Thủy, Q.Cầu Giấy, Hà Nội",
                map: "https://www.google.com/maps?q=175+Xuân+Thủy,+Cầu+Giấy",
                img: "https://lh3.googleusercontent.com/p/AF1QipP9QiUq_2gjTwJmjsNPMBW5S4eh3YFEwiwk2w8I=w600-h600-k-no"
            },
            {
                name: "HÀ ĐÔNG",
                address: "12 Trần Phú, Q.Hà Đông, Hà Nội",
                map: "https://www.google.com/maps?q=12+Trần+Phú,+Hà+Đông",
                img: "https://lh3.googleusercontent.com/p/AF1QipM7Ai23DDBSPQhHEJV-cP6ckYvjZ7h5_cM1ZY6L=w600-h400-k-no"
            },
            {
                name: "NGUYỄN TRÃI",
                address: "275 Nguyễn Trãi, Q.Thanh Xuân, Hà Nội",
                map: "https://www.google.com/maps?q=275+Nguyễn+Trãi,+Thanh+Xuân",
                img: "https://picsum.photos/seed/hn-nguyentrai/600/400"
            },
            {
                name: "KIM MÃ",
                address: "265 Kim Mã, Q.Ba Đình, Hà Nội",
                map: "https://www.google.com/maps?q=265+Kim+Mã,+Ba+Đình",
                img: "https://picsum.photos/seed/hn-kimma/600/400"
            },
            {
                name: "CẦU DIỄN",
                address: "199 Hồ Tùng Mậu (Cầu Diễn), Q.Nam Từ Liêm, Hà Nội",
                map: "https://www.google.com/maps?q=199+Hồ+Tùng+Mậu,+Nam+Từ+Liêm",
                img: "https://picsum.photos/seed/hn-caudien/600/400"
            }
        ]
    };

    const tabsEl = document.getElementById('region-tabs');
    const gridEl = document.getElementById('store-grid');
    const filterEl = document.getElementById('storeFilter');
    const mapWrap = document.getElementById('store-map');
    const mapFrame = document.getElementById('mapFrame');

    if (!tabsEl || !gridEl) return;

    function makeEmbedUrl(url) {
        try {
            const u = new URL(url);
            const q = u.searchParams.get('q');
            if (q) return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
            return url;
        } catch {
            return url;
        }
    }

    function setActiveTab(name) {
        tabsEl.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.region === name));
    }

    function renderTabs(initial) {
        tabsEl.innerHTML = Object.keys(REGIONS).map((name, idx) =>
            `<button class="tab${idx === 0 ? ' active' : ''}" data-region="${name}">${name}</button>`
        ).join('');

        tabsEl.querySelectorAll('.tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.region;
                setActiveTab(name);
                renderGrid(name, filterEl.value);
            });
        });

        const start = initial && REGIONS[initial] ? initial : Object.keys(REGIONS)[0];
        setActiveTab(start);
        renderGrid(start, '');
    }

    function renderGrid(region, keyword) {
        const list = REGIONS[region] || [];
        const term = (keyword || '').trim().toLowerCase();
        const filtered = term ? list.filter(s => (s.name + ' ' + s.address).toLowerCase().includes(term)) : list;

        if (!filtered.length) {
            gridEl.innerHTML = `<div class="no-result">Không tìm thấy cửa hàng phù hợp.</div>`;
            return;
        }

        gridEl.innerHTML = filtered.map((s, idx) => `
      <div class="store-card">
        <div class="store-img"><img src="${s.img}" alt="${s.name}"></div>
        <div class="store-body">
          <div class="store-name">Showroom TT SHOP – ${s.name}</div>
          <div class="store-addr"><i class='bx bx-map'></i> ${s.address}</div>
          <div class="store-actions">
            <button class="btn-outline btn-map" data-map="${s.map}"><i class='bx bx-map-pin'></i> Xem bản đồ</button>
            <button class="btn-outline btn-copy" data-copy="${s.address}"><i class='bx bx-copy'></i> Sao chép</button>
          </div>
        </div>
      </div>
    `).join('');

        gridEl.querySelectorAll('.btn-map').forEach(b => {
            b.addEventListener('click', () => {
                const url = b.getAttribute('data-map');
                mapFrame.src = makeEmbedUrl(url);
                mapWrap.hidden = false;
                mapWrap.scrollIntoView({ behavior: 'smooth' });
            });
        });

        gridEl.querySelectorAll('.btn-copy').forEach(b => {
            b.addEventListener('click', async () => {
                const text = b.getAttribute('data-copy');
                try { await navigator.clipboard.writeText(text); b.textContent = 'Đã sao chép'; setTimeout(() => { b.innerHTML = `<i class='bx bx-copy'></i> Sao chép`; }, 1200); } catch { }
            });
        });
    }

    filterEl && filterEl.addEventListener('input', () => {
        const active = tabsEl.querySelector('.tab.active');
        if (!active) return;
        renderGrid(active.dataset.region, filterEl.value);
    });

    // Region from URL ?region=Hà%20Nội
    const urlRegion = new URLSearchParams(location.search).get('region');
    renderTabs(urlRegion);
});
