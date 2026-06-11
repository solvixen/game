# Nginx 负载均衡配置

## 文件说明

| 文件 | 用途 |
|------|------|
| `nginx.conf.example` | 完整参考配置（带注释和限流定义） |
| `game-monitor.conf` | 即用版配置（可直接复制到 nginx 配置目录） |

## 部署步骤

### Windows（直接复制到 nginx/conf/conf.d/）

```powershell
# 1. 复制配置
copy D:\game-monitor-system\nginx\game-monitor.conf C:\nginx\conf\conf.d\

# 2. 验证配置
C:\nginx\nginx.exe -t

# 3. 重载
C:\nginx\nginx.exe -s reload
```

### Linux

```bash
# 1. 复制配置
sudo cp nginx/game-monitor.conf /etc/nginx/conf.d/

# 2. 在 nginx.conf 的 http {} 块中添加限流定义：
#    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;

# 3. 验证 + 重载
sudo nginx -t && sudo nginx -s reload
```

## 配置要点

| 功能 | 配置项 | 说明 |
|------|--------|------|
| HTTP 负载均衡 | `upstream backend_api` | `least_conn` 策略，weight=5 |
| WebSocket 代理 | `upstream backend_ws` | `ip_hash` 保持会话 |
| 限流 | `limit_req` | 每 IP 每秒 20 次请求 |
| 静态缓存 | `expires 30d` | JS/CSS/图片缓存 30 天 |
| 健康检查 | `/nginx-health` | 返回 `healthy` |
| 超时控制 | `proxy_connect_timeout 5s` | 对标 ≤150ms 延迟要求 |

## 多实例扩展

取消注释 `upstream` 块中的备用服务器即可：

```nginx
upstream backend_api {
    least_conn;
    server 127.0.0.1:3001 weight=5;
    server 127.0.0.1:3003 weight=3;  # 第二台后端
}

upstream backend_ws {
    ip_hash;
    server 127.0.0.1:3002;
    server 127.0.0.1:3004;  # 第二台 WebSocket
}
```
