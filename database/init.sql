-- 创建数据库
CREATE DATABASE IF NOT EXISTS game_monitor;
USE game_monitor;

-- 游戏指标表
CREATE TABLE IF NOT EXISTS game_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    online_players INT NOT NULL DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    active_servers INT DEFAULT 0,
    avg_latency INT DEFAULT 0,
    record_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_time (record_time)
);

-- 服务器表
CREATE TABLE IF NOT EXISTS servers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(50),
    status ENUM('online', 'offline') DEFAULT 'offline',
    players INT DEFAULT 0,
    cpu INT DEFAULT 0,
    memory INT DEFAULT 0,
    latency INT DEFAULT 0,
    last_update DATETIME
);

-- 告警表
CREATE TABLE IF NOT EXISTS alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level ENUM('critical', 'warning', 'info') NOT NULL,
    type VARCHAR(50),
    message TEXT,
    value VARCHAR(50),
    threshold VARCHAR(50),
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolve_time DATETIME
);

-- 插入测试服务器数据
INSERT INTO servers (id, name, region, status, players, cpu, memory, latency, last_update) VALUES
('s1', '游戏服务器-华北1', '华北', 'online', 1234, 45, 52, 32, NOW()),
('s2', '游戏服务器-华东1', '华东', 'online', 2345, 68, 61, 45, NOW()),
('s3', '游戏服务器-华南1', '华南', 'online', 3456, 82, 75, 89, NOW()),
('s4', '游戏服务器-西南1', '西南', 'offline', 0, 0, 0, 0, NOW()),
('s5', '游戏服务器-海外1', '海外', 'online', 567, 34, 41, 156, NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 用户表（用于登录认证）
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'operator', 'developer', 'viewer') DEFAULT 'viewer',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认用户（密码 123456 的 bcrypt 哈希值）
-- bcrypt hash of '123456'
INSERT IGNORE INTO users (username, password, role) VALUES
('admin', '$2b$10$4zT575O6YrL2f/A0xEhayejyF.GtLoZnxIFGDFoEbLcXSzJsYXViS', 'admin'),
('operator', '$2b$10$4zT575O6YrL2f/A0xEhayejyF.GtLoZnxIFGDFoEbLcXSzJsYXViS', 'operator'),
('developer', '$2b$10$4zT575O6YrL2f/A0xEhayejyF.GtLoZnxIFGDFoEbLcXSzJsYXViS', 'developer'),
('viewer', '$2b$10$4zT575O6YrL2f/A0xEhayejyF.GtLoZnxIFGDFoEbLcXSzJsYXViS', 'viewer');

-- 服务器历史快照表（论文第5张表）
CREATE TABLE IF NOT EXISTS server_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    server_id VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    region VARCHAR(50),
    status ENUM('online', 'offline') DEFAULT 'offline',
    players INT DEFAULT 0,
    cpu INT DEFAULT 0,
    memory INT DEFAULT 0,
    latency INT DEFAULT 0,
    snapshot_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_server_time (server_id, snapshot_time),
    INDEX idx_snapshot_time (snapshot_time)
);