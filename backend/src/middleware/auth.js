/**
 * JWT 认证中间件
 * 验证请求头中的 Bearer Token，解析用户信息并注入到 req.user
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'game-monitor-jwt-secret-2026';

function authMiddleware(req, res, next) {
    // 登录接口和健康检查不需要认证
    const skipPaths = ['/api/auth/login', '/health'];
    if (skipPaths.includes(req.path)) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;  // { userId, username, role }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: '令牌已过期，请重新登录' });
        }
        return res.status(401).json({ error: '无效的认证令牌' });
    }
}

/**
 * 角色鉴权中间件工厂
 * @param  {...string} roles 允许访问的角色列表
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: '请先登录' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: '权限不足，无法执行此操作' });
        }
        next();
    };
}

module.exports = { authMiddleware, requireRole, JWT_SECRET };
