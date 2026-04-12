import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const OutletManagement = () => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', city: '', openTime: '08:00', closeTime: '22:00', isActive: true });
  const [editingId, setEditingId] = useState(null);

  const fetchOutlets = async () => {
    setLoading(true);
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/v2/outlets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setOutlets(await res.json());
    } catch (err) { toast.error("Gagal memuat daftar outlet"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOutlets(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    const url = editingId ? `${backendUrl}/api/v2/outlets/${editingId}` : `${backendUrl}/api/v2/outlets`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(`Cabang berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}!`);
        setShowModal(false);
        fetchOutlets();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menyimpan cabang');
      }
    } catch (err) { toast.error('Koneksi error'); }
  };

  const openModal = (outlet = null) => {
    if (outlet) {
      setEditingId(outlet.id);
      setFormData({ name: outlet.name, address: outlet.address, city: outlet.city, openTime: outlet.openTime, closeTime: outlet.closeTime, isActive: outlet.isActive });
    } else {
      setEditingId(null);
      setFormData({ name: '', address: '', city: '', openTime: '08:00', closeTime: '22:00', isActive: true });
    }
    setShowModal(true);
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>🏪 Manajemen Cabang (Outlet)</h2>
          <p style={{ color: '#64748b' }}>Kelola daftar cabang, alamat, dan jam operasional restoran Anda.</p>
        </div>
        <button onClick={() => openModal()} className="profile-save-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>+</span> Tambah Cabang
        </button>
      </div>

      {loading ? <p>Memuat data outlet...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {outlets.map(outlet => (
            <div key={outlet.id} style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>{outlet.name}</h3>
                <span style={{ background: outlet.isActive ? '#dcfce7' : '#fee2e2', color: outlet.isActive ? '#16a34a' : '#dc2626', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {outlet.isActive ? 'Buka' : 'Tutup'}
                </span>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '8px' }}>📍 {outlet.address}, {outlet.city}</p>
              <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '20px' }}>🕒 {outlet.openTime} - {outlet.closeTime}</p>
              <div style={{ fontSize: '0.85rem', color: '#64748b', borderTop: '1px solid var(--border-color)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>👥 {outlet._count?.users || 0} Pegawai / Kasir</span>
                <button onClick={() => openModal(outlet)} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#eff6ff', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🏪</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>{editingId ? 'Edit Cabang' : 'Tambah Cabang Baru'}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Kelola data alamat dan jam operasional</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Nama Cabang <span style={{color:'#ef4444'}}>*</span></label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Cth: Cabang Sudirman" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Jam Buka <span style={{color:'#ef4444'}}>*</span></label><input required type="time" value={formData.openTime} onChange={e => setFormData({ ...formData, openTime: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Jam Tutup <span style={{color:'#ef4444'}}>*</span></label><input required type="time" value={formData.closeTime} onChange={e => setFormData({ ...formData, closeTime: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Kota <span style={{color:'#ef4444'}}>*</span></label><input required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Cth: Jakarta Selatan" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Alamat Lengkap <span style={{color:'#ef4444'}}>*</span></label><textarea required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }}></textarea></div>
              {editingId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} style={{ width: '20px', height: '20px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                  <label htmlFor="isActive" style={{ fontWeight: '700', color: '#334155', cursor: 'pointer' }}>Cabang Beroperasi (Aktif)</label>
                </div>
              )}
              <button type="submit" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}><span>💾</span> Simpan Cabang</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default OutletManagement;