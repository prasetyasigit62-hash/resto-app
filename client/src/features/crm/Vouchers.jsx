import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percent', // 'percent' or 'nominal'
    value: '',
    minOrder: 0,
    quota: 100, // Default kuota
    expiryDate: '',
    isActive: true
  });

  // ✨ STATE MODAL KONFIRMASI HAPUS
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  const fetchVouchers = async () => {
    setLoading(true);
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/vouchers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setVouchers(await res.json());
    } catch (err) {
      toast.error('Gagal memuat data voucher.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.value) {
      toast.warn('Mohon lengkapi semua data wajib.');
      return;
    }

    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const url = editingId 
        ? `${backendUrl}/api/vouchers/${editingId}`
        : `${backendUrl}/api/vouchers`;
        
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          value: Number(formData.value),
          minOrder: Number(formData.minOrder),
          quota: Number(formData.quota),
          expiryDate: formData.expiryDate || null
        })
      });

      if (res.ok) {
        toast.success(`Voucher berhasil ${editingId ? 'diperbarui' : 'dibuat'}!`);
        setShowModal(false);
        setFormData({ name: '', code: '', type: 'percent', value: '', minOrder: 0, quota: 100, expiryDate: '', isActive: true });
        setEditingId(null);
        fetchVouchers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menyimpan voucher.');
      }
    } catch (err) {
      toast.error('Error koneksi.');
    }
  };

  const handleEditClick = (voucher) => {
    setFormData({
      name: voucher.name || '',
      code: voucher.code || '',
      type: voucher.type || 'percent',
      value: voucher.value || '',
      minOrder: voucher.minOrder || voucher.min_order || 0,
      quota: voucher.quota !== undefined ? voucher.quota : 100,
      expiryDate: voucher.expiryDate ? new Date(voucher.expiryDate).toISOString().slice(0,10) : (voucher.expiry_date ? new Date(voucher.expiry_date).toISOString().slice(0,10) : ''),
      isActive: voucher.isActive !== undefined ? voucher.isActive : (voucher.is_active !== undefined ? voucher.is_active : true)
    });
    setEditingId(voucher.id);
    setShowModal(true);
  };

  const handleDeleteClick = (voucher) => {
    setVoucherToDelete(voucher);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!voucherToDelete) return;
    const id = voucherToDelete.id;
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/vouchers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Voucher dihapus.');
        setVouchers(vouchers.filter(v => v.id !== id));
      }
    } catch (err) {
      toast.error('Gagal menghapus.');
    } finally {
      setShowDeleteModal(false);
      setVoucherToDelete(null);
    }
  };

  const formatCurrency = (val) => Number(val).toLocaleString('id-ID');
  const toRpDisplay = (val) => val ? Number(String(val).replace(/\./g, '')).toLocaleString('id-ID') : '';
  const fromRpInput = (val) => Number(String(val).replace(/\./g, '')) || 0;

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>🎟️ Voucher & Promo</h2>
          <p style={{ color: '#64748b' }}>Kelola kode diskon untuk pelanggan.</p>
        </div>
        <button onClick={() => { 
            setFormData({ name: '', code: '', type: 'percent', value: '', minOrder: 0, quota: 100, expiryDate: '', isActive: true });
            setEditingId(null);
            setShowModal(true);
        }} className="profile-save-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>+</span> Buat Voucher
        </button>
      </div>

      {loading ? <p>Memuat data...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {vouchers.map(v => (
            <div key={v.id} style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ background: (v.isActive === false || v.is_active === false) ? 'linear-gradient(135deg, #94a3b8, #64748b)' : 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '15px 20px', color: 'white', position: 'relative' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{v.code}</h3>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px' }}>{v.name}</div>
                {(v.isActive === false || v.is_active === false) && <div style={{ position: 'absolute', top: 15, right: 15, background: '#ef4444', padding: '2px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>NONAKTIF</div>}
              </div>
              
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Nilai Diskon</span>
                  <strong style={{ color: '#d97706', fontSize: '1.1rem' }}>
                    {v.type === 'percent' ? `${v.value}%` : `Rp ${formatCurrency(v.value)}`}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Min. Order</span>
                  <span style={{ fontWeight: '500' }}>Rp {formatCurrency(v.minOrder)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Sisa Kuota</span>
                  <span style={{ fontWeight: 'bold', color: v.quota > 0 ? '#10b981' : '#ef4444' }}>{v.quota} Pcs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Berlaku s/d</span>
                  <span style={{ fontSize: '0.85rem' }}>{v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('id-ID') : 'Selamanya'}</span>
                </div>
                
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button onClick={() => handleEditClick(v)} style={{ background: '#fef9c3', color: '#ca8a04', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteClick(v)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}>
                    Hapus
                  </button>
                </div>
              </div>
              
              {/* Decorative Circle for "Ticket" look */}
              <div style={{ position: 'absolute', top: '55px', left: '-10px', width: '20px', height: '20px', background: 'var(--bg-color)', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', top: '55px', right: '-10px', width: '20px', height: '20px', background: 'var(--bg-color)', borderRadius: '50%' }}></div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#fef3c7', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎟️</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>{editingId ? 'Edit Voucher' : 'Buat Voucher Baru'}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Berikan promo diskon untuk pelanggan</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Nama Promo <span style={{color:'#ef4444'}}>*</span></label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Cth: Promo Kemerdekaan" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Kode Voucher <span style={{color:'#ef4444'}}>*</span></label><input required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g,'') })} placeholder="Cth: MERDEKA45" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Tipe Diskon</label><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}><option value="percent">Persen (%)</option><option value="nominal">Nominal (Rp)</option></select></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Nilai Diskon <span style={{color:'#ef4444'}}>*</span></label><input required type={formData.type === 'percent' ? 'number' : 'text'} inputMode="numeric" value={formData.type === 'percent' ? formData.value : toRpDisplay(formData.value)} onChange={e => setFormData({ ...formData, value: formData.type === 'percent' ? e.target.value : fromRpInput(e.target.value) })} placeholder={formData.type === 'percent' ? 'Cth: 10' : 'Cth: 50.000'} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Minimal Order (Rp)</label><input type="text" inputMode="numeric" value={toRpDisplay(formData.minOrder)} onChange={e => setFormData({ ...formData, minOrder: fromRpInput(e.target.value) })} placeholder="0" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Batas Kuota Pemakaian <span style={{color:'#ef4444'}}>*</span></label><input required type="number" value={formData.quota} onChange={e => setFormData({ ...formData, quota: e.target.value })} placeholder="Cth: 100" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Masa Berlaku <span style={{fontWeight:'normal', color:'#94a3b8'}}>(Opsional)</span></label><input type="date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Status Voucher</label><select value={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}><option value="true">Aktif</option><option value="false">Nonaktif</option></select></div>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)', color: 'white', border: 'none', cursor: 'pointer' }}><span>💾</span> {editingId ? 'Simpan Perubahan' : 'Simpan Voucher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL KONFIRMASI HAPUS VOUCHER (SMOOTH & RESPONSIVE) */}
      {showDeleteModal && voucherToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%', maxWidth: '400px',
            borderRadius: '24px',
            padding: '30px 25px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            animation: 'slideUpScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <div style={{
              width: '70px', height: '70px', 
              background: '#fef2f2', border: '6px solid #fee2e2',
              color: '#ef4444', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 20px auto'
            }}>
              🗑️
            </div>
      
            <h2 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.4rem', fontWeight: '800' }}>
              Hapus Promo Ini?
            </h2>
            <p style={{ margin: '0 0 25px 0', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Anda yakin ingin menghapus voucher <strong style={{color: '#0f172a'}}>{voucherToDelete.code}</strong>? Tindakan ini tidak dapat dibatalkan dan pelanggan tidak akan bisa menggunakannya lagi.
            </p>
      
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => { setShowDeleteModal(false); setVoucherToDelete(null); }}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'none'}
              >
                Ya, Hapus!
              </button>
            </div>
          </div>
          <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideUpScale { from { opacity: 0; transform: translateY(30px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
        </div>
      )}
    </div>
  );
};

export default Vouchers;