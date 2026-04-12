import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import api from '../../api';
import { printReceipt } from "../../utils/printReceipt";

const fetchV2 = async (url) => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    const res = await fetch(`${backendUrl}/api/v2${url}`, { headers: { 'Authorization': `Bearer ${token}` }});
    if (!res.ok) throw new Error('Network error');
    return res.json();
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const SalesReport = () => {
  // ✨ FITUR 9: Advanced Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [outletId, setOutletId] = useState('');
  const [chefId, setChefId] = useState('');

  // ✨ REACT QUERY: Fetch Master Data untuk Filter Dropdown
  const { data: outlets = [] } = useQuery({ queryKey: ['outlets'], queryFn: () => fetchV2('/outlets') });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => fetchV2('/users') });
  const chefs = users.filter(u => String(u.role).toUpperCase() === 'CHEF');

  // ✨ REACT QUERY: Fetch Data Laporan V2 dengan Filter Dinamis
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['salesReport', startDate, endDate, outletId, chefId],
    queryFn: async () => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (outletId) params.append('outletId', outletId);
        if (chefId) params.append('chefId', chefId);
        
        const { data } = await api.get(`/reports/sales?${params.toString()}`);
        return data;
    }
  });

  const reportData = useMemo(() => {
    if (!orders || orders.length === 0) return null;

    const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const totalTransactions = orders.length;
    const avgTransaction = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;
    let totalItemsSold = 0;

    const itemSales = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        const itemName = item.menu?.name || item.itemName || 'Custom Item';
        const qty = Number(item.qty || 1);
        itemSales[itemName] = (itemSales[itemName] || 0) + qty;
        totalItemsSold += qty;
      });
    });

    const topSellingItems = Object.entries(itemSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
      
    // ✨ Format data khusus untuk dibaca oleh Recharts
    const chartData = topSellingItems.map(([name, qty]) => ({
      name: name.length > 12 ? name.substring(0, 12) + '...' : name,
      terjual: qty
    }));

    return {
      totalRevenue,
      totalTransactions,
      avgTransaction,
      totalItemsSold,
      topSellingItems,
      chartData,
      pieData: chartData.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] })),
      orders,
    };
  }, [orders]);

  // ✨ FITUR 9: Export PDF
  const exportToPDF = () => {
    if (!orders || orders.length === 0) return toast.warn("Tidak ada data untuk diexport!");
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text("LAPORAN PENJUALAN RESTORAN", 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 28);
    doc.text(`Total Transaksi: ${reportData.totalTransactions} | Pendapatan: Rp ${reportData.totalRevenue.toLocaleString('id-ID')}`, 14, 34);

    const tableColumn = ["Tgl", "No. Struk", "Cabang", "Kasir", "Chef", "Metode", "Total (Rp)"];
    const tableRows = orders.map(o => [
      new Date(o.createdAt).toLocaleDateString('id-ID'),
      o.receiptNumber || o.id,
      o.outlet?.name || '-',
      o.kasir?.username || '-',
      o.chef?.username || '-',
      o.paymentMethod,
      o.total.toLocaleString('id-ID')
    ]);

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 42, theme: 'grid', styles: { fontSize: 9 }, headStyles: { fillColor: [59, 130, 246] } });
    doc.save(`Laporan_Penjualan_${startDate}_sd_${endDate}.pdf`);
    toast.success("PDF berhasil didownload!");
  };

  // ✨ FITUR 9: Export Excel (CSV)
  const exportToExcel = () => {
    if (!orders || orders.length === 0) return toast.warn("Tidak ada data untuk diexport!");
    
    const headers = ['Tanggal', 'Nomor Struk', 'Cabang', 'Kasir', 'Chef', 'Metode Bayar', 'Total Tagihan', 'Status'];
    const rows = orders.map(o => [
        `"${new Date(o.createdAt).toLocaleString('id-ID')}"`,
        `"${o.receiptNumber || o.id}"`,
        `"${o.outlet?.name || '-'}"`,
        `"${o.kasir?.username || '-'}"`,
        `"${o.chef?.username || '-'}"`,
        `"${o.paymentMethod}"`,
        o.total,
        `"${o.status}"`
    ]);

    let csvContent = "\uFEFF"; // BOM untuk UTF-8 Excel
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => { csvContent += row.join(",") + "\n"; });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Penjualan_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ fontSize: '2rem', background: 'var(--bg-color)', padding: '10px', borderRadius: '8px', color: color || 'inherit' }}>{icon}</div>
      <div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{title}</p>
        <h3 style={{ margin: '5px 0 0', fontSize: '1.5rem', color: color || 'inherit' }}>{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Laporan Penjualan Harian</h2>
          <p style={{ color: 'var(--text-muted)' }}>Ringkasan transaksi POS berdasarkan Filter V2.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
           <button onClick={exportToExcel} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
               📊 Export Excel
           </button>
           <button onClick={exportToPDF} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
               📑 Export PDF
           </button>
        </div>
        
        {/* ✨ FILTER MULTI-DIMENSI V2 */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={outletId} onChange={e => setOutletId(e.target.value)} className="search-input" style={{marginBottom: 0, padding: '8px 12px'}}>
                <option value="">🏢 Semua Cabang</option>
                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select value={chefId} onChange={e => setChefId(e.target.value)} className="search-input" style={{marginBottom: 0, padding: '8px 12px'}}>
                <option value="">👨‍🍳 Semua Chef</option>
                {chefs.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--card-bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{border: 'none', background: 'transparent', outline: 'none'}} />
                <span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>s/d</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{border: 'none', background: 'transparent', outline: 'none'}} />
            </div>
        </div>
      </div>

      {isLoading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>⏳ Mengambil Laporan Penjualan (React Query)...</p>
      ) : reportData ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <StatCard title="Total Pendapatan" value={`Rp ${reportData.totalRevenue.toLocaleString('id-ID')}`} icon="💰" color="#3b82f6" />
            <StatCard title="Rata-rata Transaksi" value={`Rp ${reportData.avgTransaction.toLocaleString('id-ID')}`} icon="💳" color="#f59e0b" />
            <StatCard title="Total Item Terjual" value={`${reportData.totalItemsSold} Porsi`} icon="🍱" color="#22c55e" />
            <StatCard title="Jumlah Transaksi" value={reportData.totalTransactions} icon="🧾" color="#64748b" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
            {/* Top Selling Items */}
            <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginTop: 0 }}>🏆 Menu Terlaris</h3>
              {reportData.topSellingItems.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ height: '250px', marginBottom: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} interval={0} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="terjual" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Porsi Terjual" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* ✨ FITUR 4: PIE CHART PROPORSIONAL */}
                  <div style={{ height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={reportData.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="terjual">
                          {reportData.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} Porsi`} />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : <p>Tidak ada penjualan.</p>}
            </div>

            {/* Recent Transactions */}
            <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginTop: 0 }}>Transaksi Terakhir</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {reportData.orders.map(order => (
                  <div key={order.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: 'var(--primary-color)' }}>{order.receiptNumber || `#${order.id}`}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleString('id-ID')}</div>
                      {order.outlet && <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', marginTop: '2px' }}>📍 {order.outlet.name}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                      <div style={{ fontWeight: 'bold' }}>Rp {order.total.toLocaleString('id-ID')}</div>
                      <button onClick={() => printReceipt(order)} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🖨️ Cetak
                      </button>
                    </div>
                  </div>
                ))}
                {reportData.orders.length === 0 && <p>Tidak ada transaksi.</p>}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ background: 'var(--card-bg)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Tidak ada data transaksi pada filter yang dipilih.</p>
        </div>
      )}
    </div>
  );
};

export default SalesReport;