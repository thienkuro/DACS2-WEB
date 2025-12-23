-- ==============================
-- 1. Tạo cơ sở dữ liệu
-- ==============================
DROP DATABASE IF EXISTS gaming_store;
CREATE DATABASE gaming_store;
USE gaming_store;

-- ==============================
-- 2. Bảng Users
-- ==============================
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer','admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==============================
-- 3. Bảng Categories
-- ==============================
CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- ==============================
-- 4. Bảng Products
-- ==============================
CREATE TABLE Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(20) NOT NULL UNIQUE, -- Mã quy ước: MLT01, KKC01...
    name VARCHAR(100) NOT NULL,               -- Tên hiển thị đầy đủ
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);
-- ==============================
-- 5. Bảng ProductImages (NF4/NF5)
-- ==============================
CREATE TABLE ProductImages (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    type ENUM('static','animated') NOT NULL,
    url VARCHAR(1000) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- ==============================
-- 6. Bảng Inventory
-- ==============================
CREATE TABLE Inventory (
    product_id INT PRIMARY KEY,
    quantity INT NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- ==============================
-- 7. Bảng Orders
-- ==============================
CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending','paid','shipped','completed','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);


-- ==============================
-- 8. Bảng OrderItems
-- ==============================
CREATE TABLE OrderItems (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
ALTER TABLE Orders
    ADD COLUMN order_code VARCHAR(30) UNIQUE AFTER order_id,
    ADD COLUMN shipping_name VARCHAR(100) AFTER user_id,
    ADD COLUMN phone VARCHAR(20) AFTER shipping_name,
    ADD COLUMN address TEXT AFTER phone,
    ADD COLUMN payment_method ENUM('cod','bank_transfer','momo','zalopay') DEFAULT 'cod' AFTER address,
    ADD COLUMN payment_status ENUM('unpaid','paid','failed') DEFAULT 'unpaid' AFTER payment_method,
    ADD COLUMN notes TEXT AFTER payment_status;
-- ==============================
-- 9. Dữ liệu mẫu
-- ==============================
-- Categories
USE gaming_store;
INSERT INTO Categories (name, description) VALUES
('Chuột', 'Chuột gaming hiệu năng cao cho game thủ'),
('Bàn phím', 'Bàn phím cơ chất lượng, nhiều layout và switch'),
('Tai nghe', 'Tai nghe gaming âm thanh sống động, đàm thoại rõ');

-- Products (tham chiếu Category qua subquery để tránh lệ thuộc ID)
INSERT INTO Products (product_code, name, description, price, category_id) VALUES
('MLT01', 'Logitech G Pro X Superlight 2', 'Chuột siêu nhẹ cho eSports, cảm biến Hero 2, độ chính xác cao', 3490000, (SELECT category_id FROM Categories WHERE name='Chuột')),
('MRZ01', 'Razer DeathAdder V3', 'Thiết kế công thái học, cảm biến Focus Pro 30K, switch quang học Gen-3', 2590000, (SELECT category_id FROM Categories WHERE name='Chuột')),
('MGL01', 'Glorious Model O Wireless', 'Chuột tổ ong không dây nhẹ, cảm biến BAMF, thời lượng pin dài', 2190000, (SELECT category_id FROM Categories WHERE name='Chuột')),
('MXF01', 'Xtrfy M8 Wireless', 'Chuột siêu nhẹ, cảm biến PixArt cao cấp, build chắc chắn', 2790000, (SELECT category_id FROM Categories WHERE name='Chuột')),

('KKC01', 'Keychron K2 V2', 'Bàn phím cơ 75%, hot-swap, Bluetooth/USB-C, keycap ABS', 1890000, (SELECT category_id FROM Categories WHERE name='Bàn phím')),
('KAK01', 'Akko 3068B Plus', 'Bàn phím 65%, switch Akko, triple-mode (2.4G/Bluetooth/USB)', 1590000, (SELECT category_id FROM Categories WHERE name='Bàn phím')),
('KDK01', 'Ducky One 3 TKL', 'Bàn phím TKL, hot-swap, foam tiêu âm, keycap PBT Double-shot', 2590000, (SELECT category_id FROM Categories WHERE name='Bàn phím')),
('KNP01', 'NuPhy Air75', 'Bàn phím low-profile 75%, kết nối đa thiết bị, mỏng nhẹ', 2690000, (SELECT category_id FROM Categories WHERE name='Bàn phím')),

('HHX01', 'HyperX Cloud II', 'Tai nghe gaming huyền thoại, âm thanh 7.1, microphone khử ồn', 1590000, (SELECT category_id FROM Categories WHERE name='Tai nghe')),
('HLT01', 'Logitech G Pro X Headset', 'Tai nghe chuyên nghiệp, Blue VO!CE, âm thanh chi tiết', 2490000, (SELECT category_id FROM Categories WHERE name='Tai nghe')),
('HSS01', 'SteelSeries Arctis Nova 7', 'Tai nghe không dây đa nền tảng, pin bền, tiện lợi', 3990000, (SELECT category_id FROM Categories WHERE name='Tai nghe')),
('HRZ01', 'Razer BlackShark V2', 'Âm thanh TriForce Titanium 50mm, microphone USB card', 2190000, (SELECT category_id FROM Categories WHERE name='Tai nghe'));

-- Inventory
INSERT INTO Inventory (product_id, quantity) VALUES
((SELECT product_id FROM Products WHERE name='Logitech G Pro X Superlight 2'), 35),
((SELECT product_id FROM Products WHERE name='Razer DeathAdder V3'), 50),
((SELECT product_id FROM Products WHERE name='Glorious Model O Wireless'), 40),
((SELECT product_id FROM Products WHERE name='Xtrfy M8 Wireless'), 25),
((SELECT product_id FROM Products WHERE name='Keychron K2 V2'), 60),
((SELECT product_id FROM Products WHERE name='Akko 3068B Plus'), 55),
((SELECT product_id FROM Products WHERE name='Ducky One 3 TKL'), 30),
((SELECT product_id FROM Products WHERE name='NuPhy Air75'), 28),
((SELECT product_id FROM Products WHERE name='HyperX Cloud II'), 70),
((SELECT product_id FROM Products WHERE name='Logitech G Pro X Headset'), 45),
((SELECT product_id FROM Products WHERE name='SteelSeries Arctis Nova 7'), 18),
((SELECT product_id FROM Products WHERE name='Razer BlackShark V2'), 32);

-- ProductImages (static placeholders; có thể thay bằng URL ảnh thật trong thư mục public)
INSERT INTO ProductImages (product_id, type, url) VALUES
((SELECT product_id FROM Products WHERE name='Logitech G Pro X Superlight 2'), 'static', 'https://imgs.search.brave.com/9ObE9aWQBCC1nwd7ZSdqJSAthSUS_breGhK4omXZcDs/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/bW9zLmNtcy5mdXR1/cmVjZG4ubmV0L3c4/QmpGcXdNNFN1ZnRM/VGFYMnpXZ0YucG5n'),
((SELECT product_id FROM Products WHERE name='Razer DeathAdder V3'), 'static', 'https://imgs.search.brave.com/s_W2T3Zo_Y4NMJn_QM9f47HFDziOGM4SQ-PsaA4uGTc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/aWRlYWxvLmNvbS9m/b2xkZXIvUHJvZHVj/dC8yMDIzNDEvMy8y/MDIzNDEzNDUvczFf/cHJvZHVrdGJpbGRf/bWF4XzEwL3JhemVy/LWRlYXRoYWRkZXIt/djMuanBn'),
((SELECT product_id FROM Products WHERE name='Glorious Model O Wireless'), 'static', 'https://imgs.search.brave.com/1i-H-i8CFp0rxUezqL2sqK4WoZRJuxwgZJlu50y7eGM/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/dGhlZnBzcmV2aWV3/LmNvbS93cC1jb250/ZW50L3VwbG9hZHMv/MjAyMi8wMS9HbG9y/aW91cy1Nb2RlbC1P/LVdpcmVsZXNzLXJl/YXItcmlnaHQtc2Nh/bGVkLmpwZy53ZWJw'),
((SELECT product_id FROM Products WHERE name='Xtrfy M8 Wireless'), 'static', 'https://imgs.search.brave.com/S2paMsJPSkBuzVWyb0mUuP_8EFZmorX9fX6OLESlNa0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/aW5zdGluY3RnYW1p/bmcuZ2cvMjQ1MjUt/bWVkaXVtX2RlZmF1/bHQvTThXLUJMQUNL/LndlYnA'),

((SELECT product_id FROM Products WHERE name='Keychron K2 V2'), 'static', 'https://imgs.search.brave.com/wMPkwPZ7BmZo5g9JhWsr2HKQskOE6GX_3W4eHbbSetE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/c2hvcGlmeS5jb20v/cy9maWxlcy8xLzAw/NTkvMDYzMC8xMDE3/L3QvNS9hc3NldHMv/a2V5Y2hyb25rMmhv/dHN3YXBwYWJsZXdp/cmVsZXNzbWVjaGFu/aWNhbGtleWJvYXJk/MS0xNjQ2ODE0Njkx/MzQ4LmpwZz92PTE2/NDY4MTQ3MDY'),
((SELECT product_id FROM Products WHERE name='Akko 3068B Plus'), 'static', 'https://imgs.search.brave.com/QRKMFeenCaKrAfpl89VeFwifkoD7vxRi-Kn3jqgPNf8/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMudGNkbi5jb20u/YnIvaW1nL2ltZ19w/cm9kLzM3NDEyMy90/ZWNsYWRvX21lY2Fu/aWNvXzMwNjhiX3Bs/dXNfYmxhY2tfZV9j/eWFuX3JnYl9hbnNp/X3N3aXRjaF9qZWxs/eV9waW5rX2Fra29f/Mzc2NDhfNl9hYjQz/N2JmN2RiOTU5YzQy/NzU1MjBkNDBkZjI2/OGY4MS5qcGc'),
((SELECT product_id FROM Products WHERE name='Ducky One 3 TKL'), 'static', 'https://imgs.search.brave.com/Csy94KyZtApQx86V_VPgK77UOhW30L8vZaQga3IC8RQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/bWFudWEubHMvZ2Fs/bGVyeS81ODk5Njk5/Ni53ZWJw'),
((SELECT product_id FROM Products WHERE name='NuPhy Air75'), 'static', 'https://imgs.search.brave.com/wAEEjblmNhFp-FFd5LdCO6qpaLJqptsY7RVf1OGyOxY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMubW1vcnBnLmNv/bS9pbWFnZXMvY29u/dGVudEltYWdlcy8x/MDIwMjIvTnVwaHlf/QWlyNzVfLV9Pbl9M/YXB0b3BfMi5qcGc'),

((SELECT product_id FROM Products WHERE name='HyperX Cloud II'), 'static', 'https://imgs.search.brave.com/g9L71jrjSXwAXNXMhOv7kaCVQnvVwOu7v2VgCGXQcdA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/bW9zLmNtcy5mdXR1/cmVjZG4ubmV0L01j/ZHhTa3ZjeEdxNXkz/UW52endvSGcuanBn'),
((SELECT product_id FROM Products WHERE name='Logitech G Pro X Headset'), 'static', 'https://imgs.search.brave.com/i8WInjee1lu0y0ggCqSJLPEOasn1TS3te_NzMMdeMOQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/cGNsaXF1aWRhdGlv/bnMuY29tL2ltYWdl/cy9pdGVtcy9sb2dp/dGVjaC1nLXByby14/LXByZW1pdW0td2ly/ZWQtNy0xLWdhbWlu/Zy1oZWFkc2V0LXct/Ymx1ZS12by1jZS5q/cGc'),
((SELECT product_id FROM Products WHERE name='SteelSeries Arctis Nova 7'), 'static', 'https://imgs.search.brave.com/VGS5JdTuxzUWAVpWH79zY7GOqtz2Ny5deGwCnpCDNvo/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/bW9zLmNtcy5mdXR1/cmVjZG4ubmV0L2hV/bnJORmpNWW5nZ1ZG/eTNtenNkRlouanBl/Zw'),
((SELECT product_id FROM Products WHERE name='Razer BlackShark V2'), 'static', 'https://imgs.search.brave.com/FELEXvNbPnsO9oLlH12Qnk4jSVpUo7Q8VRrmIfHUIGQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nYW1lc3RvcC5j/b20vaS9nYW1lc3Rv/cC8yMDAxMDQ2Mi0z/ZjA4NjJjOF9BTFQw/Nj8kcGRwJD93PTEy/NTYmaD02NjQmZm10/PWF1dG8');

-- Thêm 1 sản phẩm mỗi danh mục để đủ 5 sp/nhóm
USE gaming_store;
-- Products bổ sung
INSERT INTO Products (product_code, name, description, price, category_id) VALUES
('MZW01', 'Zowie EC2-CW', 'Chuột không dây hiệu năng cao, cảm biến tiên tiến, tối ưu cho eSports', 2890000, (SELECT category_id FROM Categories WHERE name='Chuột')),
('KLP01', 'Leopold FC750R', 'Bàn phím cơ TKL build chắc chắn, keycap PBT, cảm giác gõ premium', 2590000, (SELECT category_id FROM Categories WHERE name='Bàn phím')),
('HCR01', 'Corsair HS80 RGB Wireless', 'Tai nghe không dây, âm thanh Dolby, micro chất lượng, thiết kế thoải mái', 2990000, (SELECT category_id FROM Categories WHERE name='Tai nghe'));

-- Inventory bổ sung
INSERT INTO Inventory (product_id, quantity) VALUES
((SELECT product_id FROM Products WHERE name='Zowie EC2-CW'), 22),
((SELECT product_id FROM Products WHERE name='Leopold FC750R'), 26),
((SELECT product_id FROM Products WHERE name='Corsair HS80 RGB Wireless'), 20);

-- ProductImages bổ sung (placeholder)
INSERT INTO ProductImages (product_id, type, url) VALUES
((SELECT product_id FROM Products WHERE name='Zowie EC2-CW'), 'static', 'https://imgs.search.brave.com/kVe54rqJulriLyhKHq6hhfoDCVR3WMpuuOfvygzb6gQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9wcmV2/aWV3LnJlZGQuaXQv/em93aWUtZWMtY3ct/c2VyaWVzLW15LWNv/bXBsZXRlLXJldmll/dy12MC0zc29uczF6/emgycGIxLnBuZz93/aWR0aD00MDMyJmZv/cm1hdD1wbmcmYXV0/bz13ZWJwJnM9YzY4/NDYxYWQ0YjM4NTBi/NmJlYzI1MDFiMmY3/ZDE3YjQ5ZGY5ZjE5/Mw'),
((SELECT product_id FROM Products WHERE name='Leopold FC750R'), 'static', 'https://imgs.search.brave.com/gyhmLvUKjkWWFC86HKkkqFd9u-PxnBDv9TYJtyvoMw4/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9wYnMt/cHJvZC5saW51c3Rl/Y2h0aXBzLmNvbS9t/b250aGx5XzIwMjBf/MDMvMjc0OTUzODQ1/X0xlb3BvbGRGQzc1/MFItUFMoQmx1ZS1N/ZXRhbCkzLmpwZy5i/Y2Y3MDA2Y2ZhNjM0/ZTkzOWRiMmQwZDUz/YzczY2E0MS5qcGc'),
((SELECT product_id FROM Products WHERE name='Corsair HS80 RGB Wireless'), 'static', 'https://imgs.search.brave.com/-scESIMh4nZCNZKQtDEjNzACpazm2uMMNYxIPwG_zGQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cy5t/YXhnYW1pbmcuY29t/L2ltZy9iaWxkZXIv/YXJ0aWtsYXIvMjEw/OTIuanBnP209MTY0/NjIyNzE4MSZ3PTcy/MA');


ALTER TABLE Products
ADD COLUMN refresh_rate VARCHAR(50) NULL; 


INSERT INTO Categories (name, description)
VALUES ('Màn hình', 'Màn hình gaming hiệu năng cao dành cho game thủ');

INSERT INTO Products (product_code, name, description, price, category_id, refresh_rate)
VALUES
('MH144A', 'AOC 24G2 144Hz', 'Màn hình gaming 24 inch, 144Hz, IPS, viền mỏng', 3990000,
 (SELECT category_id FROM Categories WHERE name='Màn hình'), '144Hz'),

('MH240A', 'ASUS VG259QM 240Hz', 'Màn hình gaming 24.5 inch, 240Hz, Fast IPS', 6990000,
 (SELECT category_id FROM Categories WHERE name='Màn hình'), '240Hz'),

('MH4KLG', 'LG UltraGear 27GN950 4K', 'Màn hình gaming 27 inch, 4K, Nano IPS, HDR600', 16990000,
 (SELECT category_id FROM Categories WHERE name='Màn hình'), '4K'),

('MHUW34', 'Samsung Odyssey G5 34"', 'Màn hình Ultrawide 34 inch, 165Hz, VA cong', 9990000,
 (SELECT category_id FROM Categories WHERE name='Màn hình'), 'Ultrawide'),

('MHUW4K', 'Gigabyte M34WQ 34" UWQHD', 'Màn hình Ultrawide 34 inch, 4K giả lập, 144Hz, IPS', 12990000,
 (SELECT category_id FROM Categories WHERE name='Màn hình'), 'Ultrawide');


INSERT INTO ProductImages (product_id, type, url) VALUES
((SELECT product_id FROM Products WHERE product_code='MH144A'), 'static', 'https://m.media-amazon.com/images/I/81NEMtk5qPL._AC_SX569_.jpg'),
((SELECT product_id FROM Products WHERE product_code='MH240A'), 'static', 'https://files.pccasegear.com/UserFiles/VG259QM-asus-tuf-vg259qm-fhd-240hz-freesync-hdr-ips-245in-monitor-product3.jpg'),
((SELECT product_id FROM Products WHERE product_code='MH4KLG'),  'static', 'https://www.4kfilme.de/wp-content/uploads/2020/07/LG-UltraGear-27GN950-1.jpg'),
((SELECT product_id FROM Products WHERE product_code='MHUW34'),  'static', 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6445/6445082cv27d.jpg'),
((SELECT product_id FROM Products WHERE product_code='MHUW4K'),  'static', 'https://c1.neweggimages.com/productimage/nb640/24-012-043-01.jpg');


INSERT INTO Inventory (product_id, quantity) VALUES
((SELECT product_id FROM Products WHERE product_code='MH144A'), 40),
((SELECT product_id FROM Products WHERE product_code='MH240A'), 25),
((SELECT product_id FROM Products WHERE product_code='MH4KLG'), 15),
((SELECT product_id FROM Products WHERE product_code='MHUW34'), 20),
((SELECT product_id FROM Products WHERE product_code='MHUW4K'), 18);



SET FOREIGN_KEY_CHECKS = 1;


DELETE FROM products WHERE product_id = 25;

ALTER TABLE Products
DROP FOREIGN KEY Products_ibfk_1;

ALTER TABLE Products
ADD CONSTRAINT fk_products_category
FOREIGN KEY (category_id)
REFERENCES Categories(category_id)
ON DELETE RESTRICT;


ALTER TABLE Products
DROP FOREIGN KEY products_ibfk_1;


ALTER TABLE Products
MODIFY category_id INT NOT NULL;

SELECT
  CONSTRAINT_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gaming_store'
  AND TABLE_NAME = 'Products'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

ALTER TABLE Products DROP FOREIGN KEY fk_products_category;

ALTER TABLE Products
ADD CONSTRAINT fk_products_category_v2
FOREIGN KEY (category_id)
REFERENCES Categories(category_id)
ON DELETE RESTRICT
ON UPDATE CASCADE;


DESCRIBE productimages;



INSERT INTO Categories (name, description)
SELECT 'Case', 'Vỏ máy tính, case PC gaming'
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE name = 'Case');

INSERT INTO Categories (name, description)
SELECT 'Máy', 'Máy tính để bàn, PC gaming, workstation'
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE name = 'Máy');

INSERT INTO Products (product_code, name, description, price, category_id)
VALUES
('CASE01', 'NZXT H510', 'Case mid-tower, thiết kế tối giản, airflow tốt', 1890000,
 (SELECT category_id FROM Categories WHERE name='Case')),

('CASE02', 'Lian Li O11 Dynamic', 'Case cao cấp, kính cường lực, tối ưu tản nhiệt', 4290000,
 (SELECT category_id FROM Categories WHERE name='Case')),

('CASE03', 'Corsair 4000D Airflow', 'Case airflow mạnh, hỗ trợ radiator lớn', 2590000,
 (SELECT category_id FROM Categories WHERE name='Case')),

('CASE04', 'Cooler Master TD500 Mesh', 'Case mesh RGB, luồng gió mạnh', 2390000,
 (SELECT category_id FROM Categories WHERE name='Case')),

('CASE05', 'DeepCool MATREXX 55', 'Case kính cường lực, giá tốt', 1590000,
 (SELECT category_id FROM Categories WHERE name='Case'));



INSERT INTO Inventory (product_id, quantity)
SELECT product_id, 30 FROM Products WHERE product_code LIKE 'CASE%';


INSERT INTO Products (product_code, name, description, price, category_id)
VALUES
('PC01', 'PC Gaming RTX 4060', 'Intel i5-12400F, RTX 4060, RAM 16GB, SSD 512GB', 23990000,
 (SELECT category_id FROM Categories WHERE name='Máy')),

('PC02', 'PC Gaming RTX 4070', 'Ryzen 5 7600, RTX 4070, RAM 32GB, SSD 1TB', 34990000,
 (SELECT category_id FROM Categories WHERE name='Máy')),

('PC03', 'PC Gaming RTX 3060', 'Intel i5-11400F, RTX 3060, RAM 16GB', 19990000,
 (SELECT category_id FROM Categories WHERE name='Máy')),

('PC04', 'PC Workstation i7', 'Intel i7-12700, RAM 32GB, SSD 1TB', 28990000,
 (SELECT category_id FROM Categories WHERE name='Máy')),

('PC05', 'PC Gaming Ryzen 7', 'Ryzen 7 5800X, RTX 3080, RAM 32GB', 39990000,
 (SELECT category_id FROM Categories WHERE name='Máy'));



INSERT INTO Inventory (product_id, quantity)
SELECT product_id, 10 FROM Products WHERE product_code LIKE 'PC%';




SELECT p.product_code, p.name, c.name AS category
FROM Products p
JOIN Categories c ON p.category_id = c.category_id
WHERE c.name IN ('Case', 'Máy');



SELECT * FROM orders;

SELECT * FROM orderitems;