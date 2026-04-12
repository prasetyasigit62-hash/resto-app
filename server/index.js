require('dotenv').config(); // Memuat konfigurasi dari file .env
const express = require('express');
const cors = require('cors');
const fs = require('fs'); // ✨ FIX: Import modul File System yang hilang
const http = require('http');
const { Server } = require('socket.io');
const os = require('os'); // ✨ NEW: Import modul OS untuk mendapatkan IP Address
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken'); // Import JWT
const bcrypt = require('bcryptjs'); // Import Bcrypt
const pool = require('./db'); // Import Koneksi PostgreSQL
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const FormData = require('form-data');
const { PrismaClient } = require('@prisma/client'); // ✨ NEW: Import Prisma ORM
const prisma = new PrismaClient();

// --- CLOUDINARY CONFIGURATION ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- UPLOAD CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format nama file: timestamp-namaasli.jpg
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

// Filter untuk validasi tipe file gambar dan limit size
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Hanya file gambar atau dokumen (PDF/DOC) yang diperbolehkan!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file 5MB
  fileFilter: fileFilter
});

// ✨ FITUR 4: FIREBASE CLOUD MESSAGING (FCM) SETUP
let admin = null;
let fcmInitialized = false;
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

try {
  // PENYESUAIAN OTOMATIS: Cek dulu file service account sebelum mencoba inisialisasi.
  // Ini mencegah server crash jika file konfigurasi Firebase tidak ada.
  if (fs.existsSync(serviceAccountPath)) {
    admin = require('firebase-admin');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    fcmInitialized = true;
    console.log('✅ Firebase Admin SDK berhasil diinisialisasi. Push Notification aktif.');
  } else {
    // console.log('ℹ️ Info: File firebase-service-account.json tidak ditemukan. Fitur Push Notification tidak akan aktif.');
  }
} catch (e) {
  // console.warn('⚠️ Peringatan: Gagal menginisialisasi Firebase Admin SDK. Push Notification mungkin tidak berfungsi.', e.message);
}

// ✨ FITUR BARU: NODEMAILER UNTUK OTP EMAIL
let nodemailer = null;
try { nodemailer = require('nodemailer'); }
catch (e) { console.log('Nodemailer belum diinstall. Jalankan: npm install nodemailer di folder server'); }

const transporter = nodemailer ? nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // Ganti dengan SMTP Anda nanti
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'prasetyasigit62@gmail.com', // 👈 Email Pengirim (Aplikasi)
    pass: process.env.SMTP_PASS || 'ntgxamsvjxgzwvzm', // 👈 16-Digit App Password (tanpa spasi)
  },
}) : null;

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-super-secret-key';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Izinkan semua koneksi dari frontend
});

const PORT = process.env.PORT || 3000; // ✨ FIX: Disamakan dengan target axios frontend

// Enable CORS for all routes
// In a real app, you might want to restrict this to your frontend's domain
app.use(cors());
app.use(express.json({ limit: '50mb' })); // PENTING: Tingkatkan limit agar bisa import banyak data
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Akses publik ke folder uploads

// --- MIDDLEWARES ---
const { authenticateToken, authorizeRole, JWT_SECRET } = require('./middlewares/auth');

// --- ROUTERS (MODULAR ARSITEKTUR) ---
const authRoutes = require('./routes/authRoutes');
// 🔥 V1 INVENTORY ROUTES DIHAPUS TOTAL AGAR TIDAK ERROR
app.use('/api', authRoutes);

// ==========================================
// ✨ FASE 2: OUTLET & MENU MANAGEMENT (PRISMA V2)
// ==========================================
app.get('/api/v2/outlets', authenticateToken, async (req, res) => {
  try {
    const outlets = await prisma.outlet.findMany({ include: { _count: { select: { users: true } } } });
    res.json(outlets);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/v2/outlets', authenticateToken, authorizeRole(['OWNER']), async (req, res) => {
  const { name, address, city, openTime, closeTime } = req.body;
  try {
    const outlet = await prisma.outlet.create({ data: { name, address, city, openTime, closeTime } });
    res.status(201).json(outlet);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/v2/outlets/:id', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  try {
    const outlet = await prisma.outlet.update({ where: { id: req.params.id }, data: req.body });
    res.json(outlet);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v2/categories', authenticateToken, async (req, res) => {
  try { res.json(await prisma.menuCategory.findMany()); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/v2/categories', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  try { res.status(201).json(await prisma.menuCategory.create({ data: { name: req.body.name } })); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v2/menus', authenticateToken, async (req, res) => {
  try {
    const menus = await prisma.menu.findMany({ include: { category: true, recipes: { include: { material: true } } } });
    res.json(menus);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/v2/menus', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  const { name, price, image, categoryId, recipes } = req.body;
  try {
    const menu = await prisma.menu.create({ data: { name, price: Number(price), image, categoryId, recipes: { create: recipes.map(r => ({ materialId: r.materialId, qtyNeeded: Number(r.qtyNeeded) })) } } });
    res.status(201).json(menu);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/v2/menus/:id', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  const { name, price, image, categoryId, recipes } = req.body;
  try {
    await prisma.recipe.deleteMany({ where: { menuId: req.params.id } }); // Hapus resep lama
    const menu = await prisma.menu.update({ where: { id: req.params.id }, data: { name, price: Number(price), image, categoryId, recipes: { create: recipes.map(r => ({ materialId: r.materialId, qtyNeeded: Number(r.qtyNeeded) })) } } });
    res.json(menu);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/v2/menus/:id', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  try { await prisma.menu.update({ where: { id: req.params.id }, data: { isActive: false } }); res.json({ message: 'Menu berhasil diarsipkan.' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 🚀 SISTEM V2: SUPPLIER, MATERIAL & OUTLET STOCK (CLEAN & ANTI-BUG)
// ==========================================

// --- SUPPLIERS V2 ---
app.get(['/api/suppliers', '/api/v2/suppliers'], authenticateToken, async (req, res) => {
  try { res.json(await prisma.supplier.findMany()); } catch (err) { res.status(500).json([]); }
});

app.post(['/api/suppliers', '/api/v2/suppliers'], authenticateToken, async (req, res) => {
  try { res.status(201).json(await prisma.supplier.create({ data: { name: req.body.name, contact: req.body.contact || req.body.phone || '-', contactPerson: req.body.contactPerson || req.body.contact_person || '-', address: req.body.address } })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.put(['/api/suppliers/:id', '/api/v2/suppliers/:id'], authenticateToken, async (req, res) => {
  try { res.json(await prisma.supplier.update({ where: { id: req.params.id }, data: { name: req.body.name, contact: req.body.contact || req.body.phone || '-', contactPerson: req.body.contactPerson || req.body.contact_person || '-', address: req.body.address } })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete(['/api/suppliers/:id', '/api/v2/suppliers/:id'], authenticateToken, async (req, res) => {
  try { await prisma.supplier.delete({ where: { id: req.params.id } }); res.json({ message: 'OK' }); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

// --- MATERIALS & STOCKS V2 ---
app.get(['/api/ingredients', '/api/v2/materials'], authenticateToken, async (req, res) => {
  try { res.json(await prisma.material.findMany({ include: { supplier: true, stocks: true } })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v2/materials', authenticateToken, async (req, res) => {
  const { name, unit, lastPrice, minStock, supplierId, stock } = req.body;
  try {
    // Pengecekan ID Supplier super ketat agar tidak ditolak database
    let cleanSupplierId = null;
    if (supplierId && typeof supplierId === 'string' && supplierId.trim() !== '' && supplierId !== 'null' && supplierId !== 'undefined') {
        cleanSupplierId = supplierId.trim();
    }

    const mat = await prisma.material.create({ data: { name, unit: unit || 'KG', lastPrice: Number(lastPrice || 0), minStock: Number(minStock || 0), supplierId: cleanSupplierId } });
    
    if (stock !== undefined && stock !== null && stock !== '') {
        const stockQty = Number(stock) >= 0 ? Number(stock) : 0;
        let targetOutletId = req.user.outletId;
        if (!targetOutletId || targetOutletId === 'null' || targetOutletId === 'undefined') {
            let defOutlet = await prisma.outlet.findFirst();
            if (!defOutlet) defOutlet = await prisma.outlet.create({ data: { name: 'Cabang Utama', address: 'Pusat', city: 'Auto Generated', openTime: '08:00', closeTime: '22:00' } });
            targetOutletId = defOutlet.id;
        }
        await prisma.outletStock.create({ data: { outletId: targetOutletId, materialId: mat.id, qty: stockQty } });
    }
    res.status(201).json(mat);
  } catch (err) { console.error('POST Material Error:', err); res.status(500).json({ error: err.message }); }
});

app.put('/api/v2/materials/:id', authenticateToken, async (req, res) => {
  const { name, unit, lastPrice, minStock, supplierId, stock } = req.body;
  try {
    let cleanSupplierId = null;
    if (supplierId && typeof supplierId === 'string' && supplierId.trim() !== '' && supplierId !== 'null' && supplierId !== 'undefined') {
        cleanSupplierId = supplierId.trim();
    }

    const updated = await prisma.material.update({ where: { id: req.params.id }, data: { name, unit: unit || 'KG', lastPrice: Number(lastPrice || 0), minStock: Number(minStock || 0), supplierId: cleanSupplierId } });

    if (stock !== undefined && stock !== null && stock !== '') {
        const stockQty = Number(stock) >= 0 ? Number(stock) : 0;
        let targetOutletId = req.user.outletId;
        if (!targetOutletId || targetOutletId === 'null' || targetOutletId === 'undefined') {
            let defOutlet = await prisma.outlet.findFirst();
            if (!defOutlet) defOutlet = await prisma.outlet.create({ data: { name: 'Cabang Utama', address: 'Pusat', city: 'Auto Generated', openTime: '08:00', closeTime: '22:00' } });
            targetOutletId = defOutlet.id;
        }
        
        // Paksa simpan stok dengan metode Upsert yang kebal error
        await prisma.outletStock.upsert({
            where: { outletId_materialId: { outletId: targetOutletId, materialId: req.params.id } },
            update: { qty: stockQty },
            create: { outletId: targetOutletId, materialId: req.params.id, qty: stockQty }
        });
    }
    res.json(updated);
  } catch (err) { console.error('PUT Material Error:', err); res.status(500).json({ error: err.message }); }
});

app.delete('/api/v2/materials/:id', authenticateToken, async (req, res) => {
  try {
    // ✨ FIX: Cegah hard-delete jika bahan sudah dipakai di resep/mutasi untuk mencegah error DB Constraint
    const checkUsage = await prisma.stockMutation.count({ where: { materialId: req.params.id } });
    const checkRecipe = await prisma.recipe.count({ where: { materialId: req.params.id } });
    if (checkUsage > 0 || checkRecipe > 0) {
        return res.status(400).json({ error: 'Bahan tidak dapat dihapus karena sudah dipakai dalam Resep atau memiliki Histori Mutasi. Silakan set stoknya menjadi 0.' });
    }

    await prisma.outletStock.deleteMany({ where: { materialId: req.params.id } });
    await prisma.material.delete({ where: { id: req.params.id } });
    res.json({ message: 'Bahan Baku berhasil dihapus.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v2/stocks', authenticateToken, async (req, res) => {
  try {
    let where = {};
    if (!['OWNER', 'SUPERADMIN'].includes(req.user.role) && req.user.outletId) where.outletId = req.user.outletId;
    const stocks = await prisma.outletStock.findMany({ where, include: { material: true, outlet: true } });
    res.json(stocks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v2/mutations', authenticateToken, async (req, res) => {
  try {
    let where = {};
    if (!['OWNER', 'SUPERADMIN'].includes(req.user.role) && req.user.outletId) where.outletId = req.user.outletId;
    const mutations = await prisma.stockMutation.findMany({ where, include: { material: true, outlet: true, user: { select: { username: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(mutations);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v2/mutations/adjust', authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'CHEF']), async (req, res) => {
  const { outletId, materialId, realQty, note } = req.body;
  try {
    await syncV2User(req.user);
    const targetOutletId = outletId || req.user.outletId;
    if (!targetOutletId) return res.status(400).json({ error: 'Outlet ID wajib.' });
    const currentStock = await prisma.outletStock.findUnique({ where: { outletId_materialId: { outletId: targetOutletId, materialId } } });
    const oldQty = currentStock ? currentStock.qty : 0;
    const difference = Number(realQty) - oldQty;
    if (difference === 0) return res.status(400).json({ error: 'Stok fisik sama dengan sistem.' });

    await prisma.$transaction(async (tx) => {
      await tx.outletStock.upsert({
        where: { outletId_materialId: { outletId: targetOutletId, materialId } }, update: { qty: Number(realQty) }, create: { outletId: targetOutletId, materialId, qty: Number(realQty) }
      });
      await tx.stockMutation.create({
        data: { outletId: targetOutletId, materialId, userId: req.user.id, qty: difference, type: 'OPNAME_ADJ', note: note || 'Opname Manual' }
      });
    });
    res.json({ message: 'Stok berhasil disesuaikan.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✨ FITUR V2: Catat Waste / Barang Rusak
app.post('/api/v2/mutations/waste', authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'CHEF']), async (req, res) => {
  const { outletId, materialId, wasteQty, note } = req.body;
  try {
    await syncV2User(req.user);
    const targetOutletId = outletId || req.user.outletId;
    if (!targetOutletId) return res.status(400).json({ error: 'Outlet ID wajib.' });
    const currentStock = await prisma.outletStock.findUnique({ where: { outletId_materialId: { outletId: targetOutletId, materialId } } });
    const oldQty = currentStock ? currentStock.qty : 0;
    if (oldQty < Number(wasteQty)) return res.status(400).json({ error: `Stok tidak cukup. Sisa stok: ${oldQty}` });

    await prisma.$transaction(async (tx) => {
      await tx.outletStock.update({ where: { outletId_materialId: { outletId: targetOutletId, materialId } }, data: { qty: oldQty - Number(wasteQty) } });
      await tx.stockMutation.create({ data: { outletId: targetOutletId, materialId, userId: req.user.id, qty: -Number(wasteQty), type: 'OUT_WASTE', note: note || 'Barang Rusak / Terbuang' } });
    });
    res.json({ message: 'Waste (Barang rusak) berhasil dicatat dan stok dikurangi.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✨ FITUR V2: Quick Restock Manual (Tanpa PO)
app.post('/api/v2/mutations/restock', authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'CHEF']), async (req, res) => {
  const { outletId, materialId, qty, cost, supplierId, note } = req.body;
  try {
    await syncV2User(req.user);
    const targetOutletId = outletId || req.user.outletId;
    if (!targetOutletId) return res.status(400).json({ error: 'Outlet ID wajib.' });
    
    await prisma.$transaction(async (tx) => {
      await tx.outletStock.upsert({ where: { outletId_materialId: { outletId: targetOutletId, materialId } }, update: { qty: { increment: Number(qty) } }, create: { outletId: targetOutletId, materialId, qty: Number(qty) } });
      if (cost && Number(cost) > 0) { await tx.material.update({ where: { id: materialId }, data: { lastPrice: Number(cost), ...(supplierId ? { supplierId } : {}) } }); }
      await tx.stockMutation.create({ data: { outletId: targetOutletId, materialId, userId: req.user.id, qty: Number(qty), type: 'IN_PO', note: note || 'Quick Restock Manual' } });
    });
    res.json({ message: 'Restock manual berhasil ditambahkan ke outlet.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v2/purchase-orders', authenticateToken, async (req, res) => {
  try {
    res.json(await prisma.purchaseOrder.findMany({ include: { items: { include: { material: true } }, outlet: true, supplier: true, creator: { select: { username: true } } }, orderBy: { createdAt: 'desc' } }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v2/purchase-orders', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  const { outletId, supplierId, items } = req.body;
  try {
    await syncV2User(req.user);
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;
    const itemsData = items.map(i => {
        totalAmount += Number(i.price) * Number(i.qty);
        return { materialId: i.materialId, qty: Number(i.qty), price: Number(i.price) };
    });
    res.status(201).json(await prisma.purchaseOrder.create({ data: { poNumber, outletId, supplierId, creatorId: req.user.id, totalAmount, status: 'PENDING_APPROVAL', items: { create: itemsData } } }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/v2/purchase-orders/:id/status', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await syncV2User(req.user);
    const po = await prisma.purchaseOrder.update({ where: { id }, data: { status }, include: { items: true } });
    if (status === 'RECEIVED') {
        await prisma.$transaction(async (tx) => {
            for (const item of po.items) {
                await tx.outletStock.upsert({
                    where: { outletId_materialId: { outletId: po.outletId, materialId: item.materialId } }, update: { qty: { increment: item.qty } }, create: { outletId: po.outletId, materialId: item.materialId, qty: item.qty }
                });
                await tx.stockMutation.create({
                    data: { outletId: po.outletId, materialId: item.materialId, userId: req.user.id, qty: item.qty, type: 'IN_PO', reference: po.poNumber, note: 'Penerimaan PO' }
                });
            }
        });
    }
    res.json(po);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v2/users', authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'CHEF', 'KASIR']), async (req, res) => {
  try { res.json(await prisma.user.findMany({ select: { id: true, username: true, role: true, isActive: true, outletId: true, outlet: true }})); } 
  catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/v2/users/register', authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'SUPERADMIN']), async (req, res) => {
  const { username, password, role, outletId } = req.body;
  try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      res.status(201).json(await prisma.user.create({ data: { username, password: hashedPassword, role, outletId: outletId || null } }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/v2/users/:id/status', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: req.body.isActive } });
    res.json({ message: `Status akun diubah menjadi ${req.body.isActive ? 'Aktif' : 'Nonaktif'}.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/v2/users/:id/reset-password', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  try {
    const hashedPassword = bcrypt.hashSync(req.body.newPassword, 10);
    await prisma.user.update({ where: { id: req.params.id }, data: { password: hashedPassword } });
    res.json({ message: 'Sandi berhasil direset.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// ✨ FASE 8, 9, 10: DASHBOARD KPI & ADVANCED REPORTS
// ==========================================

app.get('/api/v2/dashboard/kpi', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let whereOutlet = {};
    if (!['SUPERADMIN', 'OWNER'].includes(req.user.role) && req.user.outletId) {
        whereOutlet.outletId = req.user.outletId; // Kasir/Staff hanya lihat cabangnya sendiri
    } else if (['SUPERADMIN', 'OWNER', 'ADMIN'].includes(req.user.role) && req.query.outletId && req.query.outletId !== 'ALL') {
        // Filter Dinamis: Jika Owner memilih spesifik cabang di Dropdown Header
        whereOutlet.outletId = req.query.outletId;
    }

    // 1. Total Omzet Hari Ini
    const todayOrders = await prisma.order.aggregate({
      where: { createdAt: { gte: today }, status: 'COMPLETED', ...whereOutlet },
      _sum: { total: true }
    });

    // 2. Stok Kritis (Alert Merah)
    const allStocks = await prisma.outletStock.findMany({ 
        where: whereOutlet,
        include: { material: true, outlet: true }
    });
    const criticalStocks = allStocks
        .filter(s => s.qty <= s.material.minStock)
        .map(s => ({
            outlet: s.outlet.name,
            material: s.material.name,
            qty: s.qty,
            min: s.material.minStock,
            unit: s.material.unit
        }));

    // 3. Grafik Penjualan Harian (7 Hari Terakhir)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentOrders = await prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, status: 'COMPLETED', ...whereOutlet },
        select: { total: true, createdAt: true }
    });

    // Kelompokkan omzet per tanggal
    const chartDataMap = {};
    recentOrders.forEach(o => {
        const date = o.createdAt.toISOString().slice(0,10);
        chartDataMap[date] = (chartDataMap[date] || 0) + o.total;
    });
    const salesChart = Object.keys(chartDataMap).map(date => ({ date, omzet: chartDataMap[date] })).sort((a,b) => a.date.localeCompare(b.date));

    // 4. Menu Terlaris Berdasarkan Order Item
    const topItemsRaw = await prisma.orderItem.groupBy({
        by: ['menuId'], _sum: { qty: true }, orderBy: { _sum: { qty: 'desc' } }, take: 5
    });
    const menuIds = topItemsRaw.map(t => t.menuId);
    const menusInfo = await prisma.menu.findMany({ where: { id: { in: menuIds } }});
    const topSelling = topItemsRaw.map(t => ({
        menu: menusInfo.find(m => m.id === t.menuId)?.name || 'Unknown',
        qty: t._sum.qty
    }));

    res.json({
        omzetToday: todayOrders._sum.total || 0,
        topSelling,
        criticalStocks,
        salesChart
    });
  } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/v2/reports/sales', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
    const { startDate, endDate, outletId, chefId } = req.query;
    let whereClause = { status: 'COMPLETED' };
    
    if (startDate && endDate) {
         // Set filter diantara 2 range tanggal
         whereClause.createdAt = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') };
    }
    if (outletId) whereClause.outletId = outletId;
    if (chefId) whereClause.chefId = chefId;

    try {
        const orders = await prisma.order.findMany({
            where: whereClause,
            include: { 
                items: { include: { menu: true } }, 
                outlet: true, 
                chef: { select: { username: true } }, 
                kasir: { select: { username: true } } 
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/api/v2/reports/stock-valuation', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
    try {
         const stocks = await prisma.outletStock.findMany({ include: { material: true, outlet: true } });
         // Hitung valuasi: Stok Tersisa x Harga Beli Terakhir
         const valuation = stocks.map(s => ({
             outlet: s.outlet.name,
             material: s.material.name,
             qty: s.qty,
             unit: s.material.unit,
             value: s.qty * s.material.lastPrice
         }));
         const totalValue = valuation.reduce((acc, curr) => acc + curr.value, 0);
         res.json({ totalValue, details: valuation });
    } catch(e) { res.status(500).json({error: e.message}); }
});

// ✨ FASE Laporan Ekstra: Perbandingan Antar Outlet
app.get('/api/v2/reports/outlets-comparison', authenticateToken, authorizeRole(['OWNER', 'SUPERADMIN']), async (req, res) => {
  const { startDate, endDate } = req.query;
  let dateFilter = {};
  if (startDate && endDate) {
      dateFilter = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') };
  }

  try {
    const outlets = await prisma.outlet.findMany({
      include: {
        orders: {
          where: { status: 'COMPLETED', ...(startDate && { createdAt: dateFilter }) },
          select: { total: true, id: true }
        }
      }
    });

    const comparison = outlets.map(o => {
       const totalOmzet = o.orders.reduce((acc, curr) => acc + curr.total, 0);
       const totalTrx = o.orders.length;
       return { outletName: o.name, omzet: totalOmzet, transactions: totalTrx, avgTransaction: totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0 };
    });

    res.json(comparison.sort((a,b) => b.omzet - a.omzet)); // Urut dari Omzet Terbesar
  } catch(e) { res.status(500).json({error: e.message}); }
});

// ==========================================
// ✨ FASE BARU: REAL AI BUSINESS INSIGHTS
// ==========================================
app.get('/api/v2/analytics/smart-insights', authenticateToken, authorizeRole(['OWNER', 'SUPERADMIN']), async (req, res) => {
  try {
    // 1. Kumpulkan Data Operasional Nyata Hari Ini
    const today = new Date();
    today.setHours(0,0,0,0);

    // a. Data Penjualan (Kasir)
    const todayOrders = await prisma.order.aggregate({
      where: { createdAt: { gte: today }, status: 'COMPLETED' },
      _sum: { total: true }, _count: { id: true }
    });

    // b. Stok Kritis (Gudang)
    const criticalStocks = await prisma.outletStock.findMany({
      where: { qty: { lte: 5 } }, // Mengambil stok yang tersisa <= 5
      include: { material: true, outlet: true },
      take: 10
    });
    const stockAlerts = criticalStocks.map(s => `${s.material.name} di ${s.outlet.name} (Sisa: ${s.qty})`).join(', ');

    // c. Data Pengeluaran (Finance)
    const todayExpensesRes = await pool.query("SELECT SUM(amount) as total FROM expenses WHERE date >= $1", [today.toISOString()]);
    const totalExpense = Number(todayExpensesRes.rows[0].total) || 0;
    const totalIncome = Number(todayOrders._sum.total) || 0;

    // 2. Integrasi ke AI Sungguhan (Google Gemini API) jika API Key tersedia
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyA-3D6NKv6pnh5IOFIRcUSqEaDW9L7f6r4';
    if (apiKey) {
       const promptText = `Anda adalah Konsultan Bisnis Restoran. Analisa data operasional hari ini dan berikan 3 poin insight (peluang, peringatan, saran operasional).\nDATA HARI INI:\n- Transaksi Kasir: ${todayOrders._count.id} pesanan\n- Omzet Pendapatan: Rp ${totalIncome}\n- Pengeluaran Operasional: Rp ${totalExpense}\n- Peringatan Stok Kritis: ${stockAlerts || 'Semua stok aman'}\n\nBerikan respon singkat, profesional, dan actionable untuk Owner restoran.`;
       
       const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          contents: [{ parts: [{ text: promptText }] }]
       });
       const aiText = response.data.candidates[0].content.parts[0].text;
       return res.json({ source: 'Smart Insight', analysis: aiText });
    } 
    
    // 3. Fallback: Analisa Algoritmik Cerdas (Jika API Key belum ada)
    let fallbackAnalysis = "📊 **Smart Operational Insight:**\n\n";
    const profit = totalIncome - totalExpense;
    
    if (profit > 0) fallbackAnalysis += `✅ **Keuangan:** Kinerja luar biasa! Restoran mencetak profit kotor Rp ${profit.toLocaleString('id-ID')} hari ini. Penjualan kasir berjalan optimal.\n\n`;
    else if (totalIncome === 0) fallbackAnalysis += `⚠️ **Keuangan:** Belum ada pemasukan yang tercatat hari ini. Pastikan kasir telah membuka shift dan memulai transaksi.\n\n`;
    else fallbackAnalysis += `🚨 **Keuangan:** Perhatian! Total pengeluaran (Rp ${totalExpense.toLocaleString('id-ID')}) lebih besar dari pendapatan (Rp ${totalIncome.toLocaleString('id-ID')}). Mohon evaluasi kembali efisiensi belanja staf gudang.\n\n`;

    if (criticalStocks.length > 0) fallbackAnalysis += `📦 **Inventori / Dapur:** Terdapat ${criticalStocks.length} bahan baku yang menipis (Contoh: ${stockAlerts}). Segera arahkan Chef / Admin untuk membuat Purchase Order (PO) ke Supplier agar menu besok tidak Sold Out.\n\n`;
    else fallbackAnalysis += `📦 **Inventori / Dapur:** Manajemen stok sangat sehat. Tidak ada bahan baku yang masuk ke batas peringatan minimum.\n\n`;

    fallbackAnalysis += `*(💡 Info: Tambahkan variabel GEMINI_API_KEY di file .env server Anda untuk mengaktifkan analisa kecerdasan buatan (Machine Learning) yang jauh lebih natural).*`;

    return res.json({ source: 'Algoritma Internal', analysis: fallbackAnalysis });
  } catch(e) { 
    console.error('AI Insight Error:', e.message);
    res.status(500).json({ error: 'Gagal memproses analisa bisnis.' }); 
  }
});

// ==========================================
// ✨ FASE 6: POS & TRANSAKSI V2 (BOM AUTO-DEDUCT)
// ==========================================

app.post(['/api/orders', '/api/v2/orders', '/api/public/orders'], authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'KASIR', 'user']), async (req, res) => {
  const { items, total, paymentMethod, chefId, address, customerNameOverride, memberId, voucherCode, redeemPoints } = req.body;
  const outletId = req.user.outletId;
  
  try {
    await syncV2User(req.user);
    // Fallback outlet jika OWNER login tanpa spesifik outlet
    let targetOutletId = outletId;
    if (!targetOutletId) {
        const firstOutlet = await prisma.outlet.findFirst();
        if (firstOutlet) targetOutletId = firstOutlet.id;
        else return res.status(400).json({ error: 'Belum ada data Outlet untuk proses transaksi.' });
    }

    const receiptNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const statusEnum = paymentMethod === 'Open Bill' ? 'PENDING' : 'COMPLETED';
    const pmEnum = paymentMethod === 'Open Bill' ? 'CASH' : paymentMethod.toUpperCase();

    // Jalankan transaksi database (All-or-Nothing)
    const newOrder = await prisma.$transaction(async (tx) => {
      
      // ✨ FIX 2: Cegah Crash Skema Prisma saat Checkout "Item Manual/Custom"
      let processedItems = [];
      for (const item of items) {
         if (item.isCustom) {
             let dummyMenu = await tx.menu.findFirst({ where: { name: 'Item Manual (Custom)' } });
             if (!dummyMenu) dummyMenu = await tx.menu.create({ data: { name: 'Item Manual (Custom)', price: 0 }});
             processedItems.push({ menuId: dummyMenu.id, qty: Number(item.qty), price: Number(item.rawPrice || parseInt(String(item.price).replace(/\D/g, '')) || 0) });
         } else {
             processedItems.push({ menuId: item.id, qty: Number(item.qty), price: Number(item.rawPrice || parseInt(String(item.price).replace(/\D/g, '')) || 0) });
         }
      }

      const order = await tx.order.create({
        data: {
          receiptNumber,
          total: Number(total),
          paymentMethod: pmEnum,
          status: statusEnum,
          outletId: targetOutletId,
          kasirId: req.user.id,
          chefId: chefId || null,
          items: {
            create: processedItems
          }
        },
        include: { items: { include: { menu: true } }, kasir: true, chef: true, outlet: true }
      });

      // ✨ AUTO-DEDUCT BOM STOK: Kurangi bahan baku berdasarkan resep
      for (const item of items) {
         if (item.isCustom) continue; // Skip item manual
         const menu = await tx.menu.findUnique({ where: { id: item.id }, include: { recipes: true } });
         
         if (menu && menu.recipes.length > 0) {
             for (const recipe of menu.recipes) {
                 const totalDeduction = recipe.qtyNeeded * item.qty;
                 
                 // Ambil stok saat ini
                 const currentStock = await tx.outletStock.findUnique({
                    where: { outletId_materialId: { outletId: targetOutletId, materialId: recipe.materialId } }
                 });
                 const newStockQty = currentStock ? currentStock.qty - totalDeduction : -totalDeduction;

                 // Update/Kurangi stok
                 await tx.outletStock.upsert({
                     where: { outletId_materialId: { outletId: targetOutletId, materialId: recipe.materialId } },
                     update: { qty: newStockQty },
                     create: { outletId: targetOutletId, materialId: recipe.materialId, qty: newStockQty }
                 });

                 // Catat riwayat pergerakan stok (Kartu Stok)
                 await tx.stockMutation.create({
                     data: { outletId: targetOutletId, materialId: recipe.materialId, userId: req.user.id, qty: -totalDeduction, type: 'OUT_SALES', reference: receiptNumber, note: `Terjual POS: ${menu.name} (x${item.qty})` }
                 });
             }
         }
      }

      // ✨ FIX (CRM & VOUCHER): Sinkronisasi dengan Loyalty Points dan Promo V1 Lama
      if (voucherCode) {
          await tx.voucher.updateMany({ where: { code: voucherCode, quota: { gt: 0 } }, data: { quota: { decrement: 1 } } });
      }
      if (memberId) {
          const cust = await tx.customer.findUnique({ where: { id: String(memberId) } });
          if (cust) {
              let newPoints = cust.points >= Number(redeemPoints || 0) ? cust.points - Number(redeemPoints || 0) : cust.points;
              newPoints += Math.floor(Number(total) / 1000);
              await tx.customer.update({ where: { id: String(memberId) }, data: { points: newPoints } });
          }
      }

      return order;
    });

    res.status(201).json({ message: 'Transaksi berhasil', orderId: newOrder.id, order: newOrder });
  } catch (err) {
    console.error("V2 Order Error:", err);
    res.status(500).json({ error: 'Gagal memproses transaksi V2: ' + err.message });
  }
});

// Endpoint Register User Baru (Untuk menambah admin/staff lain)
app.post('/api/register', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { username, password, role, department } = req.body;

  try {
    // Cek apakah username sudah ada di database
    const checkUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username sudah digunakan!' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user baru ke PostgreSQL
    const insertQuery = 'INSERT INTO users (username, password, role, department) VALUES ($1, $2, $3, $4) RETURNING id, username, role';
    const newUser = await pool.query(insertQuery, [username, hashedPassword, role || 'staff', department || 'all']);

    res.status(201).json({ message: 'User berhasil didaftarkan', user: newUser.rows[0] });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Gagal mendaftarkan user ke database.' });
  }
});

// ✨ NEW: Endpoint Register Publik (Sign Up untuk Pengunjung/Customer)
app.post('/api/public/register', async (req, res) => {
  const { username, password, email, phone } = req.body;

  try {
    if (!email) return res.status(400).json({ error: 'Email wajib diisi untuk pengiriman OTP.' });

    const checkUser = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username atau Email sudah terdaftar!' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6 digit OTP
    const hashedPassword = bcrypt.hashSync(password, 10);

    const insertQuery = 'INSERT INTO users (username, password, role, department, email, is_verified, otp_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, role';
    const newUser = await pool.query(insertQuery, [username, hashedPassword, 'user', 'public', email, false, otp]);

    // Otomatis daftar ke program loyalty (tabel customers) jika mengisi No HP
    if (phone) {
      await pool.query('INSERT INTO customers (name, phone, points, type) VALUES ($1, $2, 0, $3)', [username, phone, 'silver']).catch(() => { });
    }

    // Kirim Email OTP (Asynchronous agar tidak memblokir response)
    if (transporter) {
      transporter.sendMail({
        from: `"Sistem Restoran" <${process.env.SMTP_USER || 'GANTI_DENGAN_EMAIL_GMAIL_ANDA@gmail.com'}>`,
        to: email,
        subject: "Kode Verifikasi Akun Restoran",
        html: `<h2>Halo ${username},</h2><p>Terima kasih telah mendaftar. Kode OTP Anda adalah: <strong style="font-size:24px; color:#4f46e5; letter-spacing: 2px;">${otp}</strong></p><p>Masukkan kode tersebut di aplikasi untuk mengaktifkan akun Anda.</p>`
      }).catch(err => console.error("Gagal kirim email:", err));
    }
    // console.log(`\n🔑 [DEV-MODE] KODE OTP UNTUK ${username} (${email}) ADALAH: ${otp}\n`); // Disembunyikan untuk keamanan Production

    res.status(201).json({ message: 'Registrasi berhasil! Silakan cek email Anda untuk kode OTP.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Gagal mendaftar ke sistem database.' });
  }
});

// ✨ NEW: Endpoint Verifikasi OTP
app.post('/api/public/verify-otp', async (req, res) => {
  const { username, otp } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (user.rowCount === 0) return res.status(404).json({ error: 'User tidak ditemukan.' });

    if (user.rows[0].otp_code !== otp) {
      return res.status(400).json({ error: 'Kode OTP salah atau tidak valid.' });
    }

    await pool.query('UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE username = $1', [username]);

    // ✨ NEW: Auto-login setelah verifikasi berhasil
    const verifiedUser = user.rows[0];
    const userPayload = { id: verifiedUser.id, username: verifiedUser.username, role: verifiedUser.role, department: verifiedUser.department };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });

    res.json({ message: 'Verifikasi berhasil! Anda telah otomatis masuk.', token, user: userPayload });
  } catch (e) {
    res.status(500).json({ error: 'Database error saat verifikasi OTP' });
  }
});

// --- PROFILE ENDPOINTS ---

// Endpoint Get Current User Profile (Untuk mendapatkan data terbaru termasuk avatar)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    // ✨ V2: Coba ambil dari Prisma (Sistem Baru) terlebih dahulu
    let userPrisma = null;
    try {
      userPrisma = await prisma.user.findUnique({
        where: { id: String(req.user.id) },
        include: { outlet: true }
      });
    } catch(e) { console.log('Prisma belum siap, fallback ke pool lama'); }

    if (userPrisma) {
        return res.json({
            id: userPrisma.id,
            username: userPrisma.username,
            role: userPrisma.role,
            department: userPrisma.outlet?.name || 'All Outlets',
            outletId: userPrisma.outletId,
            isActive: userPrisma.isActive
        });
    }

    // Ambil data dari PostgreSQL (V1 Fallback untuk User Lama)
    const result = await pool.query('SELECT id, username, role, department, email, bio, image FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint Update Profile (Bio, Email, Avatar)
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  const { email, bio, image } = req.body;

  try {
    // COALESCE digunakan agar jika nilai body kosong, tetap pakai nilai lama di database
    const updateQuery = `
      UPDATE users 
      SET email = COALESCE($1, email), 
          bio = COALESCE($2, bio), 
          image = COALESCE($3, image) 
      WHERE id = $4 
      RETURNING id, username, role, department, email, bio, image
    `;
    const result = await pool.query(updateQuery, [email, bio, image, req.user.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint Get All Users (Hanya untuk Admin)
app.get('/api/users', authenticateToken, authorizeRole(['admin', 'superadmin', 'staff']), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, department FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint untuk menghapus user (Hanya untuk Admin)
app.delete('/api/users/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const userIdToDelete = parseInt(req.params.id, 10);
  const currentUserId = req.user.id;

  // Keamanan: Admin tidak bisa menghapus dirinya sendiri
  if (userIdToDelete === currentUserId) {
    return res.status(403).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
  }

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userIdToDelete]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    logActivity('DELETE-USER', 'system', `Admin menghapus user ID: ${userIdToDelete}`);
    res.json({ message: 'User berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint Reset Password User (Hanya untuk Admin)
app.put('/api/users/:id/reset-password', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const userIdToReset = parseInt(req.params.id, 10);
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const result = await pool.query('UPDATE users SET password = $1 WHERE id = $2 RETURNING id', [hashedPassword, userIdToReset]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    logActivity('RESET-PASSWORD', 'system', `Admin mereset password user ID: ${userIdToReset}`);
    res.json({ message: 'Password user berhasil direset.' });
  } catch (err) {
    console.error('Error reset password:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint untuk user mengganti passwordnya sendiri
app.put('/api/users/change-password', authenticateToken, async (req, res) => {
  const { current, newPassword } = req.body;
  const userId = req.user.id;

  if (!current || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Data tidak lengkap atau password baru kurang dari 6 karakter.' });
  }

  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User tidak ditemukan.' });

    const user = result.rows[0];
    // Verifikasi password saat ini
    if (!bcrypt.compareSync(current, user.password)) {
      return res.status(403).json({ error: 'Password saat ini salah.' });
    }

    // Update ke password baru
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Password berhasil diubah.' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// A simple health check endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the Restoran Backend!' });
});

app.get('/', (req, res) => {
  res.send('<h1 style="font-family:sans-serif; color:#4f46e5;">✅ Mesin Server Aktif!</h1><p style="font-family:sans-serif;">Ini adalah server database. Untuk melihat tampilan aplikasi restoran, silakan akses link <b>Client</b> Anda (biasanya berakhiran port <b>:5173</b>).</p>');
});

// ✨ FITUR 4: API Simpan Token FCM User & Helper Push Notif
app.post('/api/users/fcm-token', authenticateToken, async (req, res) => {
  const { fcmToken } = req.body;
  try {
    await pool.query('UPDATE users SET fcm_token = $1 WHERE id = $2', [fcmToken, req.user.id]);
    res.json({ message: 'FCM Token berhasil disimpan.' });
  } catch (err) { res.status(500).json({ error: 'Gagal menyimpan FCM token.' }); }
});

const sendPushNotification = async (userId, title, body, data = {}) => {
  // ✨ FITUR PUSH NOTIFICATION DIMATIKAN SEMENTARA
  return;
  if (!fcmInitialized || !admin) return;
  try {
    const userRes = await pool.query('SELECT fcm_token FROM users WHERE id = $1', [userId]);
    const token = userRes.rows[0]?.fcm_token;
    if (token) {
      await admin.messaging().send({
        token, notification: { title, body }, data
      });
      console.log(`[FCM] Push Notif terkirim ke User ID: ${userId}`);
    }
  } catch (err) { console.error('[FCM] Gagal kirim Push Notif:', err.message); }
};

// --- DATA STORAGE (FILE BASED) ---
const DATA_FILE = path.join(__dirname, 'data.json');

// Helper: Membaca data dari file
const readData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}));
    }
    const jsonData = fs.readFileSync(DATA_FILE);
    return JSON.parse(jsonData);
  } catch (e) {
    return {};
  }
};

// Helper: Menyimpan data ke file
const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// --- MIGRASI & INISIALISASI DATA AWAL (HANYA SEKALI JALAN) ---
const initializeAndMigrateData = async () => {
  try {
    // ✨ FIX: Auto-create Base Tables untuk Database Baru (Agar tidak error relation does not exist)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY, username VARCHAR(100) UNIQUE, password VARCHAR(255), role VARCHAR(50) DEFAULT 'user', department VARCHAR(100) DEFAULT 'all', email VARCHAR(255), is_verified BOOLEAN DEFAULT TRUE, otp_code VARCHAR(10), bio TEXT, image TEXT, fcm_token TEXT, wallet_balance NUMERIC DEFAULT 0, points INT DEFAULT 0, address_book TEXT DEFAULT '[]');
      CREATE TABLE IF NOT EXISTS ingredients (id BIGSERIAL PRIMARY KEY, name VARCHAR(255) UNIQUE, stock NUMERIC DEFAULT 0, unit VARCHAR(50), min_stock NUMERIC DEFAULT 0, cost NUMERIC DEFAULT 0, last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS products (id BIGINT PRIMARY KEY, service_name VARCHAR(100), name VARCHAR(255), price NUMERIC, image TEXT, stock NUMERIC, cuisine VARCHAR(100), recipe TEXT, description TEXT, category VARCHAR(100), weight INT DEFAULT 0, discount_price NUMERIC, variants TEXT DEFAULT '[]', last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS vouchers (id BIGSERIAL PRIMARY KEY, name VARCHAR(255), code VARCHAR(50) UNIQUE, type VARCHAR(50), value NUMERIC, min_order NUMERIC, is_active BOOLEAN DEFAULT TRUE, quota INT DEFAULT -1);
      CREATE TABLE IF NOT EXISTS reviews (id BIGSERIAL PRIMARY KEY, item_id BIGINT, user_id BIGINT, username VARCHAR(255), rating INT, comment TEXT, date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS suppliers (id BIGSERIAL PRIMARY KEY, name VARCHAR(255), phone VARCHAR(50), address TEXT, contact_person VARCHAR(255));
      CREATE TABLE IF NOT EXISTS expenses (id BIGSERIAL PRIMARY KEY, date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, category VARCHAR(100), amount NUMERIC, description TEXT, recorded_by VARCHAR(100));
      CREATE TABLE IF NOT EXISTS store_settings (key VARCHAR(100) PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS activity_log (id BIGINT PRIMARY KEY, timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, action VARCHAR(100), service VARCHAR(100), details TEXT);
      CREATE TABLE IF NOT EXISTS customers (id BIGSERIAL PRIMARY KEY, name VARCHAR(255), phone VARCHAR(50), points INT DEFAULT 0, type VARCHAR(50) DEFAULT 'silver');
      CREATE TABLE IF NOT EXISTS tables (id BIGSERIAL PRIMARY KEY, name VARCHAR(100), status VARCHAR(50) DEFAULT 'Available', x INT DEFAULT 0, y INT DEFAULT 0);
      CREATE TABLE IF NOT EXISTS shifts (id BIGSERIAL PRIMARY KEY, user_id VARCHAR(255), start_time TIMESTAMP WITH TIME ZONE, start_cash NUMERIC, end_time TIMESTAMP WITH TIME ZONE, end_cash NUMERIC, expected_cash NUMERIC, cash_sales NUMERIC, non_cash_sales NUMERIC, total_sales NUMERIC, cash_in_op NUMERIC, cash_out_op NUMERIC, difference NUMERIC, status VARCHAR(50), transaction_count INT);
      CREATE TABLE IF NOT EXISTS shift_movements (id BIGSERIAL PRIMARY KEY, shift_id BIGINT, type VARCHAR(50), amount NUMERIC, note TEXT);
      CREATE TABLE IF NOT EXISTS attendance (id BIGSERIAL PRIMARY KEY, user_id VARCHAR(255), attendance_date DATE, clock_in TIMESTAMP WITH TIME ZONE, clock_out TIMESTAMP WITH TIME ZONE);
      CREATE TABLE IF NOT EXISTS orders (id BIGINT PRIMARY KEY, date TIMESTAMP WITH TIME ZONE, customer_id VARCHAR(100), customer_name VARCHAR(255), address TEXT, total NUMERIC, payment_method VARCHAR(50), voucher_code VARCHAR(50), status VARCHAR(50), items TEXT, seller_name VARCHAR(100), seller_id VARCHAR(100), payment_session_id VARCHAR(100), tracking_number VARCHAR(100), processed_by VARCHAR(100), return_reason TEXT, return_image TEXT);
      CREATE TABLE IF NOT EXISTS restaurant_reservations (id BIGSERIAL PRIMARY KEY, customer_name VARCHAR(255), contact VARCHAR(100), reservation_date DATE, reservation_time TIME, pax INT, table_id BIGINT, note TEXT, status VARCHAR(50) DEFAULT 'Pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
    `);

    // ✨ NEW: Auto-create tabel log untuk Inventori
    await pool.query(`
      CREATE TABLE IF NOT EXISTS restock_log (
        id BIGSERIAL PRIMARY KEY,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ingredient_id BIGINT REFERENCES ingredients(id) ON DELETE SET NULL,
        ingredient_name VARCHAR(100),
        qty NUMERIC,
        unit VARCHAR(50),
        cost NUMERIC,
        total_spent NUMERIC,
        supplier VARCHAR(255),
        reported_by VARCHAR(100)
      );
      CREATE TABLE IF NOT EXISTS waste_log (
        id BIGSERIAL PRIMARY KEY,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ingredient_id BIGINT REFERENCES ingredients(id) ON DELETE SET NULL,
        ingredient_name VARCHAR(100),
        qty NUMERIC,
        unit VARCHAR(50),
        cost_loss NUMERIC,
        reason TEXT,
        reported_by VARCHAR(100)
      );
    `);

    // ✨ FIX: Memastikan kolom name dan status ada jika tabel sudah terlanjur dibuat sebelumnya
    await pool.query("ALTER TABLE tables ADD COLUMN IF NOT EXISTS name VARCHAR(100)").catch(() => { });
    await pool.query("ALTER TABLE tables ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Available'").catch(() => { });
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP").catch(() => { });
    await pool.query("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP").catch(() => { });
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS service_name VARCHAR(100) DEFAULT 'restoran'").catch(() => { });

    // ✨ FIX: Tambahkan contactPerson ke tabel Supplier V2 secara aman tanpa Prisma Push
    await pool.query('ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "contactPerson" TEXT').catch(() => { });

    // ✨ FIX: Sesuaikan tipe data relasi User ID dari BIGINT menjadi VARCHAR(255) (Migrasi Prisma V2 UUID)
    await pool.query("ALTER TABLE reviews ALTER COLUMN item_id TYPE VARCHAR(255)").catch(() => { });
    await pool.query("ALTER TABLE shifts ALTER COLUMN user_id TYPE VARCHAR(255)").catch(() => { });
    await pool.query("ALTER TABLE attendance ALTER COLUMN user_id TYPE VARCHAR(255)").catch(() => { });
    await pool.query("ALTER TABLE reviews ALTER COLUMN user_id TYPE VARCHAR(255)").catch(() => { });

    const data = readData(); // Baca data.json untuk terakhir kalinya

    // ✨ FASE 2: Auto-Seed Akun OWNER (Menggunakan Pool/Raw SQL agar pasti terbuat)
    try {
        const hashedPassword = bcrypt.hashSync('owner123', 10);
        const checkOwner = await pool.query("SELECT id FROM users WHERE username = 'owner'");
        if (checkOwner.rowCount === 0) {
            await pool.query(
                "INSERT INTO users (username, password, role, department, is_verified) VALUES ($1, $2, $3, $4, $5)",
                ['owner', hashedPassword, 'OWNER', 'All Outlets', true]
            );
            console.log('✅ Akun OWNER default berhasil dibuat (user: owner, pass: owner123).');
        } else {
            // ✨ PAKSA UPDATE PASSWORD jika akun sudah ada (Mencegah salah sandi)
            await pool.query("UPDATE users SET password = $1, role = 'OWNER' WHERE username = 'owner'", [hashedPassword]);
            console.log('✅ Sandi OWNER dipaksa reset ke default (user: owner, pass: owner123).');
        }
    } catch(e) { console.log('⚠️ Gagal auto-seed owner.', e.message); }

    // ✨ FIX: Auto-seed Admin User (Pastikan selalu ada terlepas dari user lain)
    try {
        const hashedPasswordAdmin = bcrypt.hashSync('admin123', 10);
        const checkAdmin = await pool.query("SELECT id FROM users WHERE username = 'admin'");
        if (checkAdmin.rowCount === 0) {
            await pool.query("INSERT INTO users (username, password, role, department, is_verified) VALUES ($1, $2, $3, $4, $5)", ['admin', hashedPasswordAdmin, 'superadmin', 'restoran', true]);
            console.log('✅ Akun ADMIN default berhasil dibuat (user: admin, pass: admin123).');
        } else {
            // Paksa reset password admin untuk memastikan selalu bisa login
            await pool.query("UPDATE users SET password = $1, role = 'superadmin' WHERE username = 'admin'", [hashedPasswordAdmin]);
            console.log('✅ Sandi ADMIN dipaksa reset ke default (user: admin, pass: admin123).');
        }
    } catch(e) { console.log('⚠️ Gagal auto-seed admin.', e.message); }

    // Migrasi Ingredients
    const ingredientsCount = await pool.query('SELECT COUNT(*) FROM ingredients');
    if (parseInt(ingredientsCount.rows[0].count) === 0 && data.ingredients) {
      for (const item of data.ingredients) {
        await pool.query('INSERT INTO ingredients (name, stock, unit, min_stock, cost) VALUES ($1, $2, $3, $4, $5)', [item.name, item.stock, item.unit, item.minStock, item.cost]);
      }
      console.log(`[MIGRASI] ${data.ingredients.length} bahan baku berhasil dipindahkan ke DB.`);
    }

    // Migrasi Vouchers
    const vouchersCount = await pool.query('SELECT COUNT(*) FROM vouchers');
    if (parseInt(vouchersCount.rows[0].count) === 0 && data.vouchers) {
      for (const item of data.vouchers) {
        await pool.query('INSERT INTO vouchers (name, code, type, value, min_order, is_active) VALUES ($1, $2, $3, $4, $5, $6)', [item.name, item.code, item.type, item.value, item.minOrder, item.isActive]);
      }
      console.log(`[MIGRASI] ${data.vouchers.length} voucher berhasil dipindahkan ke DB.`);
    }

    // Migrasi Reviews
    const reviewsCount = await pool.query('SELECT COUNT(*) FROM reviews');
    if (parseInt(reviewsCount.rows[0].count) === 0 && data.reviews) {
      for (const item of data.reviews) {
        await pool.query('INSERT INTO reviews (item_id, username, rating, comment, date) VALUES ($1, $2, $3, $4, $5)', [item.itemId, item.username, item.rating, item.comment, item.date]);
      }
      console.log(`[MIGRASI] ${data.reviews.length} ulasan berhasil dipindahkan ke DB.`);
    }

    // Migrasi Suppliers
    const suppliersCount = await pool.query('SELECT COUNT(*) FROM suppliers');
    if (parseInt(suppliersCount.rows[0].count) === 0 && data.suppliers) {
      for (const item of data.suppliers) {
        await pool.query('INSERT INTO suppliers (name, phone, address, contact_person) VALUES ($1, $2, $3, $4)', [item.name, item.phone, item.address, item.contactPerson]);
      }
      console.log(`[MIGRASI] ${data.suppliers.length} supplier berhasil dipindahkan ke DB.`);
    }

    // Migrasi Expenses
    const expensesCount = await pool.query('SELECT COUNT(*) FROM expenses');
    if (parseInt(expensesCount.rows[0].count) === 0 && data.expenses) {
      for (const item of data.expenses) {
        await pool.query('INSERT INTO expenses (date, category, amount, description, recorded_by) VALUES ($1, $2, $3, $4, $5)', [item.date, item.category, item.amount, item.description, item.recordedBy]);
      }
      console.log(`[MIGRASI] ${data.expenses.length} pengeluaran berhasil dipindahkan ke DB.`);
    }

    // Migrasi/Inisialisasi Settings
    const settingsCount = await pool.query('SELECT COUNT(*) FROM store_settings');
    if (parseInt(settingsCount.rows[0].count) === 0) {
      const settings = data.settings || {
        storeName: 'Restoran Kita',
        storeAddress: 'Jl. Digital No. 1, Jakarta',
        storePhone: '021-12345678',
        receiptFooter: 'Terima kasih atas kunjungan Anda.',
        taxPercentage: 11,
        serviceChargePercentage: 0
      };
      for (const key in settings) {
        await pool.query('INSERT INTO store_settings (key, value) VALUES ($1, $2)', [key, settings[key]]);
      }
      console.log(`[MIGRASI] Pengaturan toko berhasil disimpan ke DB.`);
    }


    // ✨ FIX: Auto-seed 10 Meja default jika tabel meja masih kosong
    const tablesCount = await pool.query('SELECT COUNT(*) FROM tables');
    if (parseInt(tablesCount.rows[0].count) === 0) {
      console.log('Inisialisasi data meja default...');
      for(let i=1; i<=10; i++) {
        await pool.query('INSERT INTO tables (name, status, x, y) VALUES ($1, $2, $3, $4)', [`Meja ${i}`, 'Available', ((i-1) % 5) * 120 + 20, Math.floor((i-1) / 5) * 120 + 20]);
      }
      console.log(`[MIGRASI] 10 Meja default berhasil dibuat ke DB.`);
    }

  } catch (err) { console.error('Gagal inisialisasi data:', err); }
};
initializeAndMigrateData(); // Panggil fungsi ini

// Helper: Mencatat Aktivitas (Log) ke PostgreSQL
const logActivity = async (action, service, details) => {
  try {
    await prisma.activityLog.create({ data: { action, service: String(service), details: String(details) } });
  } catch (err) {
    console.error('Gagal mencatat log ke database:', err);
  }
};

// Helper sinkronisasi user V1 ke V2
const syncV2User = async (user) => {
    if (!user || !user.id) return String(user?.id || '0');
    const uid = String(user.id);
    try {
        const exists = await prisma.user.findUnique({ where: { id: uid } });
        if (!exists) {
            let v2Role = 'KASIR';
            const r = String(user.role).toUpperCase();
            if (r === 'OWNER' || r === 'SUPERADMIN') v2Role = 'OWNER';
            else if (r === 'ADMIN') v2Role = 'ADMIN';
            else if (r === 'CHEF') v2Role = 'CHEF';
            await prisma.user.create({ data: { id: uid, username: user.username || 'System', password: 'migrated', role: v2Role } });
        }
    } catch(e) {}
    return uid;
};

// --- SHIFT MANAGEMENT ENDPOINTS (MOVED HERE FOR PRIORITY) ---
app.get(['/api/shifts/active', '/api/v2/shifts/active'], authenticateToken, async (req, res) => {
  try {
    await syncV2User(req.user);
    const shift = await prisma.shift.findFirst({ where: { userId: String(req.user.id), status: 'open' }, include: { user: { select: { username: true } } } });
    if (shift) return res.json({ ...shift, start_time: shift.startTime, start_cash: shift.startCash, username: shift.user?.username });
    res.json(null);
  } catch (err) { 
    res.status(500).json({ error: 'Database error: ' + err.message }); 
  }
});

app.post(['/api/shifts/start', '/api/v2/shifts/start'], authenticateToken, async (req, res) => {
  const { startCash } = req.body;
  try {
    await syncV2User(req.user);
    const existing = await prisma.shift.findFirst({ where: { userId: String(req.user.id), status: 'open' } });
    if (existing) return res.json({ ...existing, start_time: existing.startTime, start_cash: existing.startCash });

    const newShift = await prisma.shift.create({ data: { userId: String(req.user.id), startTime: new Date(), startCash: Number(startCash), status: 'open', outletId: req.user.outletId || null } });
    logActivity('SHIFT-START', 'system', `Shift dimulai oleh ${req.user.username} (Modal: ${newShift.startCash})`);
    res.json({ ...newShift, start_time: newShift.startTime, start_cash: newShift.startCash });
  } catch (err) { 
    res.status(500).json({ error: 'Database error: ' + err.message }); 
  }
});

app.post(['/api/shifts/movement', '/api/v2/shifts/movement'], authenticateToken, async (req, res) => {
  const { type, amount, note } = req.body; // type: 'in' | 'out'
  try {
    await syncV2User(req.user);
    const shift = await prisma.shift.findFirst({ where: { userId: String(req.user.id), status: 'open' } });
    if (!shift) return res.status(400).json({ error: 'Tidak ada shift aktif.' });

    await prisma.shiftMovement.create({ data: { shiftId: shift.id, type, amount: Number(amount), note } });
    logActivity('CASH-MOVEMENT', 'system', `Kas ${type === 'in' ? 'Masuk' : 'Keluar'}: Rp ${amount} (${note}) by ${req.user.username}`);
    
    const updatedShift = await prisma.shift.findUnique({ where: { id: shift.id }, include: { movements: true } });
    res.json({ ...updatedShift, start_time: updatedShift.startTime, start_cash: updatedShift.startCash });
  } catch (err) { 
    res.status(500).json({ error: 'Database error: ' + err.message }); 
  }
});

app.post(['/api/shifts/end', '/api/v2/shifts/end'], authenticateToken, async (req, res) => {
  const { endCash } = req.body;
  try {
    await syncV2User(req.user);
    const shift = await prisma.shift.findFirst({ where: { userId: String(req.user.id), status: 'open' }, include: { movements: true } });
    if (!shift) return res.status(400).json({ error: 'Tidak ada shift aktif.' });

    const endTime = new Date();

    const v2Orders = await prisma.order.findMany({ where: { kasirId: String(req.user.id), createdAt: { gte: shift.startTime }, status: 'COMPLETED' } });

    const v1OrdersResult = await pool.query(
      "SELECT total, payment_method FROM orders WHERE date >= $1 AND processed_by = $2 AND status = 'Completed'",
      [shift.startTime.toISOString(), String(req.user.id)]
    ).catch(() => ({ rows: [] }));

    const salesDuringShift = [
      ...v2Orders.map(o => ({ total: Number(o.total), paymentMethod: o.paymentMethod })), // V2 (CASH, QRIS, dll)
      ...v1OrdersResult.rows.map(o => ({ total: Number(o.total), paymentMethod: o.payment_method })) // V1 (Tunai)
    ];

    const cashSales = salesDuringShift.filter(o => o.paymentMethod === 'Tunai' || o.paymentMethod === 'CASH').reduce((acc, o) => acc + o.total, 0);
    const nonCashSales = salesDuringShift.filter(o => o.paymentMethod !== 'Tunai' && o.paymentMethod !== 'CASH').reduce((acc, o) => acc + o.total, 0);

    const cashInOp = shift.movements.filter(m => m.type === 'in').reduce((acc, m) => acc + m.amount, 0);
    const cashOutOp = shift.movements.filter(m => m.type === 'out').reduce((acc, m) => acc + m.amount, 0);

    const expectedCash = shift.startCash + cashSales + cashInOp - cashOutOp;
    const difference = Number(endCash) - expectedCash;

    const closedShift = await prisma.shift.update({
      where: { id: shift.id },
      data: { endTime, endCash: Number(endCash), expectedCash, cashSales, nonCashSales, totalSales: cashSales + nonCashSales, cashInOp, cashOutOp, difference, status: 'closed', transactionCount: salesDuringShift.length }
    });

    logActivity('SHIFT-END', 'system', `Shift diakhiri oleh ${req.user.username}.`);
    res.json({ ...closedShift, end_time: closedShift.endTime, end_cash: closedShift.endCash, expected_cash: closedShift.expectedCash, username: req.user.username });
  } catch (err) {
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

app.get(['/api/shifts/history', '/api/v2/shifts/history'], authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'admin', 'superadmin', 'staff', 'KASIR']), async (req, res) => {
  try {
    const shifts = await prisma.shift.findMany({ where: { status: 'closed' }, include: { user: { select: { username: true } } }, orderBy: { endTime: 'desc' } });
    // Map back to V1 format for frontend compatibility
    const mapped = shifts.map(s => ({ ...s, username: s.user?.username || 'Unknown', start_time: s.startTime, end_time: s.endTime, start_cash: s.startCash, end_cash: s.endCash, expected_cash: s.expectedCash, cash_sales: s.cashSales, non_cash_sales: s.nonCashSales, total_sales: s.totalSales, cash_in_op: s.cashInOp, cash_out_op: s.cashOutOp }));
    res.json(mapped);
  } catch (err) { 
    res.status(500).json({ error: 'Database error: ' + err.message }); 
  }
});

// ✨ PERBAIKAN MUTLAK API KIRIM WA (Menerima Base64 JSON)
app.post('/api/whatsapp/send-shift-report', authenticateToken, async (req, res) => {
  const { message, pdfBase64, filename } = req.body;
  
  if (!message || !pdfBase64) {
    return res.status(400).json({ error: 'Request tidak lengkap. Butuh pdfBase64 dan message.' });
  }

  const targetNumber = '6289521410568'; // ✨ NOMOR OWNER
  const fonnteToken = process.env.FONNTE_API_TOKEN || 'QkaD1mW8Ppbs3J8R1273';

  try {
    if (!fonnteToken) {
      console.log('\n⚠️ [PERINGATAN] FONNTE_API_TOKEN tidak diatur.');
      return res.json({ message: 'Mode Simulasi' });
    }

    // 1. Rebuild Data URI dan upload ke Cloudinary
    // Alasan: Penyimpanan lokal (localhost/IP) tidak bisa diakses dari jaringan berbeda (paket data HP Owner).
    // Cloudinary adalah solusi agar link bisa diakses dari mana saja.
    // 1. Simpan PDF ke server lokal (Bypass Cloudinary 100%)
    // Cloudinary default memblokir PDF (401) untuk alasan keamanan (Strict delivery)
    console.log(`\n📤 Menyimpan PDF ke server lokal...`);
    
    const base64DataPayload = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
    const buffer = Buffer.from(base64DataPayload, 'base64');
    
    const safeFilename = Date.now() + '-' + filename;
    const filePath = path.join(__dirname, 'uploads', safeFilename);
    fs.writeFileSync(filePath, buffer);

    // Saat di-deploy ke server publik, req.get('host') akan berisi domain/IP publik.
    const hostUrl = req.protocol + '://' + req.get('host');
    const publicFileUrl = `${hostUrl}/uploads/${safeFilename}`;
    console.log(`\n🔗 Link PDF Lokal berhasil dibuat: ${publicFileUrl}`);

    // 2. Gabungkan narasi laporan dengan link PDF menjadi satu pesan teks
    const finalMessage = `${message}\n\n📄 *Unduh Laporan PDF:*\n${publicFileUrl}`;

    // 3. Kirim SATU KALI sebagai pesan teks biasa
    console.log(`\n📤 Mengirim Laporan (Teks + Link) ke WhatsApp...`);
    const fonnteResponse = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
            'Authorization': fonnteToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            target: targetNumber,
            message: finalMessage
        })
    });

    const fonnteResult = await fonnteResponse.json();
    console.log('Respon Fonnte untuk PDF:', fonnteResult);

    if (!fonnteResult.status) {
        const reason = fonnteResult.reason || 'Unknown error from Fonnte';
        console.error('Fonnte menolak pengiriman PDF:', reason);
        throw new Error(`Fonnte API Error: ${reason}`);
    }

    console.log(`\n📱 [WA AUTO-SENDER] Laporan (Teks + Link) berhasil diproses ke ${targetNumber}...\n`);
    logActivity('SEND-WA', 'System', `Laporan (Teks + Link) diproses ke WA ${targetNumber}`);
    res.json({ message: 'Laporan (Teks + Link) berhasil diproses ke WA Anda!' });
  } catch (err) {
    console.error('WA Send Error:', err.message);
    res.status(500).json({ error: 'Gagal memproses pesan WA.' });
  }
});

// ✨ NEW: Endpoints Absensi Karyawan (Attendance)
app.get('/api/attendance/today', authenticateToken, async (req, res) => {
  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
  try {
    const record = await prisma.attendance.findFirst({ where: { userId: String(req.user.id), attendanceDate: { gte: startOfDay } } });
    res.json(record ? { ...record, username: req.user.username } : null);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/attendance', authenticateToken, async (req, res) => {
  // ✨ FIX: Normalisasi action (in, clock-in, clockin) agar selalu valid
  const actionRaw = String(req.body.action || '').toLowerCase().replace(/[^a-z]/g, '');
  const isClockIn = actionRaw === 'in' || actionRaw === 'clockin';
  const isClockOut = actionRaw === 'out' || actionRaw === 'clockout';

  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);

  try {
    const record = await prisma.attendance.findFirst({ where: { userId: String(req.user.id), attendanceDate: { gte: startOfDay } } });

    if (isClockIn) {
      if (record) return res.status(400).json({ error: 'Anda sudah absen masuk hari ini.' });
      const newRecord = await prisma.attendance.create({ data: { userId: String(req.user.id), attendanceDate: new Date(), clockIn: new Date(), outletId: req.user.outletId || null } });
      logActivity('CLOCK-IN', 'System', `${req.user.username} melakukan absen masuk.`);
      return res.json({ ...newRecord, username: req.user.username });
    } else if (isClockOut) {
      if (!record) return res.status(400).json({ error: 'Anda belum absen masuk hari ini.' });
      if (record.clockOut) return res.status(400).json({ error: 'Anda sudah absen keluar hari ini.' });
      const updated = await prisma.attendance.update({ where: { id: record.id }, data: { clockOut: new Date() } });
      logActivity('CLOCK-OUT', 'System', `${req.user.username} melakukan absen keluar.`);
      return res.json({ ...updated, username: req.user.username });
    }
    res.status(400).json({ error: 'Aksi tidak valid.' });
  } catch (err) { 
    console.error("Attendance Error:", err);
    res.status(500).json({ error: 'Database error: ' + err.message }); 
  }
});

app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const userRole = String(req.user?.role || '').toUpperCase();
    const isAdminLevel = ['ADMIN', 'SUPERADMIN', 'OWNER'].includes(userRole);
    const records = isAdminLevel
      ? await prisma.attendance.findMany({ include: { user: { select: { username: true } } }, orderBy: { clockIn: 'desc' } })
      : await prisma.attendance.findMany({ where: { userId: String(req.user.id) }, include: { user: { select: { username: true } } }, orderBy: { clockIn: 'desc' } });
    
    // Format balik agar Frontend tidak pecah
    const mapped = records.map(r => ({ ...r, username: r.user?.username || 'Unknown', attendance_date: r.attendanceDate, clock_in: r.clockIn, clock_out: r.clockOut }));
    res.json(mapped);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// ✨ NEW: Endpoint Reset Absensi (KHUSUS UNTUK SIMULASI/TESTING)
app.post('/api/attendance/reset', authenticateToken, async (req, res) => {
  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
  try {
    await prisma.attendance.deleteMany({ where: { userId: String(req.user.id), attendanceDate: { gte: startOfDay } } });
    res.json({ message: 'Absensi hari ini direset.' });
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// ✨ NEW: Endpoints Keuangan & Pengeluaran (Expenses)
app.get('/api/expenses', authenticateToken, authorizeRole(['admin', 'superadmin', 'staff', 'OWNER', 'ADMIN']), async (req, res) => {
  try {
    res.json(await prisma.expense.findMany({ orderBy: { date: 'desc' } }));
  } catch (err) { 
    console.error('Error GET /api/expenses:', err.message);
    res.status(500).json({ error: 'Database error: ' + err.message }); 
  }
});

app.post('/api/expenses', authenticateToken, authorizeRole(['admin', 'superadmin', 'OWNER', 'ADMIN']), async (req, res) => {
  const { category, amount, description, date } = req.body;
  const parsedAmount = Number(amount);
  if (!category || !description) return res.status(400).json({ error: 'Kategori dan keterangan wajib diisi.' });
  if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: 'Nominal harus berupa angka positif.' });
  try {
    const expense = await prisma.expense.create({ data: { date: date ? new Date(date) : new Date(), category, amount: parsedAmount, description, recordedBy: req.user.username, outletId: req.user.outletId || null } });
    logActivity('EXPENSE', 'Finance', `Pengeluaran baru: ${category} - Rp ${parsedAmount.toLocaleString('id-ID')}`);
    res.status(201).json(expense);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});


// Endpoint khusus untuk Activity Log
app.get('/api/system/activity-log', authenticateToken, authorizeRole(['admin', 'superadmin', 'ADMIN', 'OWNER', 'SUPERADMIN']), async (req, res) => {
  try {
    // Ambil 100 log terbaru dari database
    const result = await pool.query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching activity log:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint untuk mengambil data meja
app.get(['/api/tables', '/api/v2/tables'], authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tables ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ✨ NEW: Endpoints Customers
app.get(['/api/customers', '/api/v2/customers', '/api/crm', '/api/CRM', '/api/Customers'], authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post(['/api/customers', '/api/v2/customers'], authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'admin', 'staff', 'KASIR']), async (req, res) => {
  const { name, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO customers (name, phone, points, type) VALUES ($1, $2, 0, $3) RETURNING *',
      [name, phone, 'silver']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding customer:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ✨ NEW: Endpoints Vouchers & Promo
app.get(['/api/vouchers', '/api/v2/vouchers', '/api/Vouchers'], authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vouchers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});
app.post(['/api/add/vouchers', '/api/add/Vouchers'], authenticateToken, authorizeRole(['admin', 'superadmin', 'OWNER', 'ADMIN']), async (req, res) => {
  const { name, code, type, value, minOrder, isActive } = req.body;
  try {
    const result = await pool.query('INSERT INTO vouchers (name, code, type, value, min_order, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, code, type, value, minOrder || 0, isActive !== false]);
    res.status(201).json({ message: 'Success', data: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put(['/api/update/vouchers/:id', '/api/update/Vouchers/:id'], authenticateToken, authorizeRole(['admin', 'superadmin', 'OWNER', 'ADMIN']), async (req, res) => {
  const { name, code, type, value, minOrder, isActive } = req.body;
  try {
    const result = await pool.query('UPDATE vouchers SET name=$1, code=$2, type=$3, value=$4, min_order=$5, is_active=$6 WHERE id=$7 RETURNING *', [name, code, type, value, minOrder || 0, isActive !== false, req.params.id]);
    res.json({ message: 'Updated successfully', data: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete(['/api/delete/vouchers/:id', '/api/delete/Vouchers/:id'], authenticateToken, authorizeRole(['admin', 'superadmin', 'OWNER', 'ADMIN']), async (req, res) => {
  try { await pool.query('DELETE FROM vouchers WHERE id=$1', [req.params.id]); res.json({ message: 'Deleted successfully' }); } catch (e) { res.status(500).json({ error: e.message }); }
});

// ✨ NEW: Endpoint untuk mengambil dan menyimpan denah meja
app.get('/api/tables/layout', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tables ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching layout:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/tables/layout', authenticateToken, authorizeRole(['admin', 'staff']), async (req, res) => {
  const updatedTables = req.body; // Menerima array objek meja dengan x dan y

  if (!Array.isArray(updatedTables)) {
    return res.status(400).json({ error: 'Data tidak valid.' });
  }

  try {
    // Bulk update koordinat (x,y) posisi meja menggunakan Promise.all
    const promises = updatedTables.map(t =>
      pool.query('UPDATE tables SET x = $1, y = $2 WHERE id = $3', [t.x, t.y, t.id])
    );
    await Promise.all(promises);

    logActivity('UPDATE-LAYOUT', 'system', 'Admin memperbarui denah meja.');
    res.json({ message: 'Layout meja berhasil disimpan.' });
  } catch (err) {
    console.error('Error updating layout:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ✨ NEW: Endpoints Pengaturan Toko (Settings)
app.get('/api/settings/store', authenticateToken, async (req, res) => {
  const result = await pool.query("SELECT * FROM store_settings");
  const settings = result.rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  res.json(settings);
});

app.post('/api/settings/store', authenticateToken, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const newSettings = req.body;
  for (const key in newSettings) {
    await pool.query('INSERT INTO store_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, newSettings[key]]);
  }

  logActivity('UPDATE-SETTINGS', 'System', 'Admin memperbarui konfigurasi toko.');
  res.json({ message: 'Pengaturan berhasil disimpan.', settings: newSettings });
});

// Endpoint Backup Database (Download data.json)
app.get('/api/system/backup', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const filePath = path.join(__dirname, 'data.json');
  res.download(filePath, `restoran_backup_${Date.now()}.json`);
});

// Endpoint Restore Database (Upload JSON body)
app.post('/api/system/restore', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const newData = req.body;

  // Validasi sederhana struktur data
  if (!newData.users || !Array.isArray(newData.users)) {
    return res.status(400).json({ error: 'Format backup tidak valid (Data Users tidak ditemukan).' });
  }

  writeData(newData);
  logActivity('RESTORE', 'system', 'Admin melakukan restore database.');
  res.json({ message: 'Database berhasil direstore.' });
});

// Endpoint Upload Gambar
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const hostUrl = req.get('host') === `localhost:${PORT}` ? `http://localhost:${PORT}` : `http://${req.get('host')}`;
  res.json({ imageUrl: `${hostUrl}/uploads/${req.file.filename}` });
});

// --- MIDDLEWARE VALIDASI ---
const validateServiceData = (req, res, next) => {
  const { name, price, cuisine, stock } = req.body;

  // 1. Validasi Wajib: Nama tidak boleh kosong
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nama item wajib diisi!' });
  }


  // 3. Validasi Stock (Opsional tapi harus angka jika ada)
  if (stock && isNaN(Number(stock))) {
    return res.status(400).json({ error: 'Stok harus berupa angka!' });
  }

  next(); // Lanjut ke controller jika validasi lolos
};

// --- BACK OFFICE ENDPOINTS (POST) ---
// Endpoint generik untuk menambah data
app.post('/api/add/:service', authenticateToken, validateServiceData, async (req, res) => {
  const { service } = req.params;
  const newData = req.body;
  const migratedServices = ['restoran'];

  if (migratedServices.includes(service.toLowerCase())) {
    try {
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT").catch(() => { });
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100)").catch(() => { });
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS weight INT DEFAULT 0").catch(() => { });
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price NUMERIC").catch(() => { });
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS variants TEXT DEFAULT '[]'").catch(() => { });

      const id = Date.now();
      const query = `
        INSERT INTO products (id, service_name, name, price, image, stock, cuisine, recipe, description, category, weight, discount_price, variants)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
      `;
      const values = [
        id, service.toLowerCase(), newData.name, newData.price || null, newData.image || null,
        newData.stock || 0, newData.cuisine || null,
        newData.recipe ? JSON.stringify(newData.recipe) : '[]',
        newData.description || null, newData.category || null, newData.weight || 0, newData.discount_price || null,
        newData.variants ? JSON.stringify(newData.variants) : '[]'
      ];
      const result = await pool.query(query, values);

      logActivity('CREATE', service, `Menambahkan data baru: ${newData.name}`);
      return res.status(201).json({ message: 'Success', data: result.rows[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  const dataStore = readData();

  if (!dataStore[service]) {
    return res.status(404).json({ error: 'Service not found' });
  }

  newData.id = Date.now(); // Generate ID unik sederhana
  newData.createdAt = new Date().toISOString(); // Tambahkan timestamp pembuatan
  dataStore[service].push(newData);
  writeData(dataStore); // Simpan ke file

  // Catat Log
  logActivity('CREATE', service, `Menambahkan data baru: ${newData.name}`);

  console.log(`Data added to ${service}:`, newData);
  // Return 201 Created status with the new data
  res.status(201).json({ message: 'Success', data: newData });
});

// Endpoint untuk menghapus data
app.delete('/api/delete/:service/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { service, id } = req.params;
  const migratedServices = ['restoran'];

  if (migratedServices.includes(service.toLowerCase())) {
    try {
      await pool.query('DELETE FROM products WHERE id = $1 AND LOWER(service_name) = $2', [id, service.toLowerCase()]);
      logActivity('DELETE', service, `Menghapus data ID: ${id}`);
      return res.json({ message: 'Deleted successfully', id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  const dataStore = readData();

  if (!dataStore[service]) {
    return res.status(404).json({ error: 'Service not found' });
  }

  // Filter data untuk membuang item dengan ID yang cocok
  // Menggunakan != karena req.params.id adalah string sedangkan item.id adalah number
  dataStore[service] = dataStore[service].filter(item => item.id != id);
  writeData(dataStore); // Simpan ke file

  // Catat Log
  logActivity('DELETE', service, `Menghapus data ID: ${id}`);

  console.log(`Data deleted from ${service}:`, id);
  res.json({ message: 'Deleted successfully', id });
});

// Endpoint untuk menghapus banyak data sekaligus (Multi-Delete)
app.delete('/api/delete-many/:service', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { service } = req.params;
  const { ids } = req.body; // Menerima array of IDs
  const migratedServices = ['restoran'];

  if (migratedServices.includes(service.toLowerCase())) {
    try {
      // Syntax array PostgreSQL untuk validasi in-list
      await pool.query('DELETE FROM products WHERE id = ANY($1::bigint[]) AND LOWER(service_name) = $2', [ids, service.toLowerCase()]);
      logActivity('DELETE-MANY', service, `Menghapus ${ids.length} item.`);
      return res.json({ message: `${ids.length} items deleted successfully` });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  const dataStore = readData();

  if (!dataStore[service]) {
    return res.status(404).json({ error: 'Service not found' });
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No IDs provided for deletion' });
  }

  // Filter data, buang semua item yang ID-nya ada di dalam array `ids`
  dataStore[service] = dataStore[service].filter(item => !ids.includes(item.id));
  writeData(dataStore);

  logActivity('DELETE-MANY', service, `Menghapus ${ids.length} item.`);
  res.json({ message: `${ids.length} items deleted successfully` });
});

// Endpoint Import Data (Bulk Insert dari CSV/JSON)
app.post('/api/import/:service', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { service } = req.params;
  const newItems = req.body; // Menerima Array of Objects
  const dataStore = readData();

  if (!dataStore[service]) {
    return res.status(404).json({ error: 'Service not found' });
  }

  if (!Array.isArray(newItems) || newItems.length === 0) {
    return res.status(400).json({ error: 'Data tidak valid. Harus berupa array item.' });
  }

  // Tambahkan ID dan Timestamp untuk setiap item baru
  const timestamp = new Date().toISOString();
  const itemsToAdd = newItems.map((item, index) => ({
    ...item,
    id: Date.now() + index + Math.floor(Math.random() * 1000), // ID unik
    createdAt: timestamp
  }));

  dataStore[service].push(...itemsToAdd);
  writeData(dataStore);

  logActivity('IMPORT', service, `Mengimport ${itemsToAdd.length} data baru.`);
  res.status(201).json({ message: `Berhasil mengimport ${itemsToAdd.length} data.`, count: itemsToAdd.length });
});

// Endpoint untuk mengupdate data (Edit)
app.put('/api/update/:service/:id', authenticateToken, authorizeRole(['admin']), validateServiceData, async (req, res) => {
  const { service, id } = req.params;
  const updatedData = req.body;
  const migratedServices = ['restoran'];

  if (migratedServices.includes(service.toLowerCase())) {
    try {
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT").catch(() => { });
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100)").catch(() => { });
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS weight INT DEFAULT 0").catch(() => { });
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price NUMERIC").catch(() => { });
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS variants TEXT DEFAULT '[]'").catch(() => { });

      const query = `
        UPDATE products 
        SET name = $1, price = $2, image = $3, stock = $4, cuisine = $5, recipe = $6, description = $7, category = $8, weight = $9, discount_price = $10, variants = $11, last_modified = CURRENT_TIMESTAMP
        WHERE id = $12 AND LOWER(service_name) = $13 RETURNING *
      `;
      const values = [
        updatedData.name, updatedData.price || null, updatedData.image || null, updatedData.stock || 0,
        updatedData.cuisine || null,
        updatedData.recipe ? JSON.stringify(updatedData.recipe) : '[]',
        updatedData.description || null, updatedData.category || null, updatedData.weight || 0, updatedData.discount_price || null,
        updatedData.variants ? JSON.stringify(updatedData.variants) : '[]',
        id, service.toLowerCase()
      ];
      const result = await pool.query(query, values);

      logActivity('UPDATE', service, `Mengupdate data: ${updatedData.name || 'Item'}`);
      return res.json({ message: 'Updated successfully', data: result.rows[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  const dataStore = readData();

  if (!dataStore[service]) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const index = dataStore[service].findIndex(item => item.id == id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  // Update data, pertahankan ID dan createdAt, tambahkan lastModified
  const originalItem = dataStore[service][index];
  dataStore[service][index] = {
    ...originalItem,
    ...updatedData,
    lastModified: new Date().toISOString()
  };
  writeData(dataStore); // Simpan ke file

  // Catat Log
  logActivity('UPDATE', service, `Mengupdate data: ${updatedData.name || 'Item'}`);

  console.log(`Data updated in ${service}:`, id);
  res.json({ message: 'Updated successfully', data: dataStore[service][index] });
});

// --- ORDER & TRANSACTION ENDPOINTS ---

// API PUBLIC DAN ORDER V1 TELAH DIMIGRASI KE V2
// Lihat bagian "FASE 6: POS & TRANSAKSI V2 (BOM AUTO-DEDUCT)"

// ✨ PENAMBAHAN FITUR 4: Integrasi Payment Gateway (Midtrans SNAP API)
app.post('/api/v2/payment/snap', authenticateToken, async (req, res) => {
  const { orderId, grossAmount, customerDetails } = req.body;
  
  try {
    // CATATAN: Untuk mengaktifkan versi Asli, install midtrans: "npm install midtrans-client"
    /*
    const midtransClient = require('midtrans-client');
    let snap = new midtransClient.Snap({
        isProduction: false, // Ubah ke true jika sudah live
        serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-xxx',
        clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-xxx'
    });

    let parameter = {
        "transaction_details": { "order_id": orderId || ('ORD-' + Date.now()), "gross_amount": grossAmount },
        "customer_details": { "first_name": customerDetails?.name || req.user.username }
    };
    const transaction = await snap.createTransaction(parameter);
    return res.json({ token: transaction.token, redirect_url: transaction.redirect_url });
    */
    
    // Mock Response sementara (Simulator) jika Midtrans belum diinstall
    res.json({ 
      token: `mock-snap-token-${Date.now()}`,
      redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-snap-token-${Date.now()}`
    });
  } catch (e) { res.status(500).json({ error: 'Gagal generate Payment Token' }); }
});

// ✨ FULL FEATURE: Webhook Payment Gateway Simulator Internal (Mode Bawaan)
app.post('/api/webhook/payment', async (req, res) => {
  // Menerima payload dari Payment Gateway Asli
  const { order_id, transaction_status } = req.body;

  try {
    // Cek apakah order masih status Awaiting Payment
    const orderCheck = await pool.query("SELECT status FROM orders WHERE id = $1", [order_id]);
    if (orderCheck.rows.length === 0) return res.status(404).send('Not Found');

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      // UANG MASUK BERHASIL
      await pool.query("UPDATE orders SET status = 'Pending' WHERE id = $1 AND status = 'Awaiting Payment'", [order_id]);
      logActivity('WEBHOOK', 'System', `Payment success untuk Order #${order_id}`);
      io.emit('newOrder', { orderId: order_id });
    } else if (transaction_status === 'cancel' || transaction_status === 'expire' || transaction_status === 'deny') {
      // UANG GAGAL / EXPIRED
      // Note: Dalam sistem nyata, Anda panggil rutin restock di sini.
      await pool.query("UPDATE orders SET status = 'Cancelled' WHERE id = $1 AND status = 'Awaiting Payment'", [order_id]);
      logActivity('WEBHOOK', 'System', `Payment failed/expired untuk Order #${order_id}`);
    }
    res.status(200).send('Webhook Received');
  } catch (e) {
    res.status(500).send('Server Error');
  }
});

// ✨ FULL FEATURE: Manajemen Buku Alamat Pelanggan (Address Book)
app.get('/api/users/addresses', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: String(req.user.id) } });
    if (user && user.addressBook) {
      res.json(JSON.parse(user.addressBook));
    } else { res.json([]); }
  } catch (e) { res.status(500).json({ error: 'DB error' }); }
});

app.post('/api/users/addresses', authenticateToken, async (req, res) => {
  try {
    const newAddress = { id: Date.now().toString(), ...req.body };
    const user = await prisma.user.findUnique({ where: { id: String(req.user.id) } });
    let ab = user && user.addressBook ? JSON.parse(user.addressBook) : [];
    ab.push(newAddress);
    await prisma.user.update({ where: { id: String(req.user.id) }, data: { addressBook: JSON.stringify(ab) } });
    res.json(newAddress);
  } catch (e) { res.status(500).json({ error: 'DB error' }); }
});

// Endpoint Get All Orders (Untuk Admin, Staff, & Kitchen Display KDS)
app.get(['/api/orders', '/api/v2/orders/history'], authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'admin', 'staff', 'CHEF', 'KASIR']), async (req, res) => {
  try {
    // ✨ AUTO-CREATE TABLE JIKA BELUM ADA UNTUK MENCEGAH ERROR 500
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT PRIMARY KEY,
        date TIMESTAMP,
        customer_id VARCHAR(100),
        customer_name VARCHAR(255),
        address TEXT,
        total NUMERIC,
        payment_method VARCHAR(50),
        voucher_code VARCHAR(50),
        status VARCHAR(50),
        items TEXT
      )
    `).catch(() => { });
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100)").catch(() => { });
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS processed_by VARCHAR(100)").catch(() => { });
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT").catch(() => { });
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_image TEXT").catch(() => { });

    // 1. Ambil Histori V1
    const result = await pool.query('SELECT * FROM orders ORDER BY date DESC LIMIT 100');
    const orders = result.rows.map(o => {
      let parsedItems = [];
      try { parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch (e) { }
      return {
        ...o,
        total: Number(o.total),
        customerId: o.customer_id,
        customerName: o.customer_name,
        paymentMethod: o.payment_method,
        voucherCode: o.voucher_code,
        trackingNumber: o.tracking_number,
        processedBy: o.processed_by,
        items: parsedItems
      };
    });

    // 2. ✨ FIX: Ambil Histori V2 (Prisma) agar muncul di KDS & Histori Kasir
    let v2Orders = [];
    try {
        const v2Raw = await prisma.order.findMany({
            include: { items: { include: { menu: true } }, kasir: true, chef: true, outlet: true },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        v2Orders = v2Raw.map(o => ({
            id: o.id,
            date: o.createdAt.toISOString(),
            customerName: o.receiptNumber, // Gunakan No. Resi sebagai pengenal
            address: o.outlet?.name || '-',
            total: o.total,
            paymentMethod: o.paymentMethod,
            status: o.status === 'COMPLETED' ? 'Completed' : (o.status === 'PENDING' ? 'Pending' : (o.status === 'COOKING' ? 'Cooking' : (o.status === 'SERVED' ? 'Ready' : 'Cancelled'))),
            items: o.items.map(i => ({ id: i.menuId, name: i.menu?.name || i.itemName, qty: i.qty, price: i.price })),
            processedBy: o.kasirId,
            seller_name: o.kasir?.username,
            trackingNumber: o.receiptNumber
        }));
    } catch(e) {}

    // 3. Gabung dan Sortir Berdasarkan Tanggal Terbaru
    const allOrders = [...orders, ...v2Orders].sort((a,b) => new Date(b.date) - new Date(a.date));
    res.json(allOrders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint Get Order History for the logged-in user (Untuk Consumer)
app.get('/api/orders/my-history', authenticateToken, async (req, res) => {
  try {
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100)").catch(() => { });
    const result = await pool.query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY date DESC', [String(req.user.id)]);
    const orders = result.rows.map(o => {
      let parsedItems = [];
      try { parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch (e) { }
      return {
        ...o,
        total: Number(o.total),
        customerId: o.customer_id,
        customerName: o.customer_name,
        paymentMethod: o.payment_method,
        voucherCode: o.voucher_code,
        trackingNumber: o.tracking_number,
        processedBy: o.processed_by,
        items: parsedItems
      };
    });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// Endpoint Update Status Order (Proses Pesanan)
app.put(['/api/orders/:id/status', '/api/v2/orders/:id/status'], authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'admin', 'staff', 'CHEF', 'KASIR']), async (req, res) => {
  const { id } = req.params;
  const { status, processedBy } = req.body;

  try {
    // ✨ FIX: Deteksi jika ID adalah UUID dari V2 (Prisma)
    if (id.length > 20 && id.includes('-')) {
        let v2Status = 'PENDING';
        if (status === 'Completed' || status === 'COMPLETED') v2Status = 'COMPLETED';
        else if (status === 'Cooking' || status === 'COOKING' || status === 'Diproses') v2Status = 'COOKING';
        else if (status === 'Ready' || status === 'SERVED' || status === 'Siap Disajikan') v2Status = 'SERVED';
        else if (status === 'Cancelled' || status === 'CANCELLED') v2Status = 'CANCELLED';

        const updatedOrder = await prisma.order.update({ where: { id }, data: { status: v2Status }, include: { items: true } });
        
        // ✨ FIX: Restore Stok BOM secara otomatis jika pesanan V2 dibatalkan (Void)
        if (v2Status === 'CANCELLED') {
            for (const item of updatedOrder.items) {
                if (!item.menuId) continue;
                const menu = await prisma.menu.findUnique({ where: { id: item.menuId }, include: { recipes: true } });
                if (menu && menu.recipes.length > 0) {
                    for (const recipe of menu.recipes) {
                        const qtyToRestore = recipe.qtyNeeded * item.qty;
                        await prisma.outletStock.updateMany({
                            where: { outletId: updatedOrder.outletId, materialId: recipe.materialId },
                            data: { qty: { increment: qtyToRestore } }
                        });
                        await prisma.stockMutation.create({
                            data: { outletId: updatedOrder.outletId, materialId: recipe.materialId, userId: req.user.id || updatedOrder.kasirId, qty: qtyToRestore, type: 'OPNAME_ADJ', note: 'Void Order: Restore Stok BOM', reference: updatedOrder.receiptNumber }
                        });
                    }
                }
            }
        }
        
        // Emit WebSocket agar Kitchen Display & POS pelanggan sinkron real-time
        io.emit('orderStatusUpdate', { orderId: id, status: v2Status });
        return res.json({ message: 'Status Pesanan V2 diperbarui', order: updatedOrder });
    }

    const orderCheck = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = orderCheck.rows[0];

    // ✨ SIMPAN ID KASIR YANG MEMPROSES PEMBAYARAN (PENTING UNTUK LAPORAN SHIFT)
    if (status === 'Completed' && processedBy) {
      await pool.query('UPDATE orders SET processed_by = $1 WHERE id = $2', [processedBy, id]);
    }

    // ✨ VOID/CANCEL LOGIC: Restore Stock otomatis jika pesanan dibatalkan
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      // Loop setiap item dalam pesanan untuk dikembalikan stoknya
      let itemsToVoid = [];
      try { itemsToVoid = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch (e) { }

      for (const item of itemsToVoid) {
        if (item.isCustom) continue; // Skip custom items
        await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.qty, item.id]);
        const productCheck = await pool.query('SELECT recipe FROM products WHERE id = $1', [item.id]);
        if (productCheck.rows.length > 0) {
          let recipeArray = [];
          try { recipeArray = typeof productCheck.rows[0].recipe === 'string' ? JSON.parse(productCheck.rows[0].recipe) : productCheck.rows[0].recipe; } catch (e) { }
          if (Array.isArray(recipeArray)) {
            for (const r of recipeArray) {
              await pool.query('UPDATE ingredients SET stock = stock + $1 WHERE id = $2', [(r.qty * item.qty), r.ingredientId]);
            }
          }
        }
      }
      logActivity('VOID-ORDER', 'orders', `Pesanan #${id} dibatalkan & stok dikembalikan.`);
    }

    // ✨ FIX: Jika Kasir mengupdate Open Bill dengan metode bayar baru (Tunai/QRIS), simpan ke database!
    if (req.body.paymentMethod) {
      await pool.query('UPDATE orders SET status = $1, payment_method = $2 WHERE id = $3', [status, req.body.paymentMethod, id]);
    } else {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    }

    const finalPaymentMethod = req.body.paymentMethod || order.payment_method;
    const statusMsg = status === 'Completed' ? `Pesanan #${id} telah LUNAS dibayar (${finalPaymentMethod}).` : `Status pesanan #${id} diubah menjadi ${status}`;
    await logActivity('UPDATE-ORDER', 'orders', statusMsg);

    // ✨ FITUR 1: Real-time update ke HP Pelanggan
    io.emit('orderStatusUpdate', { orderId: id, status: status });

    // ✨ FITUR 4: Kirim Push Notif Background ke HP Pelanggan dengan pesan khusus
    let notifTitle = `Status Pesanan: ${status}`;
    let notifBody = statusMsg;

    if (status === 'Ready' || status === 'Siap Disajikan') {
      notifTitle = 'Pesanan Selesai Dimasak! 🍳';
      notifBody = `Yayy! Pesanan #${id} Anda sudah siap. Silakan ambil atau tunggu pelayan kami mengantarkannya.`;
    } else if (status === 'Cooking' || status === 'Diproses') {
      notifTitle = 'Pesanan Sedang Dimasak 👨‍🍳';
      notifBody = `Koki kami sedang menyiapkan pesanan #${id} Anda. Harap tunggu sebentar ya!`;
    } else if (status === 'Completed') {
      notifTitle = 'Transaksi Selesai 🎉';
      notifBody = `Pesanan #${id} telah selesai. Terima kasih telah bersantap di tempat kami!`;
    }

    sendPushNotification(order.customer_id, notifTitle, notifBody);

    res.json({ message: 'Status pesanan diperbarui', order: { ...order, status, payment_method: finalPaymentMethod } });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint untuk menggabungkan atau memindahkan meja
app.post('/api/orders/merge', authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'admin', 'staff', 'KASIR']), async (req, res) => {
  const { sourceOrderIds, targetOrderId } = req.body;

  if (!sourceOrderIds || !Array.isArray(sourceOrderIds) || !targetOrderId) {
    return res.status(400).json({ error: 'ID pesanan sumber dan target dibutuhkan.' });
  }

  try {
    const target = await prisma.order.findUnique({ where: { id: String(targetOrderId) } });
    if (!target) return res.status(404).json({ error: 'Target tidak ditemukan.' });
    
    let totalToAdd = 0;
    for (const sid of sourceOrderIds) {
        const source = await prisma.order.findUnique({ where: { id: String(sid) }, include: { items: true } });
        if (source) {
            totalToAdd += source.total;
            for (const i of source.items) {
                await prisma.orderItem.create({ data: { orderId: target.id, menuId: i.menuId, itemName: i.itemName, qty: i.qty, price: i.price } });
            }
            await prisma.orderItem.deleteMany({ where: { orderId: source.id } });
            await prisma.order.delete({ where: { id: source.id } });
        }
    }
    
    await prisma.order.update({ where: { id: target.id }, data: { total: { increment: totalToAdd } } });

    logActivity('MERGE-ORDER', 'orders', `Pesanan ${sourceOrderIds.join(', ')} digabung ke pesanan #${targetOrderId}`);
    res.json({ message: 'Pesanan berhasil digabung!' });
  } catch (err) {
    console.error('Merge orders error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ==========================================
// ✨ FASE 3: MIGRASI V2 PENUH (REVIEWS, RESERVATIONS, TABLES, CUSTOMERS, VOUCHERS, EXPENSES, ATTENDANCE, ACTIVITY LOG)
// ==========================================

// --- ACTIVITY LOG V2 ---
app.get('/api/system/activity-log', authenticateToken, async (req, res) => {
  try { res.json(await prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 100 })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

// --- REVIEWS V2 ---
app.get('/api/reviews/:itemId', async (req, res) => {
  try { res.json(await prisma.review.findMany({ where: { itemId: req.params.itemId }, orderBy: { date: 'desc' } }).catch(() => [])); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const review = await prisma.review.create({ data: { itemId: String(req.body.itemId), userId: String(req.user.id), username: req.user.username, rating: Number(req.body.rating), comment: req.body.comment } }).catch(() => null);
    res.status(201).json(review || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/admin/reviews', authenticateToken, async (req, res) => {
  try { res.json(await prisma.review.findMany({ orderBy: { date: 'desc' } }).catch(() => [])); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TABLES & LAYOUT V2 ---
app.get(['/api/tables', '/api/v2/tables', '/api/tables/layout'], authenticateToken, async (req, res) => {
  try { res.json(await prisma.table.findMany({ orderBy: { name: 'asc' } })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/tables/layout', authenticateToken, async (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Data tidak valid.' });
  try {
    await Promise.all(req.body.map(t => prisma.table.update({ where: { id: String(t.id) }, data: { x: t.x, y: t.y } }).catch(()=>{})));
    logActivity('UPDATE-LAYOUT', 'system', 'Admin memperbarui denah meja.');
    res.json({ message: 'Layout meja berhasil disimpan.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CUSTOMERS / CRM V2 ---
app.get(['/api/customers', '/api/v2/customers', '/api/crm', '/api/CRM', '/api/Customers'], authenticateToken, async (req, res) => {
  try { res.json(await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post(['/api/customers', '/api/v2/customers'], authenticateToken, async (req, res) => {
  try { res.status(201).json(await prisma.customer.create({ data: { name: req.body.name, phone: req.body.phone, type: 'silver' } })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

// --- VOUCHERS V2 ---
app.get(['/api/vouchers', '/api/v2/vouchers', '/api/Vouchers'], authenticateToken, async (req, res) => {
  try { 
    const vouchers = await prisma.voucher.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(vouchers.map(v => ({ ...v, min_order: v.minOrder, is_active: v.isActive }))); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post(['/api/add/vouchers', '/api/add/Vouchers'], authenticateToken, async (req, res) => {
  try { 
    const v = await prisma.voucher.create({ data: { name: req.body.name, code: req.body.code, type: req.body.type, value: Number(req.body.value), minOrder: Number(req.body.minOrder || 0), isActive: req.body.isActive !== false } });
    res.status(201).json({ message: 'Success', data: { ...v, min_order: v.minOrder, is_active: v.isActive } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put(['/api/update/vouchers/:id', '/api/update/Vouchers/:id'], authenticateToken, async (req, res) => {
  try { 
    const v = await prisma.voucher.update({ where: { id: req.params.id }, data: { name: req.body.name, code: req.body.code, type: req.body.type, value: Number(req.body.value), minOrder: Number(req.body.minOrder || 0), isActive: req.body.isActive !== false } });
    res.json({ message: 'Success', data: { ...v, min_order: v.minOrder, is_active: v.isActive } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete(['/api/delete/vouchers/:id', '/api/delete/Vouchers/:id'], authenticateToken, async (req, res) => {
  try { await prisma.voucher.delete({ where: { id: req.params.id } }); res.json({ message: 'Deleted' }); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});

// --- EXPENSES (FINANCE) V2 ---
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try { res.json(await prisma.expense.findMany({ orderBy: { date: 'desc' } })); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/expenses', authenticateToken, async (req, res) => {
  try { 
    const expense = await prisma.expense.create({ data: { date: req.body.date ? new Date(req.body.date) : new Date(), category: req.body.category, amount: Number(req.body.amount), description: req.body.description, recordedBy: req.user.username, outletId: req.user.outletId || null } });
    logActivity('EXPENSE', 'Finance', `Pengeluaran: ${req.body.category} - Rp ${Number(req.body.amount)}`);
    res.status(201).json(expense);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ATTENDANCE V2 ---
app.get('/api/attendance/today', authenticateToken, async (req, res) => {
  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
  try {
    const record = await prisma.attendance.findFirst({ where: { userId: String(req.user.id), attendanceDate: { gte: startOfDay } } });
    res.json(record ? { ...record, username: req.user.username } : null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/attendance', authenticateToken, async (req, res) => {
  const actionRaw = String(req.body.action || '').toLowerCase().replace(/[^a-z]/g, '');
  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
  try {
    const record = await prisma.attendance.findFirst({ where: { userId: String(req.user.id), attendanceDate: { gte: startOfDay } } });
    if (actionRaw === 'in' || actionRaw === 'clockin') {
      if (record) return res.status(400).json({ error: 'Anda sudah absen masuk hari ini.' });
      const newRecord = await prisma.attendance.create({ data: { userId: String(req.user.id), attendanceDate: new Date(), clockIn: new Date(), outletId: req.user.outletId || null } });
      logActivity('CLOCK-IN', 'System', `${req.user.username} absen masuk.`);
      return res.json({ ...newRecord, username: req.user.username });
    } else {
      if (!record) return res.status(400).json({ error: 'Belum absen masuk.' });
      if (record.clockOut) return res.status(400).json({ error: 'Sudah absen keluar.' });
      const updated = await prisma.attendance.update({ where: { id: record.id }, data: { clockOut: new Date() } });
      logActivity('CLOCK-OUT', 'System', `${req.user.username} absen keluar.`);
      return res.json({ ...updated, username: req.user.username });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const r = String(req.user?.role || '').toUpperCase();
    const records = ['ADMIN', 'SUPERADMIN', 'OWNER'].includes(r)
      ? await prisma.attendance.findMany({ include: { user: { select: { username: true } } }, orderBy: { clockIn: 'desc' } })
      : await prisma.attendance.findMany({ where: { userId: String(req.user.id) }, include: { user: { select: { username: true } } }, orderBy: { clockIn: 'desc' } });
    res.json(records.map(r => ({ ...r, username: r.user?.username || 'Unknown', attendance_date: r.attendanceDate, clock_in: r.clockIn, clock_out: r.clockOut })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- RESERVATIONS V2 ---
app.get(['/api/reservations', '/api/v2/reservations', '/api/Reservations'], authenticateToken, async (req, res) => {
  try {
    await prisma.reservation.updateMany({ where: { status: 'Menunggu Pembayaran', paymentDeadline: { lt: new Date() } }, data: { status: 'Batal' } });
    await prisma.reservation.updateMany({ where: { status: 'Disetujui', reservationDate: { lt: new Date(new Date().setHours(0,0,0,0)) } }, data: { status: 'Tidak Hadir' } });
    res.json(await prisma.reservation.findMany({ orderBy: [{ reservationDate: 'desc' }, { reservationTime: 'desc' }] }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post(['/api/reservations', '/api/add/reservations', '/api/add/Reservations'], authenticateToken, async (req, res) => {
  try {
    const newRes = await prisma.reservation.create({ data: { customerName: req.body.customerName || req.body.customer_name, contact: req.body.contact, reservationDate: new Date(req.body.date || req.body.reservation_date), reservationTime: req.body.time || req.body.reservation_time, pax: parseInt(req.body.pax), tableId: req.body.tableId ? String(req.body.tableId) : null, note: req.body.note, status: 'Menunggu Pembayaran', paymentDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), outletId: req.user.outletId || null } });
    logActivity('RESERVATION', 'Restoran', `Reservasi baru: ${newRes.customerName}`);
    res.status(201).json({ message: 'Success', data: newRes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put(['/api/update/reservations/:id', '/api/update/Reservations/:id'], authenticateToken, async (req, res) => {
  try {
    const updated = await prisma.reservation.update({ where: { id: req.params.id }, data: { customerName: req.body.customer_name, contact: req.body.contact, reservationDate: new Date(req.body.reservation_date), reservationTime: req.body.reservation_time, pax: parseInt(req.body.pax), tableId: req.body.table_id ? String(req.body.table_id) : null, note: req.body.note, status: req.body.status || 'Pending' } });
    res.json({ message: 'Success', data: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete(['/api/delete/reservations/:id', '/api/delete/Reservations/:id'], authenticateToken, async (req, res) => {
  try { await prisma.reservation.delete({ where: { id: req.params.id } }); res.json({ message: 'Deleted' }); } 
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/reservations/:id/status', authenticateToken, async (req, res) => {
  try {
    const updated = await prisma.reservation.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    logActivity('UPDATE-RESERVATION', 'Restoran', `Status reservasi #${req.params.id} -> ${req.body.status}`);
    res.json({ message: 'Success', data: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Endpoint dinamis untuk semua layanan (GET) - DIPINDAH KE BAWAH AGAR TIDAK MEMBAJAK
app.get('/api/:service', async (req, res) => {
  const { service } = req.params;
  const migratedServices = ['restoran'];

  // ✨ HYBRID: Jika service sudah dimigrasi, ambil dari PostgreSQL
  if (migratedServices.includes(service.toLowerCase())) {
    try {
      const result = await pool.query('SELECT * FROM products WHERE LOWER(service_name) = $1 ORDER BY last_modified DESC', [service.toLowerCase()]);
      let results = result.rows;

      const queryKeys = Object.keys(req.query);
      if (queryKeys.length > 0) {
        results = results.filter(item => {
          return queryKeys.every(key => {
            if (item[key] === undefined || item[key] === null) return true;
            return String(item[key]).toLowerCase().includes(req.query[key].toLowerCase());
          });
        });
      }
      return res.json(results);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Fallback ke data.json untuk endpoints yang belum dimigrasi
  const data = readData();
  if (data[service]) {
    let results = data[service];

    const queryKeys = Object.keys(req.query);
    if (queryKeys.length > 0) {
      results = results.filter(item => {
        return queryKeys.every(key => {
          if (item[key] === undefined) return true;
          return String(item[key]).toLowerCase().includes(req.query[key].toLowerCase());
        });
      });
    }

    res.json(results);
  } else {
    res.status(404).json({ error: 'Service not found' });
  }
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  // Menangani error dari Multer (misal: file terlalu besar)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  // Menangani error umum lainnya
  res.status(400).json({ error: err.message || 'Something went wrong!' });
});

// ✨ FITUR: Dapatkan IP Address Lokal otomatis untuk kemudahan akses via HP
const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
};

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`\n✅ Backend Server Berhasil Berjalan!`);
  console.log(`🏠 Akses Lokal  : http://localhost:${PORT}`);
  console.log(`📱 Akses Network: http://${localIp}:${PORT}`);
  console.log(`\n👉 (Gunakan link Network di atas pada browser HP/Tablet Anda yang terhubung di WiFi yang sama)`);
});
