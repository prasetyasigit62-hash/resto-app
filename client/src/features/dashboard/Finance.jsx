import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Finance = () => {
  const [expenses, setExpenses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState({ restockLog: [] });
  const [menuItems, setMenuItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // Format YYYY-MM
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ category: 'Listrik & Air', amount: '', description: '', date: new Date().toISOString().slice(0,10) });

  const categories = ['Listrik & Air', 'Gaji Karyawan', 'Sewa Tempat', 'Marketing & Iklan', 'Maintenance & Perbaikan', 'Lain-lain'];

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const [resExp, resOrd, resInv, resMenu, resIng] = await Promise.all([
        fetch(`${backendUrl}/api/expenses`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/inventory/logs`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/restoran`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/ingredients`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (resExp.ok) setExpenses(await resExp.json());
      if (resOrd.ok) setOrders(await resOrd.json());
      if (resInv.ok) setInventoryLogs(await resInv.json());
      if (resMenu.ok) setMenuItems(await resMenu.json());
      if (resIng.ok) setIngredients(await resIng.json());
    } catch (err) {
      toast.error('Gagal memuat data keuangan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return toast.warn("Isi nominal dan keterangan.");
    
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Pengeluaran berhasil dicatat.");
        setShowModal(false);
        setFormData({ category: 'Listrik & Air', amount: '', description: '', date: new Date().toISOString().slice(0,10) });
        fetchData();
      } else {
        toast.error("Gagal mencatat pengeluaran. Anda butuh akses Admin.");
      }
    } catch (err) { toast.error("Koneksi error."); }
  };

  // --- KALKULASI LABA RUGI (PROFIT & LOSS) ---
  const financialSummary = useMemo(() => {
    // 1. Total Pemasukan (Omzet dari Order Selesai)
    const currentOrders = orders.filter(o => 
        o.date && o.date.startsWith(filterMonth) && 
        ['Completed', 'CheckOut', 'Served'].includes(o.status)
    );
    
    let totalIncome = 0;
    let totalCOGS = 0; // HPP (Modal resep terpakai)

    currentOrders.forEach(order => {
      totalIncome += Number(order.total || 0);
      
      let itemsArr = [];
      try { itemsArr = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch(e){}
      if (!Array.isArray(itemsArr)) itemsArr = [];

      itemsArr.forEach(item => {
         if ((item.service || '').toLowerCase() === 'restoran' && !item.isCustom) {
             const menuItem = menuItems.find(m => m.id && item.id && String(m.id) === String(item.id)) || item;
             
             let itemCost = 0;
             let recipeArr = [];
             try { recipeArr = typeof menuItem.recipe === 'string' ? JSON.parse(menuItem.recipe) : menuItem.recipe; } catch(e){}
             if (!Array.isArray(recipeArr)) recipeArr = [];

             recipeArr.forEach(r => {
                 const ing = ingredients.find(i => i.id && r.ingredientId && String(i.id) === String(r.ingredientId));
                 if (ing) itemCost += Number(ing.cost || 0) * Number(r.qty || 0);
             });
             totalCOGS += itemCost * Number(item.qty || 1);
         }
      });
    });

    // 2. Info tambahan: Uang keluar untuk Restock (Arus Kas, bukan HPP Laba Rugi)
    const currentRestock = (inventoryLogs.restockLog || []).filter(log => log.date && log.date.startsWith(filterMonth));
    const totalBelanjaStok = currentRestock.reduce((acc, curr) => acc + Number(curr.totalSpent || 0), 0);

    // 3. Total Pengeluaran Operasional (Expenses)
    const currentExpenses = expenses.filter(e => e.date && e.date.startsWith(filterMonth));
    const totalOpEx = currentExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // 4. Laba Kotor & Laba Bersih
    const grossProfit = totalIncome - totalCOGS;
    const netProfit = grossProfit - totalOpEx;

    // ✨ FITUR 4: Kalkulasi Tren Harian untuk Grafik Advanced Analytics
    const daysInMonth = new Date(filterMonth.split('-')[0], filterMonth.split('-')[1], 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = String(i + 1).padStart(2, '0');
        const dateStr = `${filterMonth}-${day}`;
        
        const dayOrders = currentOrders.filter(o => o.date && o.date.startsWith(dateStr));
        const dayIncome = dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        
        const dayExpenses = currentExpenses.filter(e => e.date && e.date.startsWith(dateStr));
        const dayOpEx = dayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

        let dayCOGS = 0;
        dayOrders.forEach(order => {
            let itemsArr = [];
            try { itemsArr = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch(e){}
            if (!Array.isArray(itemsArr)) itemsArr = [];
            itemsArr.forEach(item => {
               if ((item.service || '').toLowerCase() === 'restoran' && !item.isCustom) {
                   const menuItem = menuItems.find(m => String(m.id) === String(item.id)) || item;
                   let itemCost = 0;
                   let recipeArr = [];
                   try { recipeArr = typeof menuItem.recipe === 'string' ? JSON.parse(menuItem.recipe) : menuItem.recipe; } catch(e){}
                   if (!Array.isArray(recipeArr)) recipeArr = [];
                   recipeArr.forEach(r => {
                       const ing = ingredients.find(i => String(i.id) === String(r.ingredientId));
                       if (ing) itemCost += Number(ing.cost || 0) * Number(r.qty || 0);
                   });
                   dayCOGS += itemCost * Number(item.qty || 1);
               }
            });
        });

        return {
            date: day,
            Pendapatan: dayIncome,
            Pengeluaran: dayOpEx + dayCOGS,
            LabaBersih: dayIncome - (dayOpEx + dayCOGS)
        };
    });

    return { totalIncome, totalCOGS, totalBelanjaStok, grossProfit, totalOpEx, netProfit, currentExpenses, dailyData };
  }, [expenses, orders, inventoryLogs, menuItems, ingredients, filterMonth]);

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>💼 Keuangan & Laba Rugi</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Pantau pendapatan, biaya bahan, dan pengeluaran operasional restoran.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <input 
                type="month" 
                value={filterMonth} 
                onChange={e => setFilterMonth(e.target.value)} 
                className="profile-input" style={{ width: 'auto', marginBottom: 0 }}
            />
            <button onClick={() => setShowModal(true)} className="profile-save-btn" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>+</span> Catat Pengeluaran
            </button>
        </div>
      </div>

      {loading ? <p>Mengkalkulasi data keuangan...</p> : (
        <>
          {/* PANEL LABA RUGI (P&L STATEMENT) */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '30px', marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', color: '#0f172a' }}>📊 Ringkasan Laba Rugi (Profit & Loss)</h3>
              
              <div style={{ display: 'grid', gap: '15px', fontSize: '1.1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 'bold' }}>
                      <span>(+) Pendapatan Penjualan (Omzet)</span>
                      <span>Rp {financialSummary.totalIncome.toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                      <span>(-) Harga Pokok Penjualan (HPP Modal Bahan Terjual)</span>
                      <span>- Rp {financialSummary.totalCOGS.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '15px', fontWeight: 'bold', color: '#3b82f6', fontSize: '1.2rem' }}>
                      <span>= Laba Kotor (Gross Profit)</span>
                      <span>Rp {financialSummary.grossProfit.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', marginTop: '10px' }}>
                      <span>(-) Pengeluaran Operasional (Gaji, Listrik, dll)</span>
                      <span>- Rp {financialSummary.totalOpEx.toLocaleString('id-ID')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #cbd5e1', paddingTop: '15px', fontWeight: '900', color: financialSummary.netProfit >= 0 ? '#15803d' : '#b91c1c', fontSize: '1.5rem', marginTop: '10px' }}>
                      <span>= LABA BERSIH (NET PROFIT)</span>
                      <span>Rp {financialSummary.netProfit.toLocaleString('id-ID')}</span>
                  </div>

                  <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                      <div style={{ color: '#64748b', marginBottom: '5px' }}>ℹ️ <strong>Arus Kas Keluar untuk Beli Stok:</strong> Rp {financialSummary.totalBelanjaStok.toLocaleString('id-ID')}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4' }}>Total belanja bahan adalah "Aset Inventori" dan bukan pengeluaran mutlak Laba Rugi.</div>
                  </div>
              </div>
          </div>

          {/* ✨ FITUR 4: GRAFIK LABA RUGI HARIAN (ADVANCED ANALYTICS) */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '25px', marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>📈 Tren Keuangan Harian</h3>
              <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={financialSummary.dailyData}>
                          <defs>
                              <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={(v) => `Rp ${(v/1000000).toFixed(1)}M`} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} width={80} />
                          <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                          <Legend />
                          <Area type="monotone" dataKey="Pendapatan" fillOpacity={1} fill="url(#colorPendapatan)" stroke="#10b981" strokeWidth={3} />
                          <Bar dataKey="Pengeluaran" barSize={20} fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="LabaBersih" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />
                      </ComposedChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* TABEL PENGELUARAN */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>Daftar Pengeluaran Operasional</h3>
            </div>
            <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.85rem' }}>
                        <tr>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>Tanggal</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>Kategori</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>Keterangan</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Nominal</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Oleh</th>
                        </tr>
                    </thead>
                    <tbody>
                        {financialSummary.currentExpenses.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Belum ada pengeluaran operasional bulan ini.</td></tr>
                        ) : (
                            financialSummary.currentExpenses.map(exp => (
                                <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '15px 20px' }}>{new Date(exp.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</td>
                                    <td style={{ padding: '15px 20px' }}><span style={{background:'#fef3c7', color:'#d97706', padding:'4px 10px', borderRadius:'12px', fontSize:'0.8rem', fontWeight:'bold'}}>{exp.category}</span></td>
                                    <td style={{ padding: '15px 20px', color: '#475569' }}>{exp.description}</td>
                                    <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>Rp {exp.amount.toLocaleString('id-ID')}</td>
                                    <td style={{ padding: '15px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>{exp.recordedBy}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL INPUT PENGELUARAN */}
      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#fef2f2', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>💸</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>Catat Pengeluaran</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Beban biaya operasional restoran</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={handleSaveExpense} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Tanggal <span style={{color:'#ef4444'}}>*</span></label><input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Kategori <span style={{color:'#ef4444'}}>*</span></label><select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Nominal (Rp) <span style={{color:'#ef4444'}}>*</span></label><input type="number" required min="1000" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="Contoh: 500000" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Keterangan / Deskripsi <span style={{color:'#ef4444'}}>*</span></label><textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Contoh: Bayar listrik bulanan..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }}></textarea></div>
              <button type="submit" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}><span>📉</span> Simpan Pengeluaran</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;