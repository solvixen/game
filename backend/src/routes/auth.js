const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { JWT_SECRET } = require('../middleware/auth');

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 参数校验
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }

        // 查询用户
        const user = await db.findUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 验证密码（兼容明文和bcrypt哈希两种存储方式）
        let passwordValid = false;
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
            // bcrypt 哈希
            passwordValid = bcrypt.compareSync(password, user.password);
        } else {
            // 明文（向后兼容，生产环境应全量迁移为哈希）
            passwordValid = (password === user.password);
        }

        if (!passwordValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 更新最后登录时间
        await db.updateUserLoginTime(user.id);

        // 生成 JWT 令牌（有效期 24 小时）
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        // 返回用户信息和令牌
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                lastLogin: user.last_login
            }
        });

    } catch (err) {
        console.error('登录失败:', err);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取当前用户信息（用于验证 token 有效性）
router.get('/me', async (req, res) => {
    try {
        const user = await db.findUserByUsername(req.user.username);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            lastLogin: user.last_login
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
