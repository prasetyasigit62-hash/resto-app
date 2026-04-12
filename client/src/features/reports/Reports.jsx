import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useReports } from './useReports';

const Reports = () => {
  const { loading, filter, setFilter, salesTrendData, topProductsData, totalRevenue, totalOrders } = useReports();

  return (
    <div className="service-view" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Laporan & Analitik</h2>
        <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Analisis mendalam mengenai performa penjualan dan operasional.</p>
      </div>

      {/* Filter Section */}
      <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Rentang Tanggal</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <input type="date" value={filter.startDate} onChange={e => setFilter({...filter, startDate: e.target.value})} className="search-input" />
            <input type="date" value={filter.endDate} onChange={e => setFilter({...filter, endDate: e.target.value})} className="search-input" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#4f46e5', color: 'white', padding: '25px', borderRadius: '16px' }}>
          <h4 style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>Total Pendapatan</h4>
          <p style={{ margin: '5px 0 0', fontSize: '2rem', fontWeight: '800' }}>Rp {totalRevenue.toLocaleString('id-ID')}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '25px', borderRadius: '16px' }}>
          <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Total Pesanan Selesai</h4>
          <p style={{ margin: '5px 0 0', fontSize: '2rem', fontWeight: '800', color: '#1e293b' }}>{totalOrders}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
        {/* Sales Trend Chart */}
        <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', height: '400px' }}>
          <h3 style={{ margin: '0 0 25px 0', fontSize: '1.2rem', fontWeight: '700' }}>Tren Pendapatan</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" fontSize={12} tick={{ fill: '#64748b' }} />
              <YAxis fontSize={12} tick={{ fill: '#64748b' }} tickFormatter={(value) => `Rp${(value/1000).toLocaleString('id-ID')}k`} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }} />
              <Legend />
              <Line type="monotone" dataKey="Pendapatan" stroke="#4f46e5" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Chart */}
        <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', height: '400px' }}>
          <h3 style={{ margin: '0 0 25px 0', fontSize: '1.2rem', fontWeight: '700' }}>Produk Terlaris</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={topProductsData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: '#334155' }} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }} />
              <Bar dataKey="Terjual" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;