const express = require('express')
const router = express.Router()
const db = require('../models/db')

router.get('/overview', async (req, res) => {
    const [metrics, servers] = await Promise.all([
        db.getLatestMetrics(),
        db.getAllServers()
    ])
    res.json({
        metrics: metrics || { onlinePlayers: 0, revenue: 0, activeServers: 0, avgLatency: 0 },
        servers: { total: servers.length, online: servers.filter(s => s.status === 'online').length }
    })
})

module.exports = router