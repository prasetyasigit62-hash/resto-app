import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const StockMutationV2 = ({ user }) => {
  const [stocks, setStocks] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stok'); // 'stok' | 'mutasi' | 'fraud'
  
  const [fraudData, setFraudData] = useState({ report: [], tolerancePercent: 5 });
  
  // Modal Opname
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [opnameForm, setOpnameForm] = useState({ outletId: '', materialId: '', realQty: '', note: '', mode: 'set' });
  
  // ✨ Modal Waste (Barang Rusak)
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [wasteForm, setWasteForm] = useState({ outletId: '', materialId: '', wasteQty: '', note: '' });

  // ✨ Modal Quick Restock (Pembelian Manual Tanpa PO)
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockForm, setRestockForm] = useState({ outletId: '', materialId: '', qty: '', cost: '', supplierId: '', note: '' });
  const [showRestockMatDropdown, setShowRestockMatDropdown] = useState(false);

  // ✨ Helper Format Rupiah Otomatis
  const formatRupiah = (value) => {
    if (!value) return '';
    return String(value).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const getMaterialStockInfo = (materialId, outletId) => {
    const filtered = stocks.filter(s => s.materialId === materialId && (!outletId || s.outletId === outletId));
    const qty = filtered.reduce((acc, s) => acc + s.qty, 0);
    const mat = materials.find(m => m.id === materialId);
    return { qty, unit: mat?.unit || '', isLow: mat ? qty <= mat.minStock : false };
  };

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const [resStocks, resMut, resOut, resMat, resSup] = await Promise.all([
        fetch(`${backendUrl}/api/v2/stocks`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/v2/mutations`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/v2/outlets`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/v2/materials`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/v2/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resStocks.ok) setStocks(await resStocks.json());
      if (resMut.ok) setMutations(await resMut.json());
      if (resOut.ok) setOutlets(await resOut.json());
      if (resMat.ok) setMaterials(await resMat.json());
      if (resSup.ok) setSuppliers(await resSup.json());
      
      // Fetch Fraud Data jika user adalah admin/owner
      if (['OWNER', 'ADMIN', 'SUPERADMIN'].includes(String(user.role).toUpperCase())) {
         const resFraud = await fetch(`${backendUrl}/api/v2/reports/fraud?outletId=${user.outletId || 'ALL'}`, { headers: { 'Authorization': `Bearer ${token}` } });
         if (resFraud.ok) setFraudData(await resFraud.json());
      }
      
    } catch (err) { toast.error("Gagal memuat data stok."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpnameSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

    // ✨ Hitung realQty berdasarkan mode yang dipilih (Set / Add / Subtract)
    const s = stocks.find(st => st.materialId === opnameForm.materialId && (!opnameForm.outletId || st.outletId === opnameForm.outletId));
    const curr = s ? s.qty : 0;
    const inputVal = Number(opnameForm.realQty);
    let finalQty = inputVal;
    
    if (opnameForm.mode === 'subtract') finalQty = curr - inputVal;
    else if (opnameForm.mode === 'add') finalQty = curr + inputVal;

    const payload = {
        ...opnameForm,
        realQty: finalQty
    };

    try {
      const res = await fetch(`${backendUrl}/api/v2/mutations/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        setShowOpnameModal(false);
        fetchData();
      } else toast.error(result.error);
    } catch (err) { toast.error("Error koneksi."); }
  };

  const handleWasteSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/v2/mutations/waste`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(wasteForm)
      });
      const result = await res.json();
      if (res.ok) { toast.success(result.message); setShowWasteModal(false); fetchData(); } 
      else toast.error(result.error);
    } catch (err) { toast.error("Error koneksi."); }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const payload = {
        ...restockForm,
        cost: restockForm.cost ? Number(String(restockForm.cost).replace(/\./g, '')) : ''
      };
      const res = await fetch(`${backendUrl}/api/v2/mutations/restock`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) { toast.success(result.message); setShowRestockModal(false); fetchData(); } 
      else toast.error(result.error);
    } catch (err) { toast.error("Error koneksi."); }
  };

  const getMutationBadge = (type) => {
    const types = {
      IN_PO: { label: 'Masuk (PO)', color: '#10b981', bg: '#dcfce7' },
      OUT_SALES: { label: 'Terjual (POS)', color: '#3b82f6', bg: '#dbeafe' },
      OUT_WASTE: { label: 'Terbuang', color: '#ef4444', bg: '#fee2e2' },
      OPNAME_ADJ: { label: 'Opname/Adjustment', color: '#f59e0b', bg: '#fef3c7' },
    };
    const style = types[type] || { label: type, color: '#64748b', bg: '#f1f5f9' };
    return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', color: style.color, background: style.bg }}>{style.label}</span>;
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>📦 Stok & Mutasi Outlet</h2>
          <p style={{ color: '#64748b' }}>Pantau pergerakan bahan baku dan lakukan Stock Opname harian.</p>
        </div>
        {['OWNER', 'ADMIN', 'CHEF', 'SUPERADMIN'].includes(String(user?.role).toUpperCase()) && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setRestockForm({ outletId: user.outletId || '', materialId: '', qty: '', cost: '', supplierId: '', note: 'Quick Restock Harian' }); setShowRestockModal(true); }} className="profile-save-btn" style={{ width: 'auto', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 6px rgba(59,130,246,0.3)' }}>
                📥 Quick Restock
            </button>
            <button onClick={() => { setWasteForm({ outletId: user.outletId || '', materialId: '', wasteQty: '', note: 'Barang Rusak / Kadaluarsa' }); setShowWasteModal(true); }} className="profile-save-btn" style={{ width: 'auto', background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 6px rgba(239,68,68,0.3)' }}>
                🗑️ Catat Waste
            </button>
            <button onClick={() => { setOpnameForm({ outletId: user.outletId || '', materialId: '', realQty: '', note: 'Stock Opname Harian', mode: 'set' }); setShowOpnameModal(true); }} className="profile-save-btn" style={{ width: 'auto', background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 6px rgba(245,158,11,0.3)' }}>
                ⚖️ Lakukan Opname
            </button>
        </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)' }}>
        <button onClick={() => setActiveTab('stok')} style={{ padding: '10px 20px', border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '1rem', color: activeTab === 'stok' ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: activeTab === 'stok' ? '3px solid var(--primary-color)' : 'none', cursor: 'pointer' }}>Stok Real-time Cabang</button>
        <button onClick={() => setActiveTab('mutasi')} style={{ padding: '10px 20px', border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '1rem', color: activeTab === 'mutasi' ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: activeTab === 'mutasi' ? '3px solid var(--primary-color)' : 'none', cursor: 'pointer' }}>Riwayat Mutasi (Ledger)</button>
        {['OWNER', 'ADMIN', 'SUPERADMIN'].includes(String(user.role).toUpperCase()) && (
          <button onClick={() => setActiveTab('fraud')} style={{ padding: '10px 20px', border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '1rem', color: activeTab === 'fraud' ? '#ef4444' : 'var(--text-muted)', borderBottom: activeTab === 'fraud' ? '3px solid #ef4444' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>🚨 Analitik Fraud & Susut</button>
        )}
      </div>

      {loading ? <p>Memuat data...</p> : activeTab === 'stok' ? (
        <div className="table-responsive" style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table className="data-table">
            <thead><tr><th>Cabang (Outlet)</th><th>Bahan Baku</th><th>Stok Saat Ini</th><th>Satuan</th><th>Status</th></tr></thead>
            <tbody>
              {stocks.length === 0 ? <tr><td colSpan="5" style={{textAlign:'center'}}>Belum ada data stok cabang.</td></tr> : stocks.map(s => {
                 const isLow = s.qty <= (s.material?.minStock || 0);
                 return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 'bold', color: '#1e293b' }}>{s.outlet?.name}</td>
                    <td>{s.material?.name}</td>
                    <td style={{ fontSize: '1.1rem', fontWeight: 'bold', color: isLow ? '#ef4444' : '#10b981' }}>{s.qty}</td>
                    <td><span style={{background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px'}}>{s.material?.unit}</span></td>
                    <td>{isLow ? <span style={{color: '#ef4444', fontWeight:'bold'}}>⚠️ Menipis</span> : <span style={{color: '#10b981', fontWeight:'bold'}}>✅ Aman</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'mutasi' ? (
        <div className="table-responsive" style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table className="data-table">
            <thead><tr><th>Waktu</th><th>Cabang</th><th>Bahan Baku</th><th>Jenis Mutasi</th><th>Jml Masuk/Keluar</th><th>Oleh</th><th>Keterangan</th></tr></thead>
            <tbody>
              {mutations.length === 0 ? <tr><td colSpan="7" style={{textAlign:'center'}}>Belum ada riwayat pergerakan stok.</td></tr> : mutations.map(m => (
                  <tr key={m.id}>
                    <td><div style={{fontSize:'0.85rem'}}>{new Date(m.createdAt).toLocaleDateString('id-ID')}</div><div style={{fontWeight:'bold', color:'#64748b', fontSize:'0.8rem'}}>{new Date(m.createdAt).toLocaleTimeString('id-ID')}</div></td>
                    <td>{m.outlet?.name}</td>
                    <td style={{fontWeight:'bold'}}>{m.material?.name}</td>
                    <td>{getMutationBadge(m.type)}</td>
                    <td style={{ fontWeight: 'bold', color: m.qty > 0 ? '#10b981' : (m.qty < 0 ? '#ef4444' : '#f59e0b') }}>{m.qty > 0 ? '+' : ''}{m.qty} {m.material?.unit}</td>
                    <td>{m.user?.username}</td>
                    <td style={{fontSize:'0.85rem', color:'#475569'}}>{m.reference ? `Ref: ${m.reference} - ` : ''}{m.note}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'fraud' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#991b1b' }}>Investigasi Kecolongan & Selisih Stok</h3>
                    <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.9rem' }}>Batas Pemakluman / Toleransi Sistem: <strong>{fraudData.tolerancePercent}%</strong></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold' }}>Total Potensi Kerugian (Rp)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#dc2626' }}>
                        Rp {fraudData.report.reduce((acc, curr) => acc + curr.financialLoss, 0).toLocaleString('id-ID')}
                    </div>
                </div>
            </div>
            <div className="table-responsive" style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <table className="data-table">
                <thead><tr><th>Cabang</th><th>Bahan Baku</th><th>Terjual POS</th><th>Dilaporkan Rusak</th><th>Hilang Tanpa Jejak</th><th>Tingkat Susut</th><th>Nilai Kerugian</th><th>PIC Opname Terakhir</th><th>Status</th></tr></thead>
                <tbody>
                  {fraudData.report.length === 0 ? <tr><td colSpan="9" style={{textAlign:'center', padding:'30px', color:'#10b981', fontWeight:'bold'}}>🎉 Hebat! Tidak ada barang hilang atau selisih stok (Aman dari Fraud).</td></tr> : fraudData.report.map((r, i) => (
                      <tr key={i} style={{ background: r.isFraud ? '#fff1f2' : 'transparent' }}>
                        <td style={{ fontWeight: 'bold' }}>{r.outletName}</td>
                        <td style={{ fontWeight: 'bold' }}>{r.materialName}</td>
                        <td style={{ color: '#3b82f6', fontWeight: 'bold' }}>{r.totalSalesUsage} {r.unit}</td>
                        <td style={{ color: '#f59e0b', fontWeight: 'bold' }}>{r.totalWaste} {r.unit}</td>
                        <td style={{ color: '#ef4444', fontWeight: '900', fontSize: '1.1rem' }}>{r.totalMissing} {r.unit}</td>
                        <td><span style={{ fontWeight: 'bold', color: r.isFraud ? '#ef4444' : '#64748b' }}>{r.lossRate}%</span></td>
                        <td style={{ fontWeight: 'bold', color: '#dc2626' }}>Rp {r.financialLoss.toLocaleString('id-ID')}</td>
                        <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>👤 {r.suspectUsers}</span></td>
                        <td>
                            {r.isFraud ? <span style={{ background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>🚨 INDIKASI FRAUD</span> : <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Wajar / Dimaklumi</span>}
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      ) : null}

      {showOpnameModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#fef3c7', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⚖️</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>Stock Opname</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Sesuaikan stok fisik dengan sistem</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowOpnameModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleOpnameSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                {(!user.outletId || ['OWNER', 'ADMIN', 'SUPERADMIN'].includes(user?.role)) && (
                   <div>
                     <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Pilih Cabang <span style={{color:'#ef4444'}}>*</span></label>
                     <select required value={opnameForm.outletId} onChange={e => setOpnameForm({...opnameForm, outletId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white', cursor: 'pointer' }}>
                       <option value="">-- Pilih Cabang --</option>
                       {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                     </select>
                   </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Pilih Bahan Baku <span style={{color:'#ef4444'}}>*</span></label>
                  <select required value={opnameForm.materialId} onChange={e => setOpnameForm({...opnameForm, materialId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white', cursor: 'pointer' }}>
                    <option value="">-- Pilih Bahan --</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                  </select>
                </div>
              </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Mode Penyesuaian <span style={{color:'#ef4444'}}>*</span></label>
              <select required value={opnameForm.mode || 'set'} onChange={e => setOpnameForm({...opnameForm, mode: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white', cursor: 'pointer' }}>
                <option value="set">Set Total Sisa Fisik (Stock Opname Normal)</option>
                <option value="subtract">Kurangi Stok (Selisih Minus)</option>
                <option value="add">Tambah Stok (Selisih Plus)</option>
              </select>
            </div>
          </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Input Angka <span style={{color:'#ef4444'}}>*</span></label>
              <input required type="number" step="0.01" min="0" value={opnameForm.realQty} onChange={e => setOpnameForm({...opnameForm, realQty: e.target.value})} placeholder={opnameForm.mode === 'set' ? "Cth: Sisa fisik di gudang" : "Cth: 5"} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Keterangan / Catatan <span style={{color:'#ef4444'}}>*</span></label>
                  <input required value={opnameForm.note} onChange={e => setOpnameForm({...opnameForm, note: e.target.value})} placeholder="Cth: Penyesuaian akhir bulan" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>
              </div>

              {/* ✨ NEW: Info Kalkulasi Opname Real-time */}
              {opnameForm.materialId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#eff6ff', padding: '15px 20px', borderRadius: '12px', border: '1px dashed #93c5fd' }}>
                   <div>
                      <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold' }}>Stok Sistem Saat Ini</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e3a8a' }}>
                          {(() => {
                              const s = stocks.find(st => st.materialId === opnameForm.materialId && (!opnameForm.outletId || st.outletId === opnameForm.outletId));
                              return s ? s.qty : 0;
                          })()}
                      </div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold' }}>Hasil Akhir (Estimasi)</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: (() => {
                          const s = stocks.find(st => st.materialId === opnameForm.materialId && (!opnameForm.outletId || st.outletId === opnameForm.outletId));
                          const curr = s ? s.qty : 0;
                      const inputVal = opnameForm.realQty !== '' ? Number(opnameForm.realQty) : 0;
                      let diff = 0;
                      if (opnameForm.mode === 'subtract') diff = -inputVal;
                      else if (opnameForm.mode === 'add') diff = inputVal;
                      else diff = inputVal - curr;
                          return diff > 0 ? '#16a34a' : (diff < 0 ? '#ef4444' : '#64748b');
                      })() }}>
                          {(() => {
                              const s = stocks.find(st => st.materialId === opnameForm.materialId && (!opnameForm.outletId || st.outletId === opnameForm.outletId));
                              const curr = s ? s.qty : 0;
                          const inputVal = opnameForm.realQty !== '' ? Number(opnameForm.realQty) : 0;
                          let finalQty = curr;
                          let diff = 0;
                          if (opnameForm.mode === 'subtract') { diff = -inputVal; finalQty = curr - inputVal; }
                          else if (opnameForm.mode === 'add') { diff = inputVal; finalQty = curr + inputVal; }
                          else { finalQty = inputVal; diff = inputVal - curr; }
                          return `${finalQty} (${diff > 0 ? '+' : ''}${diff})`;
                          })()}
                      </div>
                   </div>
                </div>
              )}

              <button type="submit" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}><span>⚖️</span> Update Stok Sistem</button>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL WASTE (BARANG RUSAK) */}
      {showWasteModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#fef2f2', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🗑️</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>Catat Waste</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Kurangi stok karena rusak/basi</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowWasteModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleWasteSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                {(!user.outletId || ['OWNER', 'ADMIN', 'SUPERADMIN'].includes(user?.role)) && (
                   <div>
                     <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Pilih Cabang <span style={{color:'#ef4444'}}>*</span></label>
                     <select required value={wasteForm.outletId} onChange={e => setWasteForm({...wasteForm, outletId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white', cursor: 'pointer' }}>
                       <option value="">-- Pilih Cabang --</option>
                       {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                     </select>
                   </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Pilih Bahan Baku <span style={{color:'#ef4444'}}>*</span></label>
                  <select required value={wasteForm.materialId} onChange={e => setWasteForm({...wasteForm, materialId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white', cursor: 'pointer' }}>
                    <option value="">-- Pilih Bahan --</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Jumlah Terbuang <span style={{color:'#ef4444'}}>*</span></label>
                  <input required type="number" step="0.01" value={wasteForm.wasteQty} onChange={e => setWasteForm({...wasteForm, wasteQty: e.target.value})} placeholder="Cth: 2.5" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Alasan / Catatan <span style={{color:'#ef4444'}}>*</span></label>
                  <input required value={wasteForm.note} onChange={e => setWasteForm({...wasteForm, note: e.target.value})} placeholder="Contoh: Busuk, jatuh..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>
              </div>
              <button type="submit" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}><span>🗑️</span> Simpan Waste</button>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL RESTOCK (STOK MASUK MANUAL V2) */}
      {showRestockModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#eff6ff', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📥</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>Quick Restock</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Tambah stok manual tanpa PO</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowRestockModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleRestockSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                {(!user.outletId || ['OWNER', 'ADMIN', 'SUPERADMIN'].includes(user?.role)) && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Pilih Cabang <span style={{color:'#ef4444'}}>*</span></label>
                    <select required value={restockForm.outletId} onChange={e => setRestockForm({...restockForm, outletId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white', cursor: 'pointer' }}>
                      <option value="">-- Pilih Cabang --</option>
                      {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Pilih Bahan Baku <span style={{color:'#ef4444'}}>*</span></label>
                  {/* Trigger */}
                  <div
                    onClick={() => setShowRestockMatDropdown(v => !v)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1.5px solid ${showRestockMatDropdown ? '#3b82f6' : '#cbd5e1'}`, fontSize: '0.95rem', background: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box', userSelect: 'none', transition: 'border 0.2s' }}
                  >
                    {restockForm.materialId ? (() => {
                      const mat = materials.find(x => x.id === restockForm.materialId);
                      const info = getMaterialStockInfo(restockForm.materialId, restockForm.outletId);
                      return (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{mat?.name}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: info.isLow ? '#ef4444' : '#10b981', background: info.isLow ? '#fef2f2' : '#f0fdf4', padding: '2px 8px', borderRadius: '8px' }}>
                            {info.qty} {info.unit}{info.isLow ? ' ⚠️' : ''}
                          </span>
                        </span>
                      );
                    })() : <span style={{ color: '#94a3b8' }}>-- Pilih Bahan --</span>}
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '8px' }}>{showRestockMatDropdown ? '▲' : '▼'}</span>
                  </div>
                  {/* Dropdown list */}
                  {showRestockMatDropdown && (
                    <>
                      <div onClick={() => setShowRestockMatDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', zIndex: 100, maxHeight: '240px', overflowY: 'auto', boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}>
                        {materials.map((m, idx) => {
                          const info = getMaterialStockInfo(m.id, restockForm.outletId);
                          const isSelected = restockForm.materialId === m.id;
                          return (
                            <div
                              key={m.id}
                              onClick={() => { setRestockForm(prev => ({...prev, materialId: m.id})); setShowRestockMatDropdown(false); }}
                              style={{ padding: '11px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < materials.length - 1 ? '1px solid #f1f5f9' : 'none', background: isSelected ? '#eff6ff' : info.isLow ? '#fffbeb' : 'transparent', transition: 'background 0.1s' }}
                              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = info.isLow ? '#fffbeb' : 'transparent'; }}
                            >
                              <span style={{ fontWeight: isSelected ? '700' : '500', color: '#0f172a', fontSize: '0.92rem' }}>{m.name}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: info.isLow ? '#ef4444' : '#10b981', background: info.isLow ? '#fef2f2' : '#f0fdf4', padding: '2px 10px', borderRadius: '8px' }}>
                                  {info.qty} {info.unit}
                                </span>
                                {info.isLow && (
                                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#dc2626', background: '#fee2e2', padding: '2px 7px', borderRadius: '6px' }}>⚠️ Menipis</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {/* hidden input for required validation */}
                  <input type="text" required readOnly value={restockForm.materialId} style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} tabIndex={-1} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Jumlah Masuk <span style={{color:'#ef4444'}}>*</span></label>
                  <input required type="number" step="0.01" value={restockForm.qty} onChange={e => setRestockForm({...restockForm, qty: e.target.value})} placeholder="Cth: 10" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Harga Beli Baru (Rp)</label>
                  <input type="text" value={restockForm.cost} onChange={e => setRestockForm({...restockForm, cost: formatRupiah(e.target.value)})} placeholder="Opsional (Update harga)" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Supplier</label>
                  <select value={restockForm.supplierId} onChange={e => setRestockForm({...restockForm, supplierId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', cursor: 'pointer' }}>
                    <option value="">-- Tanpa Supplier --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Catatan</label>
                  <input value={restockForm.note} onChange={e => setRestockForm({...restockForm, note: e.target.value})} placeholder="Cth: Pembelian dadakan" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>
              </div>
              <button type="submit" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}><span>📥</span> Simpan Restock</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMutationV2;