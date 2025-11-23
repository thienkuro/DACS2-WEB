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
    url VARCHAR(255) NOT NULL,
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
((SELECT product_id FROM Products WHERE name='Logitech G Pro X Superlight 2'), 'static', 'https://via.placeholder.com/480x360?text=G+Pro+X+SL2'),
((SELECT product_id FROM Products WHERE name='Razer DeathAdder V3'), 'static', 'https://via.placeholder.com/480x360?text=DeathAdder+V3'),
((SELECT product_id FROM Products WHERE name='Glorious Model O Wireless'), 'static', 'https://via.placeholder.com/480x360?text=Model+O+Wireless'),
((SELECT product_id FROM Products WHERE name='Xtrfy M8 Wireless'), 'static', 'https://via.placeholder.com/480x360?text=Xtrfy+M8'),

((SELECT product_id FROM Products WHERE name='Keychron K2 V2'), 'static', 'https://via.placeholder.com/480x360?text=Keychron+K2+V2'),
((SELECT product_id FROM Products WHERE name='Akko 3068B Plus'), 'static', 'https://via.placeholder.com/480x360?text=Akko+3068B+Plus'),
((SELECT product_id FROM Products WHERE name='Ducky One 3 TKL'), 'static', 'https://via.placeholder.com/480x360?text=Ducky+One+3+TKL'),
((SELECT product_id FROM Products WHERE name='NuPhy Air75'), 'static', 'https://via.placeholder.com/480x360?text=NuPhy+Air75'),

((SELECT product_id FROM Products WHERE name='HyperX Cloud II'), 'static', 'https://via.placeholder.com/480x360?text=HyperX+Cloud+II'),
((SELECT product_id FROM Products WHERE name='Logitech G Pro X Headset'), 'static', 'https://via.placeholder.com/480x360?text=G+Pro+X+Headset'),
((SELECT product_id FROM Products WHERE name='SteelSeries Arctis Nova 7'), 'static', 'https://via.placeholder.com/480x360?text=Arctis+Nova+7'),
((SELECT product_id FROM Products WHERE name='Razer BlackShark V2'), 'static', 'https://via.placeholder.com/480x360?text=BlackShark+V2');

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
((SELECT product_id FROM Products WHERE name='Zowie EC2-CW'), 'static', 'https://via.placeholder.com/480x360?text=Zowie+EC2-CW'),
((SELECT product_id FROM Products WHERE name='Leopold FC750R'), 'static', 'https://via.placeholder.com/480x360?text=Leopold+FC750R'),
((SELECT product_id FROM Products WHERE name='Corsair HS80 RGB Wireless'), 'static', 'https://via.placeholder.com/480x360?text=HS80+RGB+Wireless');

