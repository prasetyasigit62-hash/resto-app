const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-restoran';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

  if (token == null) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
    req.user = user; // Simpan payload user di request
    next();
  });
};

const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role?.toUpperCase();
    if (req.user && (allowedRoles.map(r => r.toUpperCase()).includes(userRole) || userRole === 'SUPERADMIN' || userRole === 'OWNER')) {
      next();
    } else {
      res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk aksi ini.' });
    }
  };
};

module.exports = { authenticateToken, authorizeRole, JWT_SECRET };