import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div style={{ 
      background: 'var(--card-bg)', 
      padding: '24px', 
      borderRadius: '16px', 
      border: '1px solid var(--border-color)', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '20px', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' 
  }}>
    <div style={{ fontSize: '2.5rem', background: color.bg, width: '70px', height: '70px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color.icon }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '600' }}>{title}</p>
      <h3 style={{ margin: '5px 0', fontSize: '1.8rem', color: '#1e293b', fontWeight: '800' }}>{value}</h3>
      {subtitle && <p style={{ margin: 0, color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>{subtitle}</p>}
    </div>
  </div>
);

const DashboardV2 = ({ user, notifications = [], activeOutletId }) => {
  const { data, isLoading, error } = useQuery({
      queryKey: ['dashboardKpi', activeOutletId], // React Query akan otomatis refetch jika ID Cabang berubah
      queryFn: async () => {
          const token = localStorage.getItem('resto_token');
          
          const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
          // ✨ Kirimkan filter cabang spesifik ke Backend
          let url = `${backendUrl}/api/v2/dashboard/kpi`;
          if (activeOutletId && activeOutletId !== 'ALL') url += `?outletId=${activeOutletId}`;
          
          const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }});
          if (!res.ok) throw new Error('Gagal mengambil KPI dari Server');
          return res.json();
      },
      refetchInterval: 15000
  });

  // Ambil data user dengan aman
  const currentUser = user || (() => {
    try {
      const savedUser = localStorage.getItem('superapp_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) { return null; }
  })();

  return (
    <div className="service-view">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0' }}>
            👋 Halo, {currentUser?.username || 'Owner'}!
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '1.1rem' }}>Berikut adalah ringkasan performa restoran Anda hari ini.</p>
        </div>
        <div style={{ textAlign: 'right', background: 'var(--card-bg)', padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1rem', color: '#3b82f6', fontWeight: 'bold' }}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>⏳ Memuat Analitik Real-Time...</div>
      ) : error ? (
          <div style={{ padding: '20px', color: '#ef4444', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>⚠️ Error: {error.message}</div>
      ) : (
        <>
      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard title="Omzet Hari Ini" value={`Rp ${data?.omzetToday?.toLocaleString('id-ID') || 0}`} icon="💰" color={{ bg: '#ecfdf5', icon: '#10b981' }} subtitle="Real-time POS" />
        <StatCard title="Menu Terlaris" value={data?.topSelling?.[0]?.menu || '-'} icon="🏆" color={{ bg: '#eff6ff', icon: '#3b82f6' }} subtitle={`${data?.topSelling?.[0]?.qty || 0} Porsi Terjual`} />
        <StatCard title="Status Stok (BOM)" value={data?.criticalStocks?.length > 0 ? `${data.criticalStocks.length} Kritis` : 'Aman'} icon="📦" color={{ bg: data?.criticalStocks?.length > 0 ? '#fef2f2' : '#f0fdf4', icon: data?.criticalStocks?.length > 0 ? '#ef4444' : '#16a34a' }} subtitle={data?.criticalStocks?.length > 0 ? 'Butuh Restock' : 'Terkendali'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* CHART OMZET */}
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b' }}>📈 Tren Omzet 7 Hari Terakhir</h3>
          <div style={{ height: '300px' }}>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.salesChart || []}>
                    <defs>
                        <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `Rp ${(v/1000).toFixed(0)}k`} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} width={80}/>
                    <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} cursor={{fill: '#f1f5f9'}} />
                    <Area type="monotone" dataKey="omzet" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOmzet)" name="Omzet Harian" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b' }}>🔔 Notifikasi Real-Time</h3>
          {notifications && notifications.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notifications.slice(0, 5).map(notif => (
                <li key={notif.id} style={{ padding: '15px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <strong style={{ color: 'var(--primary-color)' }}>[{notif.service}]</strong> {notif.message}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {new Date(notif.timestamp).toLocaleString('id-ID')}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tidak ada aktivitas atau pesanan baru hari ini.</p>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default DashboardV2;