module.exports = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }

    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Không có quyền admin' });
    }

    next();
};
