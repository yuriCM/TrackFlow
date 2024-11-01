function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({ error: 'No tienes permiso para acceder a este recurso' });
        }
        next();
    };
}

module.exports = authorizeRoles;

