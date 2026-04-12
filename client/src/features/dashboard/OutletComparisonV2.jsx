import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

const fetchV2 = async (url) => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    const res = await fetch(`${backendUrl}/api/v2${url}`, { headers: { 'Authorization': `Bearer ${token}` }});
    return res.json();
};

const OutletComparisonV2 = () => {
  const [filterDates, setFilterDates] = useState({ start: '', end: '' });
  
  const { data: comparisonData = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['outletsComparison', filterDates],
    queryFn: async () => {
      let url = '/reports/outlets-comparison';
      if (filterDates.start && filterDates.end) {
         url += `?startDate=${filterDates.start}&endDate=${filterDates.end}`;
      }
      return fetchV2(url);
    }
  });

  if (isError) toast.error('Gagal mengambil data komparasi outlet.');

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', margin: '0 0 5px 0' }}>📈 Komparasi Kinerja Cabang</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Bandingkan omzet dan volume transaksi antar outlet.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', background: 'var(--card-bg)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
           <input type="date" value={filterDates.start} onChange={e => setFilterDates({...filterDates, start: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
           <span style={{ alignSelf: 'center' }}>-</span>
           <input type="date" value={filterDates.end} onChange={e => setFilterDates({...filterDates, end: e.target.value})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
           <button onClick={() => refetch()} className="profile-save-btn" style={{ width: 'auto', padding: '8px 15px' }}>Filter</button>
        </div>
      </div>

      {isLoading ? <p>Mengkalkulasi kinerja cabang...</p> : (
        <div style={{ display: 'grid', gap: '30px' }}>
          {/* Chart Section */}
          <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>📊 Grafik Omzet Per Outlet</h3>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="outletName" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `Rp ${(v/1000000).toFixed(0)}M`} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value, name) => name === 'Omzet' ? `Rp ${value.toLocaleString('id-ID')}` : value} cursor={{fill: '#f1f5f9'}} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="omzet" fill="#3b82f6" name="Total Omzet (Rp)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="transactions" fill="#10b981" name="Jml Transaksi" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Section */}
          <div className="table-responsive" style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <table className="data-table">
              <thead style={{ background: '#f8fafc' }}>
                <tr><th>Peringkat</th><th>Nama Outlet</th><th style={{textAlign:'right'}}>Total Omzet</th><th style={{textAlign:'center'}}>Volume Transaksi</th><th style={{textAlign:'right'}}>Rata-rata/Trx</th></tr>
              </thead>
              <tbody>
                {comparisonData.map((o, idx) => (
                  <tr key={idx}><td><span style={{ background: idx === 0 ? '#fef08a' : (idx===1 ? '#e2e8f0' : (idx===2 ? '#ffedd5' : 'transparent')), padding: '4px 10px', borderRadius: '50%', fontWeight: 'bold' }}>#{idx+1}</span></td><td style={{fontWeight: 'bold'}}>{o.outletName}</td><td style={{textAlign:'right', color: '#3b82f6', fontWeight: 'bold'}}>Rp {o.omzet.toLocaleString('id-ID')}</td><td style={{textAlign:'center'}}>{o.transactions} x</td><td style={{textAlign:'right', color: '#64748b'}}>Rp {o.avgTransaction.toLocaleString('id-ID')}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutletComparisonV2;