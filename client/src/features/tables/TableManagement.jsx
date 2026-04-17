import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { QRCodeCanvas } from 'qrcode.react';

const STATUS_OPTIONS = ['Available', 'Occupied', 'Reserved', 'Cleaning'];
const STATUS_STYLE = {
  Available:  { bg: '#dcfce7', color: '#16a34a' },
  Occupied:   { bg: '#fee2e2', color: '#dc2626' },
  Reserved:   { bg: '#fef3c7', color: '#d97706' },
  Cleaning:   { bg: '#f1f5f9', color: '#64748b' },
};

const TableManagement = ({ user, setConfirmModal }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({ name: '', status: 'Available' });

  const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
  const token = () => localStorage.getItem('resto_token');

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/tables`, { headers: { 'Authorization': `Bearer ${token()}` } });
      if (res.ok) setTables(await res.json());
      else toast.error('Gagal mengambil data meja.');
    } catch { toast.error('Koneksi error.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTables(); }, []);

  const openModal = (table = null) => {
    setEditingTable(table);
    setFormData(table ? { name: table.name, status: table.status || 'Available' } : { name: '', status: 'Available' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.warn('Nama meja wajib diisi.');
    try {
      const url = editingTable ? `${backendUrl}/api/tables/${editingTable.id}` : `${backendUrl}/api/tables`;
      const method = editingTable ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(editingTable ? 'Meja berhasil diperbarui!' : 'Meja berhasil ditambahkan!');
        setShowModal(false);
        fetchTables();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Gagal menyimpan meja.');
      }
    } catch { toast.error('Koneksi error.'); }
  };

  const handleDelete = (table) => {
    if (!setConfirmModal) return;
    setConfirmModal({
      show: true,
      title: 'Hapus Meja',
      message: `Hapus meja "${table.name}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const res = await fetch(`${backendUrl}/api/tables/${table.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token()}` }
          });
          if (res.ok) { toast.success('Meja berhasil dihapus.'); fetchTables(); }
          else {
            const err = await res.json().catch(() => ({}));
            toast.error(err.error || 'Gagal menghapus meja.');
          }
        } catch { toast.error('Koneksi error.'); }
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.warn('Izinkan popup untuk mencetak QR.'); return; }
    let content = `<html><head><title>QR Code Semua Meja</title><style>
      body { font-family: sans-serif; }
      .page { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px 20px; padding: 20px; }
      .qr-card { border: 2px solid #000; border-radius: 10px; padding: 15px; text-align: center; page-break-inside: avoid; }
      h3 { margin: 0 0 10px 0; font-size: 1.5rem; }
      @media print { .page { page-break-after: always; } }
    </style></head><body><div class="page">`;
    tables.forEach(table => {
      const canvas = document.getElementById(`qr-${table.id}`);
      if (!canvas) return;
      content += `<div class="qr-card"><h3>${table.name}</h3><img src="${canvas.toDataURL()}" width="150" height="150" /><p>Scan untuk Pesan</p></div>`;
    });
    content += `</div></body></html>`;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const canManage = ['OWNER', 'ADMIN', 'SUPERADMIN'].includes(user?.role);
  const selfOrderBaseUrl = window.location.origin;

  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = tables.filter(t => (t.status || 'Available') === s).length;
    return acc;
  }, {});

  return (
    <div className="service-view">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>🪑 Manajemen Meja & QR Code</h2>
          <p style={{ color: '#64748b' }}>Kelola meja restoran dan generate QR code self-order.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={handlePrintAll} disabled={tables.length === 0}
            style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: tables.length === 0 ? 'default' : 'pointer', fontWeight: '600', color: '#475569', opacity: tables.length === 0 ? 0.5 : 1 }}>
            🖨️ Cetak Semua QR
          </button>
          {canManage && (
            <button onClick={() => openModal()} className="profile-save-btn" style={{ width: 'auto' }}>
              + Tambah Meja
            </button>
          )}
        </div>
      </div>

      {/* Status Summary Bar */}
      {!loading && tables.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(s => {
            const style = STATUS_STYLE[s];
            return (
              <div key={s} style={{ background: style.bg, color: style.color, padding: '8px 16px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>{statusCounts[s]}</span>
                <span style={{ fontWeight: '500' }}>{s}</span>
              </div>
            );
          })}
          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#94a3b8', alignSelf: 'center' }}>{tables.length} meja total</div>
        </div>
      )}

      {/* Table Grid */}
      {loading ? <p>Memuat data meja...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {tables.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🪑</div>
              <p>Belum ada meja. Tambahkan meja pertama Anda.</p>
            </div>
          )}
          {tables.map(table => {
            const st = table.status || 'Available';
            const stStyle = STATUS_STYLE[st] || STATUS_STYLE.Available;
            return (
              <div key={table.id} style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: `1px solid ${stStyle.color}33`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>{table.name}</h3>
                  <span style={{ background: stStyle.bg, color: stStyle.color, padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>{st}</span>
                </div>
                <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'inline-block', margin: '0 auto' }}>
                  <QRCodeCanvas
                    id={`qr-${table.id}`}
                    value={`${selfOrderBaseUrl}/order/${table.id}`}
                    size={140}
                    level="H"
                    includeMargin
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Scan untuk memesan dari meja ini.</p>
                {canManage && (
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={() => openModal(table)}
                      style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(table)}
                      style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontWeight: '600', color: '#ef4444', fontSize: '0.85rem' }}>
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div style={{ maxWidth: '480px', width: '100%', borderRadius: '24px', background: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ background: '#f0fdf4', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🪑</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{editingTable ? 'Edit Meja' : 'Tambah Meja Baru'}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Kelola data meja restoran</span>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  Nama Meja <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  required
                  autoFocus
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cth: Meja 1, VIP 1, Outdoor A..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Status Meja</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {STATUS_OPTIONS.map(s => {
                    const st = STATUS_STYLE[s];
                    const selected = formData.status === s;
                    return (
                      <button key={s} type="button" onClick={() => setFormData({ ...formData, status: s })}
                        style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${selected ? st.color : '#e2e8f0'}`, background: selected ? st.bg : 'white', color: selected ? st.color : '#64748b', fontWeight: selected ? '700' : '500', cursor: 'pointer', transition: 'all 0.15s' }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '14px', fontSize: '1rem', fontWeight: '700', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit"
                  style={{ flex: 2, padding: '14px', fontSize: '1rem', fontWeight: '800', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 8px 15px -3px rgba(59,130,246,0.3)' }}>
                  💾 Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
