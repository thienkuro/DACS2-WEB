USE gaming_store;
ALTER TABLE Users DISCARD TABLESPACE;

ALTER TABLE Users IMPORT TABLESPACE;

DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100),
    password_hash VARCHAR(255),
    role ENUM('customer','admin'),
    created_at TIMESTAMP
) ENGINE=InnoDB;


ALTER TABLE Users DISCARD TABLESPACE;

ALTER TABLE Users IMPORT TABLESPACE;


SELECT COUNT(*) FROM Users;
SELECT * FROM Users LIMIT 5;


ALTER TABLE Users
ADD UNIQUE (username),
ADD UNIQUE (email);



CREATE DATABASE gaming_store
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


1
DROP TABLE IF EXISTS Categories;
CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50),
    description TEXT
) ENGINE=InnoDB;
ALTER TABLE Categories DISCARD TABLESPACE;
ALTER TABLE Categories IMPORT TABLESPACE;



2
DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100),
    password_hash VARCHAR(255),
    role ENUM('customer','admin'),
    created_at TIMESTAMP
) ENGINE=InnoDB;

ALTER TABLE Users DISCARD TABLESPACE;
ALTER TABLE Users IMPORT TABLESPACE;




3
DROP TABLE IF EXISTS Products;
CREATE TABLE Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(20),
    name VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2),
    refresh_rate VARCHAR(50),
    category_id INT,
    created_at TIMESTAMP
) ENGINE=InnoDB;
ALTER TABLE Products DISCARD TABLESPACE;
ALTER TABLE Products IMPORT TABLESPACE;





4
DROP TABLE IF EXISTS Inventory;
CREATE TABLE Inventory (
    product_id INT PRIMARY KEY,
    quantity INT
) ENGINE=InnoDB;
ALTER TABLE Inventory DISCARD TABLESPACE;
ALTER TABLE Inventory IMPORT TABLESPACE;




5
DROP TABLE IF EXISTS Orders;
CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(30),
    user_id INT,
    shipping_name VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    payment_method ENUM('cod','bank_transfer','momo','zalopay'),
    payment_status ENUM('unpaid','paid','failed'),
    notes TEXT,
    total_amount DECIMAL(10,2),
    status ENUM('pending','paid','shipped','completed','cancelled'),
    created_at TIMESTAMP
) ENGINE=InnoDB;
ALTER TABLE Orders DISCARD TABLESPACE;
ALTER TABLE Orders IMPORT TABLESPACE;




6
DROP TABLE IF EXISTS OrderItems;
CREATE TABLE OrderItems (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT,
    price DECIMAL(10,2)
) ENGINE=InnoDB;
ALTER TABLE OrderItems DISCARD TABLESPACE;
ALTER TABLE OrderItems IMPORT TABLESPACE;






7
DROP TABLE IF EXISTS ProductImages;

CREATE TABLE ProductImages (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    type ENUM('static','animated') NOT NULL,
    url VARCHAR(1000) NOT NULL
) ENGINE=InnoDB;
ALTER TABLE ProductImages IMPORT TABLESPACE;

ALTER TABLE ProductImages DISCARD TABLESPACE;


ALTER TABLE Categories ADD UNIQUE (name);

ALTER TABLE Products
ADD UNIQUE (product_code),
ADD CONSTRAINT fk_products_category
FOREIGN KEY (category_id)
REFERENCES Categories(category_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE Inventory
ADD CONSTRAINT fk_inventory_product
FOREIGN KEY (product_id)
REFERENCES Products(product_id)
ON DELETE CASCADE;

ALTER TABLE Orders
ADD CONSTRAINT fk_orders_user
FOREIGN KEY (user_id)
REFERENCES Users(user_id)
ON DELETE CASCADE;

ALTER TABLE OrderItems
ADD CONSTRAINT fk_orderitems_order
FOREIGN KEY (order_id)
REFERENCES Orders(order_id)
ON DELETE CASCADE,
ADD CONSTRAINT fk_orderitems_product
FOREIGN KEY (product_id)
REFERENCES Products(product_id)
ON DELETE RESTRICT;

ALTER TABLE ProductImages
ADD CONSTRAINT fk_images_product
FOREIGN KEY (product_id)
REFERENCES Products(product_id)
ON DELETE CASCADE;


SHOW TABLE STATUS;


















-- Products -> Categories
SELECT p.product_id, p.category_id
FROM Products p
LEFT JOIN Categories c ON p.category_id = c.category_id
WHERE c.category_id IS NULL;

-- Inventory -> Products
SELECT i.product_id
FROM Inventory i
LEFT JOIN Products p ON i.product_id = p.product_id
WHERE p.product_id IS NULL;

-- Orders -> Users
SELECT o.order_id, o.user_id
FROM Orders o
LEFT JOIN Users u ON o.user_id = u.user_id
WHERE u.user_id IS NULL;

-- OrderItems -> Orders / Products
SELECT oi.order_item_id
FROM OrderItems oi
LEFT JOIN Orders o ON oi.order_id = o.order_id
LEFT JOIN Products p ON oi.product_id = p.product_id
WHERE o.order_id IS NULL OR p.product_id IS NULL;

-- ProductImages -> Products
SELECT pi.image_id
FROM ProductImages pi
LEFT JOIN Products p ON pi.product_id = p.product_id
WHERE p.product_id IS NULL;


ALTER TABLE Categories
ADD CONSTRAINT uq_categories_name UNIQUE (name);

ALTER TABLE Products
ADD CONSTRAINT uq_products_code UNIQUE (product_code);


ALTER TABLE Products
ADD CONSTRAINT fk_products_category
FOREIGN KEY (category_id)
REFERENCES Categories(category_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;


SELECT DISTINCT p.category_id
FROM Products p
LEFT JOIN Categories c
       ON p.category_id = c.category_id
WHERE c.category_id IS NULL;
