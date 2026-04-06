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