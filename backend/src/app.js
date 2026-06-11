const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

// ═══════ JWT 认证中间件 ═══════
const { authMiddleware } = require('./middleware/auth')
app.use(authMiddleware)

// 路由（auth 在中间件白名单中，无需 token）
app.use('/api/auth', require('./routes/auth'))
app.use('/api/metrics', require('./routes/metrics'))
app.use('/api/servers', require('./routes/servers'))
app.use('/api/alerts', require('./routes/alerts'))
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/analytics', require('./routes/analytics'))
app.use('/api/users', require('./routes/users'))

// 健康检查
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// 启动 WebSocket
const wsServer = require('./websocket')
wsServer.start()
// 启动数据库连接
const db = require('./models/db')
db.testConnection()

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`🚀 HTTP: http://localhost:${PORT}`)
    console.log(`🔌 WebSocket: ws://localhost:${process.env.WS_PORT || 3002}`)
})

module.exports = app
