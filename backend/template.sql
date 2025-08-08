CREATE DATABASE IF NOT EXISTS encheres_project;
USE encheres_project;

CREATE USER 'node'@'%' IDENTIFIED BY 'devpassword';
GRANT ALL ON *.* TO 'node'@'%';

CREATE TABLE IF NOT EXISTS client (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name NVARCHAR(40) NOT NULL,
    email NVARCHAR(50) UNIQUE,
    phone NVARCHAR(20) DEFAULT '',
    address MEDIUMTEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS encheres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name NVARCHAR(40),
    date DATE,
    address MEDIUMTEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enchere_id INT NOT NULL,
    name NVARCHAR(255) DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    description TEXT DEFAULT '',
    starting_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    sold_price DECIMAL(10, 2) NULL,
    sold_to INT NULL,
    notes TEXT DEFAULT '',
    CONSTRAINT fk_sold_to FOREIGN KEY (sold_to) REFERENCES client(id) ON DELETE SET NULL,
    CONSTRAINT fk_enchere_id FOREIGN KEY (enchere_id) REFERENCES encheres(id) ON DELETE CASCADE
);
 
CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name NVARCHAR(50) DEFAULT '',
    description MEDIUMTEXT DEFAULT '',
    lot_id INT NOT NULL,
    file_path VARCHAR(500),
    file_size INT DEFAULT 0,
    mime_type VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lot_id FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS participation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    enchere_id INT NOT NULL,
    local_number INT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_client_idb FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE CASCADE, 
    CONSTRAINT fk_enchere_idb FOREIGN KEY (enchere_id) REFERENCES encheres(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participation (enchere_id, client_id)
)