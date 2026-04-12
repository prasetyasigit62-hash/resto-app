import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const InventoryReport = () => {
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // Format YYYY-MM

  const fetchV2 = async (url) => {
      const token = localStorage.getItem('resto_token');
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      const res = await fetch(`${backendUrl}/api/v2${url}`, { headers: { 'Authorization': `Bearer ${token}` }});
      return res.json();
  };

  // ✨ REACT QUERY: Fetch Valuasi Aset V2
  const { data: valuationData, isLoading: loadingValuation } = useQuery({
    queryKey: ['stockValuation'],
    queryFn: () => fetchV2('/reports/stock-valuation')
  });

  // ✨ REACT QUERY: Fetch Histori Mutasi V2
  const { data: mutations = [], isLoading: loadingMutations } = useQuery({
    queryKey: ['mutations'],
    queryFn: () => fetchV2('/mutations')
  });

  // Filter histori mutasi berdasarkan bulan
  const filteredData = useMemo(() => {
    if (!mutations) return { list: [], count: 0, in: 0, out: 0 };
    
    const monthMutations = mutations.filter(m => m.createdAt && m.createdAt.startsWith(filterMonth));
    
    let totalIn = 0;
    let totalOut = 0;
    monthMutations.forEach(m => {
        if (m.qty > 0) totalIn += m.qty;
        else totalOut += Math.abs(m.qty);
    });

    return { list: monthMutations, count: monthMutations.length, in: totalIn, out: totalOut };
  }, [mutations, filterMonth]);

  const isLoading = loadingValuation || loadingMutations;

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>📈 Valuasi & Laporan Stok</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Pantau nilai aset bahan baku dan histori pergerakan stok per bulan.</p>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{fontWeight: '600', color: '#475569', fontSize: '0.9rem', marginLeft: '5px'}}>Pilih Bulan:</label>
            <input 
                type="month" 
                value={filterMonth} 
                onChange={e => setFilterMonth(e.target.value)} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
        </div>
      </div>

      {loading ? <p>Memuat data laporan...</p> : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            
            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(59,130,246,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                      <h4 style={{ margin: 0, opacity: 0.9, fontSize: '1rem', fontWeight: '500' }}>Total Valuasi Aset (Saat Ini)</h4>
                      <p style={{ margin: '10px 0 0', fontSize: '2.2rem', fontWeight: '800' }}>Rp {(valuationData?.totalValue || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div style={{ fontSize: '2.5rem', opacity: 0.5 }}></div>
              </div>
              <p style={{ margin: '15px 0 0', fontSize: '0.85rem', opacity: 0.8 }}>Tersebar di seluruh cabang (berdasarkan Harga Beli Terakhir)</p>
            </div>

            <div style={{ background: 'var(--card-bg)', color: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                      <h4 style={{ margin: 0, color: '#64748b', fontSize: '1rem', fontWeight: '600' }}>Volume Mutasi Bulan Ini</h4>
                      <p style={{ margin: '10px 0 0', fontSize: '2.2rem', fontWeight: '900', color: '#0f172a' }}>{filteredData.count} <span style={{fontSize:'1rem', color:'#94a3b8', fontWeight:'bold'}}>Catatan</span></p>
                  </div>
                  <div style={{ fontSize: '2.5rem', opacity: 0.5 }}></div>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.9rem' }}>Masuk: +{filteredData.in} Porsi/Item</span>
                  <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem' }}>Keluar: -{filteredData.out} Porsi/Item</span>
              </div>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
            
            {/* Tabel Valuasi Saat Ini */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: '#eff6ff' }}>
                    <h3 style={{ margin: 0, color: '#1d4ed8', fontSize: '1.1rem' }}>Valuasi Aset Saat Ini</h3>
                </div>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {valuationData?.details?.length === 0 ? <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', margin: 0 }}>Tidak ada stok tersisa.</p> : (
                        valuationData?.details?.map((item, idx) => (
                            <div key={idx} style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{item.material}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{item.outlet}</div>
                                </div>
                                <div style={{ textAlign: 'right', flex: 1 }}>
                                    <div style={{ fontWeight: '900', color: '#0f172a' }}>Rp {item.value.toLocaleString('id-ID')}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>{item.qty} {item.unit}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Tabel Histori Mutasi */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>Buku Besar (Ledger) Mutasi Stok</h3>
                </div>
                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {filteredData.list.length === 0 ? <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', margin: 0 }}>Tidak ada aktivitas mutasi bulan ini.</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <tr><th style={{padding:'15px', color:'#64748b', fontSize:'0.85rem'}}>Tanggal</th><th style={{padding:'15px', color:'#64748b', fontSize:'0.85rem'}}>Bahan Baku</th><th style={{padding:'15px', color:'#64748b', fontSize:'0.85rem'}}>Pergerakan</th><th style={{padding:'15px', color:'#64748b', fontSize:'0.85rem'}}>Jenis Mutasi</th><th style={{padding:'15px', color:'#64748b', fontSize:'0.85rem'}}>Keterangan</th></tr>
                          </thead>
                          <tbody>
                            {filteredData.list.map(m => (
                                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '15px', fontSize: '0.85rem' }}><div style={{fontWeight:'600', color:'#334155'}}>{new Date(m.createdAt).toLocaleDateString('id-ID')}</div><div style={{color:'#94a3b8'}}>{new Date(m.createdAt).toLocaleTimeString('id-ID')}</div></td>
                                    <td style={{ padding: '15px' }}><div style={{fontWeight:'bold', color:'#0f172a'}}>{m.material?.name}</div><div style={{fontSize:'0.75rem', color:'#64748b'}}>{m.outlet?.name}</div></td>
                                    <td style={{ padding: '15px', fontWeight: '900', color: m.qty > 0 ? '#10b981' : '#ef4444' }}>{m.qty > 0 ? '+' : ''}{m.qty} {m.material?.unit}</td>
                                    <td style={{ padding: '15px' }}><span style={{background: m.qty > 0 ? '#dcfce7' : '#fee2e2', color: m.qty > 0 ? '#16a34a' : '#dc2626', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold'}}>{m.type}</span></td>
                                    <td style={{ padding: '15px', fontSize: '0.85rem', color: '#475569' }}>{m.reference ? `Ref: ${m.reference} - ` : ''}{m.note}</td>
                                </tr>
                            ))}
                          </tbody>
                        </table>
                    )}
                </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default InventoryReport;