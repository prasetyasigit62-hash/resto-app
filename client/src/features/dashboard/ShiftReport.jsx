import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ShiftReport = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // Format YYYY-MM

  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      const token = localStorage.getItem('resto_token');
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      try {
        const res = await fetch(`${backendUrl}/api/shifts/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setShifts(await res.json());
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || `Gagal mengambil data (Status: ${res.status}). Pastikan backend sudah direstart.`);
        }
      } catch (err) {
        toast.error("Koneksi error.");
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, []);

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // ✨ Filter data berdasarkan bulan yang dipilih
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => shift.endTime && shift.endTime.startsWith(filterMonth));
  }, [shifts, filterMonth]);

  // ✨ Hitung Rekapitulasi (Summary)
  const summaryStats = useMemo(() => {
    const totalPenjualan = filteredShifts.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
    const totalSelisih = filteredShifts.reduce((acc, curr) => acc + (curr.difference || 0), 0);
    const totalShift = filteredShifts.length;
    return { totalPenjualan, totalSelisih, totalShift };
  }, [filteredShifts]);

  // ✨ Export PDF
  const handleExportPDF = () => {
    if (filteredShifts.length === 0) {
      toast.warn("Tidak ada data untuk dibentuk laporan.");
      return;
    }
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text(`Laporan Shift Kasir - ${filterMonth}`, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Total Penjualan: Rp ${summaryStats.totalPenjualan.toLocaleString('id-ID')} | Total Selisih: Rp ${summaryStats.totalSelisih.toLocaleString('id-ID')}`, 14, 28);

    const tableColumn = ["Waktu Tutup", "Kasir", "Modal Awal", "Penjualan", "Kas In/Out", "Diharapkan", "Fisik Laci", "Selisih"];
    const tableRows = filteredShifts.map(s => [
      formatDateTime(s.endTime),
      s.username || '-',
      `Rp ${(s.startCash || 0).toLocaleString('id-ID')}`,
      `Rp ${(s.totalSales || 0).toLocaleString('id-ID')}`,
      `Rp ${((s.cashInOp || 0) - (s.cashOutOp || 0)).toLocaleString('id-ID')}`,
      `Rp ${(s.expectedCash || 0).toLocaleString('id-ID')}`,
      `Rp ${(s.endCash || 0).toLocaleString('id-ID')}`,
      (s.difference || 0) > 0 ? `+Rp ${(s.difference || 0).toLocaleString('id-ID')}` : `Rp ${(s.difference || 0).toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`Laporan_Shift_${filterMonth}.pdf`);
    toast.success("PDF berhasil diunduh!");
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>🔐 Laporan Shift Kasir</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Pantau riwayat buka-tutup kasir dan akurasi setoran tunai.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: 'var(--card-bg)', padding: '8px 15px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{fontWeight: '600', color: '#475569', fontSize: '0.9rem'}}>Bulan:</label>
              <input 
                  type="month" 
                  value={filterMonth} 
                  onChange={e => setFilterMonth(e.target.value)} 
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
          </div>
          <button onClick={handleExportPDF} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
            📑 Export PDF
          </button>
        </div>
      </div>

      {/* ✨ SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '2rem', background: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#3b82f6' }}>📅</div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Shift Bulan Ini</p>
            <h3 style={{ margin: '5px 0 0', fontSize: '1.5rem', color: '#1e293b' }}>{summaryStats.totalShift} Sesi</h3>
          </div>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '2rem', background: '#f0fdf4', padding: '10px', borderRadius: '8px', color: '#22c55e' }}>💰</div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Penjualan Shift</p>
            <h3 style={{ margin: '5px 0 0', fontSize: '1.5rem', color: '#16a34a' }}>Rp {summaryStats.totalPenjualan.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '2rem', background: summaryStats.totalSelisih < 0 ? '#fef2f2' : '#fefce8', padding: '10px', borderRadius: '8px', color: summaryStats.totalSelisih < 0 ? '#ef4444' : '#ca8a04' }}>⚖️</div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Selisih Kasir</p>
            <h3 style={{ margin: '5px 0 0', fontSize: '1.5rem', color: summaryStats.totalSelisih < 0 ? '#dc2626' : '#b45309' }}>
              {summaryStats.totalSelisih > 0 ? '+' : ''}Rp {summaryStats.totalSelisih.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>
      </div>

      {loading ? <p>Memuat data...</p> : (
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>Info Kasir & Waktu</th>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>Modal Awal</th>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>Penjualan</th>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>Kas Keluar/Masuk</th>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>Total Diharapkan</th>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>Uang Fisik (Laci)</th>
                  <th style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Selisih</th>
                </tr>
              </thead>
              <tbody>
                {filteredShifts.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Tidak ada riwayat shift pada bulan ini.</td></tr>
                ) : (
                  filteredShifts.map(shift => (
                    <tr key={shift.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>👤 {shift.username}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                          {formatDateTime(shift.startTime)} s/d<br/>{formatDateTime(shift.endTime)}
                        </div>
                      </td>
                      <td style={{ padding: '15px 20px', color: '#64748b' }}>Rp {(shift.startCash || 0).toLocaleString('id-ID')}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ color: '#10b981', fontWeight: '600' }}>Tunai: Rp {(shift.cashSales || 0).toLocaleString('id-ID')}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Non-Tunai: Rp {(shift.nonCashSales || 0).toLocaleString('id-ID')}</div>
                      </td>
                      <td style={{ padding: '15px 20px', fontSize: '0.9rem' }}>
                        <span style={{ color: '#10b981' }}>In: Rp {(shift.cashInOp || 0).toLocaleString('id-ID')}</span><br/>
                        <span style={{ color: '#ef4444' }}>Out: Rp {(shift.cashOutOp || 0).toLocaleString('id-ID')}</span>
                      </td>
                      <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#3b82f6' }}>
                        Rp {(shift.expectedCash || 0).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#1e293b' }}>
                        Rp {(shift.endCash || 0).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                        <span style={{ 
                          background: shift.difference === 0 ? '#dcfce7' : (shift.difference < 0 ? '#fee2e2' : '#fef9c3'),
                          color: shift.difference === 0 ? '#16a34a' : (shift.difference < 0 ? '#dc2626' : '#ca8a04'),
                          padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'
                        }}>
                          {shift.difference > 0 ? '+' : ''}{shift.difference.toLocaleString('id-ID')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default ShiftReport;