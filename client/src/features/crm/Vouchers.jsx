import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
      // Menggunakan endpoint generik /api/add/:service
      const res = await fetch(`${backendUrl}/api/add/vouchers`, {
        method: 'POST',
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
        toast.success('Voucher berhasil dibuat!');
        setShowModal(false);
        setFormData({ name: '', code: '', type: 'percent', value: '', minOrder: 0, quota: 100, expiryDate: '', isActive: true });
        fetchVouchers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menyimpan voucher.');
      }
    } catch (err) {
      toast.error('Error koneksi.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus voucher ini?')) return;
    
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/delete/vouchers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Voucher dihapus.');
        setVouchers(vouchers.filter(v => v.id !== id));
      }
    } catch (err) {
      toast.error('Gagal menghapus.');
    }
  };

  const formatCurrency = (val) => Number(val).toLocaleString('id-ID');

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>🎟️ Voucher & Promo</h2>
          <p style={{ color: '#64748b' }}>Kelola kode diskon untuk pelanggan.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="profile-save-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>+</span> Buat Voucher
        </button>
      </div>

      {loading ? <p>Memuat data...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {vouchers.map(v => (
            <div key={v.id} style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '15px 20px', color: 'white' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{v.code}</h3>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px' }}>{v.name}</div>
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
                
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleDelete(v.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}>
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
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>Buat Voucher Baru</h3>
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
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Nilai Diskon <span style={{color:'#ef4444'}}>*</span></label><input required type="number" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} placeholder="Cth: 10" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Minimal Order (Rp)</label><input type="number" value={formData.minOrder} onChange={e => setFormData({ ...formData, minOrder: e.target.value })} placeholder="0" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Batas Kuota Pemakaian <span style={{color:'#ef4444'}}>*</span></label><input required type="number" value={formData.quota} onChange={e => setFormData({ ...formData, quota: e.target.value })} placeholder="Cth: 100" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Masa Berlaku <span style={{fontWeight:'normal', color:'#94a3b8'}}>(Opsional)</span></label><input type="date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)', color: 'white', border: 'none', cursor: 'pointer' }}><span>💾</span> Simpan Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vouchers;