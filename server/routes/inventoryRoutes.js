const express = require('express');
const pool = require('../db');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// ✨ INVENTORY V2 & MENU BOM (PRISMA)
// ==========================================
router.get('/v2/suppliers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, contact_person as "contactPerson" FROM suppliers ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/v2/materials', authenticateToken, async (req, res) => {
  try { const materials = await prisma.material.findMany({ include: { stocks: true } }); res.json(materials); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/v2/materials', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  const { name, unit, lastPrice, minStock } = req.body;
  try { const material = await prisma.material.create({ data: { name, unit, lastPrice, minStock } }); res.status(201).json(material); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/v2/menus', authenticateToken, async (req, res) => {
  try { const menus = await prisma.menu.findMany({ include: { recipes: { include: { material: true } } } }); res.json(menus); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/v2/menus', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  const { name, price, image, recipes } = req.body;
  try {
    const menu = await prisma.menu.create({
      data: { name, price, image, recipes: { create: recipes.map(r => ({ materialId: r.materialId, qtyNeeded: r.qtyNeeded })) } }
    });
    res.status(201).json(menu);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// ✨ STOK, MUTASI & PURCHASE ORDER (V2)
// ==========================================
router.get('/v2/stocks', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role !== 'OWNER' && req.user.role !== 'SUPERADMIN' && req.user.outletId) whereClause.outletId = req.user.outletId;
    const stocks = await prisma.outletStock.findMany({ where: whereClause, include: { material: true, outlet: true } });
    res.json(stocks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/v2/mutations', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role !== 'OWNER' && req.user.role !== 'SUPERADMIN' && req.user.outletId) whereClause.outletId = req.user.outletId;
    const mutations = await prisma.stockMutation.findMany({ where: whereClause, include: { material: true, outlet: true, user: { select: { username: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(mutations);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/v2/mutations/adjust', authenticateToken, authorizeRole(['OWNER', 'ADMIN', 'CHEF']), async (req, res) => {
  const { outletId, materialId, realQty, note } = req.body;
  try {
    const currentStock = await prisma.outletStock.findUnique({ where: { outletId_materialId: { outletId, materialId } } });
    const currentQty = currentStock ? currentStock.qty : 0;
    const diff = Number(realQty) - currentQty;
    if (diff === 0) return res.status(400).json({ error: 'Tidak ada selisih stok dengan sistem.' });

    await prisma.outletStock.upsert({
      where: { outletId_materialId: { outletId, materialId } },
      update: { qty: Number(realQty) },
      create: { outletId, materialId, qty: Number(realQty) }
    });

    const mutation = await prisma.stockMutation.create({ data: { outletId, materialId, userId: req.user.id, qty: diff, type: 'OPNAME_ADJ', note: note || 'Stock Opname' } });
    res.json({ message: 'Stok berhasil disesuaikan.', mutation });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/v2/purchase-orders', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role !== 'OWNER' && req.user.role !== 'SUPERADMIN' && req.user.outletId) whereClause.outletId = req.user.outletId;
    const pos = await prisma.purchaseOrder.findMany({ where: whereClause, include: { outlet: true, supplier: true, creator: { select: { username: true } }, approver: { select: { username: true } }, items: { include: { material: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(pos);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/v2/purchase-orders', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  const { outletId, supplierId, items } = req.body;
  try {
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;
    const poItemsData = items.map(i => { totalAmount += (Number(i.price) * Number(i.qty)); return { materialId: i.materialId, qty: Number(i.qty), price: Number(i.price) }; });
    const po = await prisma.purchaseOrder.create({ data: { poNumber, outletId, supplierId, creatorId: req.user.id, totalAmount, status: 'PENDING_APPROVAL', items: { create: poItemsData } }, include: { items: true } });
    res.status(201).json(po);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/v2/purchase-orders/:id/status', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req, res) => {
  const { status } = req.body; 
  try {
    const po = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!po) return res.status(404).json({ error: 'PO tidak ditemukan' });
    
    let updateData = { status }; 
    if (status === 'APPROVED' || status === 'REJECTED') updateData.approverId = req.user.id;

    // ✨ POINT 7: Gunakan Transaction agar aman (All-or-Nothing)
    const updatedPO = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({ where: { id: req.params.id }, data: updateData });

      // ✨ JIKA STATUS RECEIVED: Otomatis tambah stok & catat mutasi
      if (status === 'RECEIVED' && po.status !== 'RECEIVED') {
        for (const item of po.items) {
          const currentStock = await tx.outletStock.findUnique({
            where: { outletId_materialId: { outletId: po.outletId, materialId: item.materialId } }
          });
          const newQty = (currentStock ? currentStock.qty : 0) + item.qty;

          // 1. Tambah Stok Fisik
          await tx.outletStock.upsert({
            where: { outletId_materialId: { outletId: po.outletId, materialId: item.materialId } },
            update: { qty: newQty },
            create: { outletId: po.outletId, materialId: item.materialId, qty: item.qty }
          });

          // 2. Catat Mutasi Pembelian
          await tx.stockMutation.create({
            data: { outletId: po.outletId, materialId: item.materialId, userId: req.user.id, qty: item.qty, type: 'IN_PO', reference: po.poNumber, note: 'Penerimaan Barang PO' }
          });
        }
      }
      return updated;
    });

    res.json(updatedPO);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;