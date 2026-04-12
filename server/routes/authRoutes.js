const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRole, JWT_SECRET } = require('../middlewares/auth');

const router = express.Router();
const prisma = new PrismaClient();
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-super-secret-key';

// --- AUTHENTICATION ENDPOINTS ---
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = null;
    let isOldUser = false;
    
    try {
      user = await prisma.user.findUnique({
        where: { username },
        include: { outlet: true }
      });
    } catch (e) { console.log('Prisma belum siap, fallback ke pool lama'); }

    if (!user) {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        user = result.rows[0];
        isOldUser = true;
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (isOldUser && user.is_verified === false) return res.status(403).json({ error: 'Akun belum diverifikasi.' });
    if (!isOldUser && user.isActive === false) return res.status(403).json({ error: 'Akun dinonaktifkan oleh Owner.' });

    const userPayload = { 
        id: user.id, username: user.username, role: user.role, 
        department: isOldUser ? user.department : (user.outlet?.name || 'All Outlets'),
        outletId: isOldUser ? null : user.outletId
    };
    
    const accessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(userPayload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' }); // Fallback V1

    res.json({ message: 'Login successful', token, accessToken, refreshToken, user: userPayload });
  } catch (err) { res.status(500).json({ error: 'Terjadi kesalahan pada server database.' }); }
});

router.post('/v2/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token diperlukan' });

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Refresh token expired' });
    const newAccessToken = jwt.sign({ id: user.id, username: user.username, role: user.role, outletId: user.outletId }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken: newAccessToken });
  });
});

// --- USER MANAGEMENT V2 (PRISMA) ---
router.post('/v2/users', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  const { username, password, role, outletId } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await prisma.user.create({ data: { username, password: hashedPassword, role, outletId } });
    res.status(201).json({ message: 'User dibuat', user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) { res.status(500).json({ error: 'Gagal membuat user V2' }); }
});

router.get('/v2/users', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  try { const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, isActive: true, outlet: true } }); res.json(users); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/v2/users/:id', authenticateToken, authorizeRole(['OWNER']), async (req, res) => {
  try { await prisma.user.delete({ where: { id: req.params.id } }); res.json({ message: 'User berhasil dihapus' }); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/v2/users/:id/status', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  const { isActive } = req.body; try { const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive } }); res.json({ message: 'Status diupdate', user }); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/v2/users/:id/reset-password', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  const { newPassword } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await prisma.user.update({ where: { id: req.params.id }, data: { password: hashedPassword } });
    res.json({ message: 'Password berhasil di-reset' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;