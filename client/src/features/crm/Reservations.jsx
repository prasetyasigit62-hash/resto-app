import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerName: '',
    contact: '',
    date: new Date().toISOString().slice(0, 10),
    time: '19:00',
    pax: 2,
    tableId: '',
    note: ''
  });

  // Fetch Reservations & Tables
  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const [resRes, resTables] = await Promise.all([
        fetch(`${backendUrl}/api/reservations`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/tables`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (resRes.ok) setReservations(await resRes.json());
      if (resTables.ok) setTables(await resTables.json());
    } catch (err) {
      toast.error('Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Reservasi berhasil disimpan!');
        setShowModal(false);
        setFormData({ customerName: '', contact: '', date: new Date().toISOString().slice(0, 10), time: '19:00', pax: 2, tableId: '', note: '' });
        fetchData();
      } else {
        toast.error('Gagal menyimpan reservasi.');
      }
    } catch (err) {
      toast.error('Error koneksi.');
    }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/reservations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.info(`Status diubah: ${status}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Gagal update status.');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Menunggu Pembayaran': { bg: '#fef3c7', color: '#d97706' },
      'Disetujui': { bg: '#e0f2fe', color: '#0284c7' },
      'Selesai': { bg: '#dcfce7', color: '#16a34a' },
      'Tidak Hadir': { bg: '#fee2e2', color: '#dc2626' },
      'Batal': { bg: '#f1f5f9', color: '#64748b' },
      Booked: { bg: '#e0f2fe', color: '#0284c7' },
      Arrived: { bg: '#dcfce7', color: '#16a34a' },
      Cancelled: { bg: '#fee2e2', color: '#dc2626' },
      Completed: { bg: '#f3f4f6', color: '#4b5563' }
    };
    const style = colors[status] || { bg: '#f3f4f6', color: '#4b5563' };
    return (
      <span style={{ backgroundColor: style.bg, color: style.color, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
        {status}
      </span>
    );
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>📅 Reservasi Meja</h2>
          <p style={{ color: '#64748b' }}>Kelola jadwal kedatangan pelanggan.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="profile-save-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>+</span> Reservasi Baru
        </button>
      </div>

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
              {reservations.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Belum ada reservasi.</td></tr>
              ) : (
                reservations.map(res => (
                  <tr key={res.id}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{res.time}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{new Date(res.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{res.customerName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>{res.contact || '-'}</div>
                    </td>
                    <td>{res.pax} Org</td>
                    <td>{res.tableId ? tables.find(t => t.id == res.tableId)?.name || 'Meja ' + res.tableId : <span style={{ color: '#999', fontStyle: 'italic' }}>Belum ditentukan</span>}</td>
                    <td>{getStatusBadge(res.status)}</td>
                    <td style={{ maxWidth: '200px', fontSize: '0.9rem', color: '#555' }}>{res.note || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {res.status === 'Menunggu Pembayaran' && (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => updateStatus(res.id, 'Disetujui')} title="Konfirmasi Pembayaran" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>✅ Bayar</button>
                          <button onClick={() => updateStatus(res.id, 'Batal')} title="Batalkan Reservasi" style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>❌ Batal</button>
                        </div>
                      )}
                      {res.status === 'Disetujui' && (
                         <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                           <button onClick={() => updateStatus(res.id, 'Selesai')} title="Tamu Hadir" style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>🚶‍♂️ Hadir</button>
                           <button onClick={() => updateStatus(res.id, 'Tidak Hadir')} title="Tamu Tidak Datang" style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>🚫 No-Show</button>
                         </div>
                      )}
                      {['Selesai', 'Batal', 'Tidak Hadir'].includes(res.status) && (
                         <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'bold' }}>-</span>
                      )}
                      {/* Fallback untuk reservasi versi lawas */}
                      {res.status === 'Booked' && (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => updateStatus(res.id, 'Arrived')} title="Tamu Datang" style={{ background: '#dcfce7', color: '#16a34a', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>✅ Datang</button>
                          <button onClick={() => updateStatus(res.id, 'Cancelled')} title="Batalkan" style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>❌ Batal</button>
                        </div>
                      )}
                      {res.status === 'Arrived' && (
                         <button onClick={() => updateStatus(res.id, 'Completed')} style={{ background: '#f3f4f6', color: '#4b5563', border: '1px solid #ccc', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize:'0.8rem' }}>Selesai</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#eff6ff', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📅</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>Buat Reservasi Baru</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Jadwalkan kedatangan tamu</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Nama Pelanggan <span style={{color:'#ef4444'}}>*</span></label><input required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} placeholder="Cth: Bpk. Budi" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Tanggal <span style={{color:'#ef4444'}}>*</span></label><input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Jam <span style={{color:'#ef4444'}}>*</span></label><input required type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Jumlah Tamu (Pax) <span style={{color:'#ef4444'}}>*</span></label><input required type="number" min="1" value={formData.pax} onChange={e => setFormData({ ...formData, pax: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>No. Kontak</label><input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="081..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Pilih Meja (Opsional)</label>
                <select value={formData.tableId} onChange={e => setFormData({ ...formData, tableId: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}>
                  <option value="">-- Pilih Meja Nanti --</option>
                  {tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.status})</option>)}
                </select>
              </div>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Catatan Khusus</label><textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="Cth: Ulang tahun, kursi bayi, dll" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }}></textarea></div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)', color: 'white', border: 'none', cursor: 'pointer' }}><span>💾</span> Simpan Reservasi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;