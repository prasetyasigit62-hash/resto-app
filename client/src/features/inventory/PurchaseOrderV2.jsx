import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const PurchaseOrderV2 = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ outletId: '', supplierId: '', items: [] });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', action: null, type: 'primary' });

  // ✨ Helper Format Rupiah Otomatis
  const formatRupiah = (value) => {
    if (!value) return '';
    return String(value).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const [resPO, resOut, resSup, resMat] = await Promise.all([
        fetch(`${backendUrl}/api/v2/purchase-orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/v2/outlets`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/v2/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/v2/materials`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resPO.ok) setOrders(await resPO.json());
      if (resOut.ok) setOutlets(await resOut.json());
      if (resSup.ok) setSuppliers(await resSup.json());
      if (resMat.ok) setMaterials(await resMat.json());
    } catch (err) { toast.error("Gagal memuat data PO."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const addItemRow = () => setFormData({ ...formData, items: [...formData.items, { materialId: '', qty: '', price: '' }] });
  const removeItemRow = (index) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  const updateItemRow = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === 'price') {
        newItems[index][field] = formatRupiah(value);
    } else {
        newItems[index][field] = value;
    }
    // Auto-fill harga jika bahan dipilih
    if (field === 'materialId') {
        const mat = materials.find(m => m.id === value);
        if (mat) newItems[index].price = formatRupiah(mat.lastPrice || 0);
    }
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = formData.items
      .filter(i => i.materialId && Number(i.qty) > 0)
      .map(i => ({
        ...i,
        price: Number(String(i.price).replace(/\./g, '')) // ✨ Hilangkan titik sebelum kirim ke backend
      }));
    if (validItems.length === 0) return toast.warn("Masukkan minimal 1 bahan baku yang valid!");

    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/v2/purchase-orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, items: validItems })
      });
      if (res.ok) {
        toast.success("Draft Purchase Order berhasil dibuat!");
        setShowModal(false);
        fetchData();
      } else toast.error("Gagal membuat PO.");
    } catch (err) { toast.error("Error koneksi."); }
  };

  const updateStatus = async (id, status) => {
    let title = '';
    let message = '';
    let type = 'primary';

    if (status === 'APPROVED') {
        title = 'Setujui Dokumen PO?';
        message = 'Apakah Anda yakin ingin menyetujui Purchase Order ini?';
        type = 'primary';
    } else if (status === 'RECEIVED') {
        title = 'Terima Barang & Restock?';
        message = 'Sistem akan otomatis menambahkan jumlah barang pesanan ini ke gudang. Lanjutkan?';
        type = 'success';
    } else if (status === 'REJECTED') {
        title = 'Tolak PO?';
        message = 'PO yang ditolak tidak bisa diproses kembali. Yakin ingin menolak?';
        type = 'danger';
    }

    setConfirmModal({
        show: true,
        title,
        message,
        type,
        action: async () => {
            const token = localStorage.getItem('resto_token');
            const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
            try {
              const res = await fetch(`${backendUrl}/api/v2/purchase-orders/${id}/status`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
              });
              if (res.ok) { toast.success(`Status PO berhasil menjadi ${status}`); fetchData(); } 
              else toast.error("Gagal update status PO.");
            } catch (err) { toast.error("Error koneksi."); }
        }
    });
  };

  const getStatusBadge = (status) => {
    const types = {
      DRAFT: { label: 'Draft', bg: '#f1f5f9', color: '#64748b' },
      PENDING_APPROVAL: { label: 'Menunggu Persetujuan', bg: '#fef3c7', color: '#d97706' },
      APPROVED: { label: 'Disetujui (Menunggu Barang)', bg: '#e0f2fe', color: '#0284c7' },
      RECEIVED: { label: 'Barang Diterima & Stok Naik', bg: '#dcfce7', color: '#16a34a' },
      REJECTED: { label: 'Ditolak', bg: '#fee2e2', color: '#dc2626' },
    };
    const s = types[status] || types.DRAFT;
    return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', background: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>🛒 Purchase Order (PO)</h2>
          <p style={{ color: '#64748b' }}>Buat pesanan pembelian bahan baku ke Supplier untuk cabang.</p>
        </div>
        <button onClick={() => { setFormData({ outletId: user.outletId || '', supplierId: '', items: [] }); setShowModal(true); }} className="profile-save-btn" style={{ width: 'auto' }}>
          + Buat PO Baru
        </button>
      </div>

      {loading ? <p>Memuat data...</p> : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {orders.length === 0 ? <p style={{textAlign:'center', color:'#94a3b8', padding:'40px'}}>Belum ada riwayat Purchase Order.</p> : orders.map(po => (
            <div key={po.id} style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                   <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '8px' }}>
                       <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{po.poNumber}</h3>
                       {getStatusBadge(po.status)}
                   </div>
                   <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '15px' }}>
                       <span>🏪 {po.outlet?.name}</span>
                       <span>🚚 Supp: {po.supplier?.name}</span>
                       <span>👤 Oleh: {po.creator?.username}</span>
                   </div>
                   <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#475569' }}>
                       <strong>Item:</strong> {po.items.map(i => `${i.material?.name} (${i.qty} ${i.material?.unit})`).join(', ')}
                   </div>
               </div>
               <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#3b82f6', marginBottom: '10px' }}>Rp {po.totalAmount.toLocaleString('id-ID')}</div>
                   <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                       {po.status === 'PENDING_APPROVAL' && ['OWNER', 'ADMIN'].includes(user?.role) && (
                           <><button onClick={() => updateStatus(po.id, 'APPROVED')} style={{ background: '#0284c7', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✅ Approve</button>
                           <button onClick={() => updateStatus(po.id, 'REJECTED')} style={{ background: '#dc2626', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>❌ Tolak</button></>
                       )}
                       {po.status === 'APPROVED' && (
                           <button onClick={() => updateStatus(po.id, 'RECEIVED')} style={{ background: '#16a34a', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>📦 Terima Barang & Restock</button>
                       )}
                   </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#eff6ff', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🛒</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>Buat Purchase Order</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Pesan bahan mentah ke supplier</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Tujuan Cabang <span style={{color:'#ef4444'}}>*</span></label><select required value={formData.outletId} onChange={e => setFormData({...formData, outletId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}><option value="">-- Pilih Cabang --</option>{outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Pilih Supplier <span style={{color:'#ef4444'}}>*</span></label><select required value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}><option value="">-- Pilih Supplier --</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              </div>
              
              <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '800', color: '#0f172a', fontSize: '1.1rem' }}>📦 Daftar Barang Belanjaan</label>
                  </div>
                  <button type="button" onClick={addItemRow} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}><span>+</span> Tambah Baris</button>
                </div>
                {formData.items.length === 0 ? <div style={{ textAlign: 'center', padding: '30px 20px', background: '#ffffff', borderRadius: '12px', border: '1.5px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.95rem' }}>Belum ada barang belanjaan.</div> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {formData.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#ffffff', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ flex: 2 }}><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Bahan Baku</label><select required value={item.materialId} onChange={e => updateItemRow(idx, 'materialId', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'white' }}><option value="">-- Pilih --</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}</select></div>
                        <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Jumlah</label><input required type="number" step="0.01" value={item.qty} onChange={e => updateItemRow(idx, 'qty', e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                        <div style={{ flex: 1.5 }}><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Harga Satuan (Rp)</label><input required type="text" value={item.price} onChange={e => updateItemRow(idx, 'price', e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}><button type="button" onClick={() => removeItemRow(idx)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', marginTop: '22px' }}>&times;</button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)', color: 'white', border: 'none', cursor: 'pointer' }}><span>📤</span> Buat & Ajukan PO</button>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL KONFIRMASI KUSTOM RESPONSIVE */}
      {confirmModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ fontSize: '3.5rem', marginBottom: '15px', lineHeight: 1 }}>
              {confirmModal.type === 'danger' ? '⚠️' : confirmModal.type === 'success' ? '📦' : '❓'}
            </div>
            
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.4rem', fontWeight: '800' }}>
              {confirmModal.title}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.6' }}>
              {confirmModal.message}
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, show: false })} 
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                Batal
              </button>
              <button 
                onClick={() => { confirmModal.action(); setConfirmModal({ ...confirmModal, show: false }); }} 
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: confirmModal.type === 'danger' ? '#ef4444' : confirmModal.type === 'success' ? '#10b981' : '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderV2;