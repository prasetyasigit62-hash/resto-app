import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Suppliers = ({ setConfirmModal, user }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', contactPerson: '' });

  const fetchSuppliers = async () => {
    setLoading(true);
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/v2/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSuppliers(await res.json());
    } catch (err) {
      toast.error('Gagal memuat data supplier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openModal = (item = null) => {
    setEditingItem(item);
    // ✨ FIX: Ambil data 'contact' dari V2 jika 'phone' tidak ada
    setFormData(item ? { ...item, phone: item.contact || item.phone || '' } : { name: '', phone: '', address: '', contactPerson: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.warn('Nama Supplier wajib diisi.');

    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    const url = editingItem
        ? `${backendUrl}/api/v2/suppliers/${editingItem.id}`
        : `${backendUrl}/api/v2/suppliers`;

    // ✨ FIX: Bersihkan payload agar sisa data lama tidak menimpa data baru
    const payload = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      contactPerson: formData.contactPerson
    };

    try {
      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingItem ? 'Supplier diperbarui!' : 'Supplier ditambahkan!');
        setShowModal(false);
        fetchSuppliers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menyimpan.');
      }
    } catch (err) {
      toast.error('Error koneksi.');
    }
  };

  const handleDelete = (item) => {
    if (setConfirmModal) {
      setConfirmModal({
        show: true,
        title: 'Hapus Supplier',
        message: `Apakah Anda yakin ingin menghapus supplier "${item.name}"? Tindakan ini tidak dapat dibatalkan.`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        onConfirm: async () => {
          const token = localStorage.getItem('resto_token');
          const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
          try {
            const res = await fetch(`${backendUrl}/api/v2/suppliers/${item.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              toast.success('Supplier berhasil dihapus.');
              fetchSuppliers();
            } else {
              const errData = await res.json().catch(() => ({}));
              toast.error(errData.error || 'Gagal menghapus supplier.');
            }
          } catch (err) { toast.error('Gagal menghapus.'); }
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      });
    }
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>🚚 Manajemen Supplier</h2>
          <p style={{ color: '#64748b' }}>Database kontak pemasok bahan baku.</p>
        </div>
        {['OWNER', 'ADMIN', 'SUPERADMIN'].includes(user?.role) && (
          <button onClick={() => openModal()} className="profile-save-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>+</span> Tambah Supplier
          </button>
        )}
      </div>

      {loading ? <p>Memuat...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {suppliers.length === 0 && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
              Belum ada data supplier. Tambahkan supplier pertama Anda.
            </p>
          )}
          {suppliers.map(s => (
            <div key={s.id} style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{s.name}</h3>
                <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                    ID: {s.id}
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem', color: '#475569', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ minWidth: '20px' }}>👤</span> 
                    <strong>{s.contactPerson || '-'}</strong>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ minWidth: '20px' }}>📞</span> 
                    {/* ✨ FIX: Tampilkan 'contact' dari V2 jika ada */}
                    {s.contact || s.phone || '-'}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ minWidth: '20px' }}>📍</span> 
                    {s.address || '-'}
                </div>
              </div>

              {['OWNER', 'ADMIN', 'SUPERADMIN'].includes(user?.role) && (
                <div style={{ display: 'flex', gap: '10px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                  <button onClick={() => openModal(s)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Edit</button>
                  <button onClick={() => handleDelete(s)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontWeight: '600', color: '#ef4444' }}>Hapus</button>
                </div>
              )}
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
                <div style={{ background: '#eff6ff', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🚚</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>{editingItem ? 'Edit Supplier' : 'Supplier Baru'}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Kelola database kontak pemasok</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Nama Perusahaan / Toko <span style={{color:'#ef4444'}}>*</span></label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Cth: PT. Sayur Segar" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Contact Person</label><input value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Nama PIC" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Telepon / WA</label><input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="08..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Alamat Lengkap</label><textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Alamat lengkap supplier..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }}></textarea></div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)', color: 'white', border: 'none', cursor: 'pointer' }}><span>💾</span> Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;