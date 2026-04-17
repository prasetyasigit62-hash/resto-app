import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const EMPTY_FORM = {
  customerName: '',
  contact: '',
  date: new Date().toISOString().slice(0, 10),
  time: '19:00',
  pax: 2,
  tableId: '',
  note: ''
};

const Reservations = ({ user }) => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);

  const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
  const token = () => localStorage.getItem('resto_token');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, resTables] = await Promise.all([
        fetch(`${backendUrl}/api/reservations`, { headers: { 'Authorization': `Bearer ${token()}` } }),
        fetch(`${backendUrl}/api/tables`, { headers: { 'Authorization': `Bearer ${token()}` } })
      ]);
      if (resRes.ok) setReservations(await resRes.json());
      if (resTables.ok) setTables(await resTables.json());
    } catch { toast.error('Gagal memuat data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      const d = new Date(item.reservationDate || item.date);
      setFormData({
        customerName: item.customerName || item.customer_name || '',
        contact: item.contact || '',
        date: d.toISOString().slice(0, 10),
        time: item.reservationTime || item.time || '19:00',
        pax: item.pax || 2,
        tableId: item.tableId || '',
        note: item.note || ''
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await fetch(`${backendUrl}/api/update/reservations/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
          body: JSON.stringify({
            customer_name: formData.customerName,
            contact: formData.contact,
            reservation_date: formData.date,
            reservation_time: formData.time,
            pax: formData.pax,
            table_id: formData.tableId || null,
            note: formData.note,
            status: editingItem.status
          })
        });
      } else {
        res = await fetch(`${backendUrl}/api/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
          body: JSON.stringify(formData)
        });
      }

      if (res.ok) {
        toast.success(editingItem ? 'Reservasi berhasil diperbarui!' : 'Reservasi berhasil disimpan!');
        setShowModal(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Gagal menyimpan reservasi.');
      }
    } catch { toast.error('Error koneksi.'); }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${backendUrl}/api/reservations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) { toast.info(`Status diubah: ${status}`); fetchData(); }
      else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Gagal update status.');
      }
    } catch { toast.error('Gagal update status.'); }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Menunggu Pembayaran': { bg: '#fef3c7', color: '#d97706' },
      'Disetujui':  { bg: '#e0f2fe', color: '#0284c7' },
      'Selesai':    { bg: '#dcfce7', color: '#16a34a' },
      'Tidak Hadir':{ bg: '#fef3c7', color: '#b45309' },
      'Batal':      { bg: '#f1f5f9', color: '#64748b' },
      Booked:       { bg: '#e0f2fe', color: '#0284c7' },
      Arrived:      { bg: '#dcfce7', color: '#16a34a' },
      Cancelled:    { bg: '#fee2e2', color: '#dc2626' },
      Completed:    { bg: '#f3f4f6', color: '#4b5563' }
    };
    const s = colors[status] || { bg: '#f3f4f6', color: '#4b5563' };
    return <span style={{ backgroundColor: s.bg, color: s.color, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>{status}</span>;
  };

  const allStatuses = [...new Set(reservations.map(r => r.status).filter(Boolean))];

  const filteredReservations = reservations.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      const name = (r.customerName || r.customer_name || '').toLowerCase();
      const contact = (r.contact || '').toLowerCase();
      if (!name.includes(q) && !contact.includes(q)) return false;
    }
    return true;
  });

  const canManage = ['OWNER', 'ADMIN', 'SUPERADMIN', 'KASIR'].includes(user?.role);

  return (
    <div className="service-view">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>📅 Reservasi Meja</h2>
          <p style={{ color: '#64748b' }}>Kelola jadwal kedatangan pelanggan.</p>
        </div>
        {canManage && (
          <button onClick={() => openModal()} className="profile-save-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>+</span> Reservasi Baru
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ background: 'var(--card-bg)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Cari nama pelanggan atau kontak..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'var(--card-bg)' }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'var(--card-bg)', cursor: 'pointer' }}>
          <option value="all">Semua Status</option>
          {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(searchText || statusFilter !== 'all') && (
          <button onClick={() => { setSearchText(''); setStatusFilter('all'); }}
            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}>
            ✕ Reset
          </button>
        )}
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{filteredReservations.length} / {reservations.length} reservasi</span>
      </div>

      {/* Table */}
      {loading ? <p>Memuat data...</p> : (
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal & Jam</th>
                <th>Pelanggan</th>
                <th>Pax</th>
                <th>Meja</th>
                <th>Status</th>
                <th>Catatan</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  {reservations.length === 0 ? 'Belum ada reservasi.' : 'Tidak ada hasil yang cocok.'}
                </td></tr>
              ) : filteredReservations.map(res => (
                <tr key={res.id}>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{res.reservationTime || res.time}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {new Date(res.reservationDate || res.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{res.customerName || res.customer_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{res.contact || '-'}</div>
                  </td>
                  <td>{res.pax} Org</td>
                  <td>
                    {res.tableId
                      ? tables.find(t => t.id == res.tableId)?.name || 'Meja ' + res.tableId
                      : <span style={{ color: '#999', fontStyle: 'italic' }}>Belum ditentukan</span>}
                  </td>
                  <td>{getStatusBadge(res.status)}</td>
                  <td style={{ maxWidth: '180px', fontSize: '0.9rem', color: '#555' }}>{res.note || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {/* Edit button — always visible for managers */}
                      {canManage && (
                        <button onClick={() => openModal(res)}
                          style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>
                          ✏️ Edit
                        </button>
                      )}
                      {res.status === 'Menunggu Pembayaran' && (
                        <>
                          <button onClick={() => updateStatus(res.id, 'Disetujui')} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>✅ Bayar</button>
                          <button onClick={() => updateStatus(res.id, 'Batal')} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>❌ Batal</button>
                        </>
                      )}
                      {res.status === 'Disetujui' && (
                        <>
                          <button onClick={() => updateStatus(res.id, 'Selesai')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>🚶 Hadir</button>
                          <button onClick={() => updateStatus(res.id, 'Tidak Hadir')} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>🚫 No-Show</button>
                        </>
                      )}
                      {res.status === 'Booked' && (
                        <>
                          <button onClick={() => updateStatus(res.id, 'Arrived')} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>✅ Datang</button>
                          <button onClick={() => updateStatus(res.id, 'Cancelled')} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>❌ Batal</button>
                        </>
                      )}
                      {res.status === 'Arrived' && (
                        <button onClick={() => updateStatus(res.id, 'Completed')} style={{ background: '#f3f4f6', color: '#4b5563', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Selesai</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', background: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#eff6ff', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📅</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>{editingItem ? 'Edit Reservasi' : 'Buat Reservasi Baru'}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {editingItem ? `Mengubah reservasi ${editingItem.customerName || editingItem.customer_name}` : 'Jadwalkan kedatangan tamu'}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Nama Pelanggan <span style={{ color: '#ef4444' }}>*</span></label>
                <input required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} placeholder="Cth: Bpk. Budi"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Tanggal <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Jam <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Jumlah Tamu (Pax) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required type="number" min="1" value={formData.pax} onChange={e => setFormData({ ...formData, pax: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>No. Kontak</label>
                  <input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="081..."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Pilih Meja (Opsional)</label>
                <select value={formData.tableId} onChange={e => setFormData({ ...formData, tableId: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}>
                  <option value="">-- Pilih Meja Nanti --</option>
                  {tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.status || 'Available'})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Catatan Khusus</label>
                <textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="Cth: Ulang tahun, kursi bayi, dll"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit"
                  style={{ flex: 2, padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 10px 15px -3px rgba(59,130,246,0.3)', color: 'white', border: 'none', cursor: 'pointer' }}>
                  <span>💾</span> {editingItem ? 'Simpan Perubahan' : 'Simpan Reservasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;
