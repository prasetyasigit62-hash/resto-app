import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const InventoryV2 = ({ setConfirmModal, user }) => {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', unit: 'KG', lastPrice: '', minStock: '', supplierId: '', stock: '' });
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [sortConfig, setSortConfig] = useState({ column: 'name', direction: 'asc' });

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
      const [resMat, resSup] = await Promise.all([
        fetch(`${backendUrl}/api/v2/materials`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/v2/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resMat.ok) setMaterials(await resMat.json());
      if (resSup.ok) setSuppliers(await resSup.json());
    } catch (err) { toast.error("Gagal memuat data inventori"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    const url = formData.id ? `${backendUrl}/api/v2/materials/${formData.id}` : `${backendUrl}/api/v2/materials`;
    const method = formData.id ? 'PUT' : 'POST';
    try {
      // ✨ FIX MUTLAK: Rapikan Payload Form agar tidak tercampur format undefined
      const payload = {
        name: formData.name,
        unit: formData.unit || 'KG',
        lastPrice: Number(String(formData.lastPrice).replace(/\./g, '')),
        minStock: Number(formData.minStock || 0),
        supplierId: formData.supplierId || null,
        stock: formData.stock !== '' && formData.stock !== null ? Number(formData.stock) : null
      };
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const savedId = formData.id;
        toast.success(formData.id ? "Bahan baku berhasil diperbarui!" : "Bahan baku berhasil ditambahkan!");
        setShowModal(false);
        fetchData();
        if (savedId) {
          setRecentlyUpdatedId(savedId);
          setTimeout(() => setRecentlyUpdatedId(null), 5000);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menyimpan bahan");
      }
    } catch (err) { toast.error("Koneksi error"); }
  };

  const handleDelete = (item) => {
    if (setConfirmModal) {
      setConfirmModal({
        show: true,
        title: 'Hapus Bahan Baku',
        message: `Apakah Anda yakin ingin menghapus bahan baku "${item.name}"? Data stok fisik yang terikat juga akan terhapus.`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        onConfirm: async () => {
          const token = localStorage.getItem('resto_token');
          const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
          try {
            const res = await fetch(`${backendUrl}/api/v2/materials/${item.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              toast.success('Bahan baku berhasil dihapus.');
              fetchData();
            } else {
              const err = await res.json();
              toast.error(err.error || 'Gagal menghapus bahan baku.');
            }
          } catch (err) { toast.error('Gagal menghapus.'); }
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      });
    }
  };

  const handleSort = (column) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.column !== column) return <span style={{ color: '#cbd5e1', marginLeft: '4px', fontSize: '0.75rem' }}>⇅</span>;
    return <span style={{ color: '#3b82f6', marginLeft: '4px', fontSize: '0.75rem' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  const displayedMaterials = [...materials]
    .filter(m => m.name.toLowerCase().includes(searchText.toLowerCase()))
    .sort((a, b) => {
      if (a.id === recentlyUpdatedId) return -1;
      if (b.id === recentlyUpdatedId) return 1;
      let aVal, bVal;
      switch (sortConfig.column) {
        case 'stock':
          aVal = a.stocks?.reduce((acc, s) => acc + s.qty, 0) || 0;
          bVal = b.stocks?.reduce((acc, s) => acc + s.qty, 0) || 0;
          break;
        case 'lastPrice': aVal = a.lastPrice; bVal = b.lastPrice; break;
        case 'supplier': aVal = (a.supplier?.name || '').toLowerCase(); bVal = (b.supplier?.name || '').toLowerCase(); break;
        case 'unit': aVal = (a.unit || '').toLowerCase(); bVal = (b.unit || '').toLowerCase(); break;
        default: aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>🌾 Master Bahan Baku (V2)</h2>
          <p style={{ color: '#64748b' }}>Kelola data bahan mentah, satuan, dan peringatan stok.</p>
        </div>
        {['OWNER', 'ADMIN', 'SUPERADMIN'].includes(user?.role) && (
          <button onClick={() => { setFormData({ id: null, name: '', unit: 'KG', lastPrice: '', minStock: '', supplierId: '', stock: '' }); setShowModal(true); }} className="profile-save-btn" style={{ width: 'auto' }}>
            + Tambah Bahan
          </button>
        )}
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="text"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="🔍 Cari nama bahan baku..."
          style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', background: 'var(--card-bg)' }}
        />
        {searchText && (
          <button onClick={() => setSearchText('')} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}>✕ Reset</button>
        )}
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
          {displayedMaterials.length} / {materials.length} item
        </span>
      </div>

      {loading ? <p>Memuat data...</p> : (
        <div className="table-responsive" style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Nama Bahan <SortIcon column="name" /></th>
                <th onClick={() => handleSort('stock')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Stok Tersedia <SortIcon column="stock" /></th>
                <th onClick={() => handleSort('unit')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Satuan <SortIcon column="unit" /></th>
                <th onClick={() => handleSort('lastPrice')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Harga Terakhir <SortIcon column="lastPrice" /></th>
                <th onClick={() => handleSort('supplier')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Supplier Utama <SortIcon column="supplier" /></th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayedMaterials.length === 0 ? <tr><td colSpan="6" style={{textAlign:'center', color:'#999'}}>{materials.length === 0 ? 'Belum ada data bahan baku' : 'Tidak ada hasil yang cocok.'}</td></tr> : displayedMaterials.map(m => {
                 // Hitung total stok dari semua outlet (V2)
                 const totalStock = m.stocks?.reduce((acc, s) => acc + s.qty, 0) || 0;
                 const isLow = totalStock <= m.minStock;
                 return (
                  <tr key={m.id}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>
                      {m.name}
                      {m.id === recentlyUpdatedId && (
                        <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', verticalAlign: 'middle' }}>✓ Diperbarui</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', color: isLow ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{totalStock} {m.unit || 'KG'} {isLow && '⚠️ Low'}</td>
                    <td style={{ textAlign: 'center' }}><span style={{background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold'}}>{m.unit || 'KG'}</span></td>
                    <td style={{ textAlign: 'center' }}>Rp {m.lastPrice.toLocaleString('id-ID')}</td>
                    <td style={{ textAlign: 'center' }}>{m.supplier ? m.supplier.name : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {['OWNER', 'ADMIN', 'SUPERADMIN'].includes(user?.role) && (
                          <>
                            <button onClick={() => { setFormData({ id: m.id, name: m.name, unit: m.unit || 'KG', lastPrice: formatRupiah(m.lastPrice), minStock: m.minStock, supplierId: m.supplierId || '', stock: totalStock }); setShowModal(true); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '0.85rem', transition: 'all 0.2s' }}>Edit</button>
                            <button onClick={() => handleDelete(m)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontWeight: '600', color: '#ef4444', fontSize: '0.85rem', transition: 'all 0.2s' }}>Hapus</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#eff6ff', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🌾</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>{formData.id ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{formData.id ? 'Perbarui data inventori mentah' : 'Masukkan data inventori mentah'}</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Nama Bahan <span style={{color:'#ef4444'}}>*</span></label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Cth: Beras Premium" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Stok Fisik Tersedia <span style={{color:'#ef4444'}}>*</span></label><input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="Cth: 10" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Satuan (Unit) <span style={{color:'#ef4444'}}>*</span></label><select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}><option value="KG">Kilogram (KG)</option><option value="LITER">Liter</option><option value="PCS">Pcs</option><option value="GRAM">Gram</option></select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Batas Minimum Stok <span style={{color:'#ef4444'}}>*</span></label><input required type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} placeholder="Cth: 5" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Harga Beli (Rp) <span style={{color:'#ef4444'}}>*</span></label><input required type="text" value={formData.lastPrice} onChange={e => setFormData({...formData, lastPrice: formatRupiah(e.target.value)})} placeholder="Contoh: 15.000" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Supplier Utama</label><select value={formData.supplierId || ''} onChange={e => setFormData({...formData, supplierId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}><option value="">-- Pilih Supplier --</option>{Array.isArray(suppliers) ? suppliers.map(s => <option key={s.id} value={s.id}>{s.name} {s.contactPerson || s.contact_person ? `(${s.contactPerson || s.contact_person})` : ''}</option>) : null}</select></div>
              </div>
              <button type="submit" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}><span>💾</span> Simpan Bahan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryV2;