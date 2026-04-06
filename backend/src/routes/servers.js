const express = require('express')
const router = express.Router()
const db = require('../models/db')

router.get('/', async (req, res) => {
    const servers = await db.getAllServers()
    res.json(servers)
})

router.get('/stats', async (req, res) => {
    const servers = await db.getAllServers()
    const online = servers.filter(s => s.status === 'online')
    res.json({
        total: servers.length,
        online: online.length,
        offline: servers.length - online.length,
        avgCpu: online.reduce((s, a) => s + a.cpu, 0) / (online.length || 1)
    })
})

module.exports = router