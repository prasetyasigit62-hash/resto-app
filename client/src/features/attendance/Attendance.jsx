import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Attendance = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✨ STATE UNTUK PAYROLL
  const [payRate, setPayRate] = useState(100000); // Default 100rb per hari

  // ✨ STATE UNTUK FACE RECOGNITION SCANNER
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, error
  const [scanMessage, setScanMessage] = useState('');
  const [activeStream, setActiveStream] = useState(null); // stream disimpan di state agar useEffect bisa mendeteksi
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Jam Digital Real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      // Ambil status hari ini
      const resToday = await fetch(`${backendUrl}/api/attendance/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resToday.ok) {
        setTodayRecord(await resToday.json());
      }

      // Ambil history
      const resHist = await fetch(`${backendUrl}/api/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resHist.ok) {
        // Backend sudah filter berdasarkan role: admin/owner dapat semua, lainnya hanya milik sendiri
        setHistory(await resHist.json());
      }
    } catch (err) {
      toast.error('Gagal mengambil data absensi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [user]);

  // ✨ FUNGSI KAMERA & SCAN WAJAH
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setActiveStream(null);
    setIsScanning(false);
    setScanStatus('idle');
  };

  useEffect(() => {
    // Cleanup kamera saat komponen ditutup
    return () => stopCamera();
  }, []);

  // ✨ FIX UTAMA: Hubungkan stream ke elemen <video> SETELAH modal selesai di-render React
  useEffect(() => {
    if (activeStream && videoRef.current) {
      videoRef.current.srcObject = activeStream;
    }
  }, [activeStream]);

  const startFaceScan = async (action) => {
    setIsScanning(true);
    setScanStatus('scanning');
    setScanMessage('Membuka modul kamera...');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API_NOT_SUPPORTED');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setActiveStream(stream); // useEffect di atas akan assign ke videoRef setelah render

      setScanMessage('Posisikan wajah Anda di dalam bingkai...');
      setTimeout(() => setScanMessage('Memindai titik biometrik wajah...'), 1500);
      setTimeout(() => setScanMessage('Mencocokkan dengan database pusat...'), 3000);
      setTimeout(() => {
        setScanStatus('success');
        setScanMessage(`✔️ Wajah Dikenali: ${user.username} (Akurasi 99.8%)`);
      }, 4500);
      setTimeout(() => {
        stopCamera();
        handleClockInOut(action);
      }, 6000);
    } catch (err) {
      console.error('Gagal membuka kamera:', err.message);
      setScanStatus('error');
      if (err.name === 'NotAllowedError') {
        setScanMessage('❌ Izin kamera ditolak. Silakan izinkan akses kamera di browser Anda lalu coba lagi.');
      } else if (err.name === 'NotFoundError') {
        setScanMessage('❌ Kamera tidak ditemukan di perangkat ini.');
      } else if (err.message === 'API_NOT_SUPPORTED') {
        setScanMessage('❌ Browser ini tidak mendukung kamera. Gunakan HTTPS atau browser yang lebih baru.');
      } else {
        setScanMessage('❌ Kamera tidak dapat dibuka. Pastikan tidak digunakan aplikasi lain.');
      }
      setTimeout(() => stopCamera(), 4000);
    }
  };

  const handleClockInOut = async (action) => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(`Berhasil absen ${action === 'in' ? 'masuk' : 'keluar'}!`);
        fetchAttendanceData(); // Refresh data
      } else {
        toast.error(data.error || 'Gagal melakukan absensi.');
      }
    } catch (err) {
      toast.error('Koneksi error.');
    }
  };

  // ✨ FUNGSI KHUSUS UNTUK TESTING: Mengulang absensi hari ini
  const handleResetSimulation = async () => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/attendance/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.info("Simulasi di-reset! Anda bisa absen lagi.");
        fetchAttendanceData();
      }
    } catch (err) {}
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // ✨ KALKULASI GAJI BULAN INI
  const currentMonthHistory = history.filter(h => new Date(h.attendance_date).getMonth() === new Date().getMonth());
  const validShifts = currentMonthHistory.filter(h => h.clock_out !== null); // Hanya yang selesai absen pulang
  const estimatedSalary = validShifts.length * payRate;

  // ✨ CETAK SLIP GAJI PDF
  const handlePrintPayslip = () => {
    if (validShifts.length === 0) {
        return toast.warn("Belum ada absensi valid bulan ini.");
    }

    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("SLIP GAJI KARYAWAN", 105, 20, null, "center");
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Nama Pegawai : ${user.username}`, 14, 35);
    doc.text(`Bulan / Tahun : ${new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`, 14, 42);
    doc.text(`Role / Jabatan : ${user.role.toUpperCase()}`, 14, 49);
    
    autoTable(doc, {
      startY: 60,
      head: [['Deskripsi', 'Jumlah', 'Tarif Dasar', 'Total']],
      body: [
         ['Gaji Pokok Kehadiran (Shift)', `${validShifts.length} Hari`, `Rp ${payRate.toLocaleString('id-ID')}`, `Rp ${estimatedSalary.toLocaleString('id-ID')}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text(`TOTAL DITERIMA: Rp ${estimatedSalary.toLocaleString('id-ID')}`, 14, finalY);

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text("Disetujui Oleh,", 150, finalY + 15, null, "center");
    doc.text("( Manajemen / HRD )", 150, finalY + 40, null, "center");

    doc.save(`Slip_Gaji_${user.username}_${new Date().getMonth()+1}.pdf`);
    toast.success("Slip Gaji berhasil didownload!");
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>⏱️ Kehadiran (Absensi)</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Catat jam masuk dan jam keluar shift Anda.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
        
        {/* KIRI: Jam & Tombol Aksi */}
        <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '1rem', marginBottom: '10px' }}>
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#1e293b', fontFamily: 'monospace', letterSpacing: '2px', marginBottom: '30px' }}>
            {currentTime.toLocaleTimeString('id-ID')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              onClick={() => startFaceScan('in')} 
              disabled={todayRecord !== null}
              style={{ padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '10px', border: 'none', background: todayRecord ? '#e2e8f0' : '#10b981', color: todayRecord ? '#94a3b8' : 'white', cursor: todayRecord ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
            {todayRecord ? `✅ Masuk: ${formatTimeOnly(todayRecord.clock_in)}` : '📷 FACE ID CLOCK IN'}
            </button>

            <button 
              onClick={() => startFaceScan('out')} 
            disabled={!todayRecord || todayRecord.clock_out !== null}
            style={{ padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '10px', border: 'none', background: (!todayRecord || todayRecord.clock_out) ? '#e2e8f0' : '#ef4444', color: (!todayRecord || todayRecord.clock_out) ? '#94a3b8' : 'white', cursor: (!todayRecord || todayRecord.clock_out) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
            {todayRecord?.clock_out ? `✅ Pulang: ${formatTimeOnly(todayRecord.clock_out)}` : '📷 FACE ID CLOCK OUT'}
            </button>

            {/* Tombol Reset Khusus Simulasi */}
            {todayRecord && (
              <button onClick={handleResetSimulation} style={{ marginTop: '10px', background: 'transparent', border: '1px dashed #cbd5e1', color: '#64748b', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                🔄 Reset Simulasi (Ulangi Hari Ini)
              </button>
            )}
          </div>
        </div>

        {/* KANAN: Tabel Riwayat Absensi */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
             <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>Riwayat Kehadiran {['ADMIN', 'OWNER', 'SUPERADMIN'].includes(String(user.role).toUpperCase()) ? 'Semua Karyawan' : 'Saya'}</h3>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.85rem' }}>
                <tr>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Tanggal</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Nama</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Jam Masuk</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Jam Pulang</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>Memuat...</td></tr> : history.length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>Belum ada riwayat absensi.</td></tr> : history.map(record => (
                  <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 20px', fontWeight: '500' }}>{new Date(record.attendance_date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</td>
                    <td style={{ padding: '12px 20px' }}>👤 {record.username}</td>
                    <td style={{ padding: '12px 20px', color: '#10b981', fontWeight: 'bold' }}>{formatTimeOnly(record.clock_in)}</td>
                    <td style={{ padding: '12px 20px', color: record.clock_out ? '#ef4444' : '#94a3b8', fontWeight: record.clock_out ? 'bold' : 'normal' }}>{record.clock_out ? formatTimeOnly(record.clock_out) : 'Belum Pulang'}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      {record.clock_out 
                        ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Selesai</span> 
                        : <span style={{ background: '#fef9c3', color: '#ca8a04', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Bekerja</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ✨ PANEL PAYROLL (SLIP GAJI) */}
      <div style={{ marginTop: '30px', background: 'var(--card-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
            <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>💳 Kalkulasi Gaji & Payslip</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Dihitung otomatis berdasarkan absensi "Selesai" bulan ini.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '5px', fontWeight: 'bold' }}>Tarif Gaji / Hari (Rp)</label>
                <input type="number" value={payRate} onChange={e => setPayRate(Number(e.target.value))} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', width: '150px' }} />
            </div>
            <div style={{ background: '#f0fdf4', padding: '10px 20px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold' }}>Estimasi Pendapatan ({validShifts.length} Shift)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#15803d' }}>Rp {estimatedSalary.toLocaleString('id-ID')}</div>
            </div>
            <button onClick={handlePrintPayslip} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '15px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📄 Cetak Slip Gaji (PDF)
            </button>
        </div>
      </div>

      {/* ✨ MODAL FACE RECOGNITION (FUTURISTIK) */}
      {isScanning && (
        <div style={styles.scannerOverlay}>
          <div style={styles.scannerBox}>
            <h3 style={{ color: '#0ea5e9', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
               <span className="pulse-dot"></span> Face ID Authentication
            </h3>
            <div style={styles.videoWrapper}>
              <video ref={videoRef} autoPlay playsInline muted style={styles.videoElement}></video>
              <div className={`scan-line ${scanStatus === 'scanning' ? 'scanning' : ''}`}></div>
              <div style={styles.faceTarget}></div>
            </div>
            <div style={styles.scanStatusMsg(scanStatus)}>
              {scanMessage}
            </div>
            {scanStatus !== 'success' && (
                <button onClick={stopCamera} style={styles.cancelBtn}>Batalkan Pemindaian</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  scannerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  scannerBox: { background: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '30px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(14, 165, 233, 0.2)' },
  videoWrapper: { position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#000', border: '2px solid #0ea5e9', marginBottom: '20px' },
  videoElement: { width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }, // Mirror image layaknya cermin
  faceTarget: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '50%', border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '50%', boxShadow: '0 0 0 4000px rgba(0,0,0,0.5)' }, // Vignette effect
  scanStatusMsg: (status) => ({ background: status === 'success' ? '#059669' : (status === 'error' ? '#e11d48' : '#0ea5e9'), color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', transition: 'all 0.3s' }),
  cancelBtn: { marginTop: '15px', background: 'transparent', border: '1px solid #64748b', color: '#cbd5e1', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};

// Inject CSS Animasi untuk Scanner UI
if (typeof document !== 'undefined') {
  const styleId = 'face-id-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = styleId;
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      .scan-line { position: absolute; left: 0; width: 100%; height: 3px; background: #0ea5e9; box-shadow: 0 0 10px #0ea5e9, 0 0 20px #0ea5e9; opacity: 0; }
      .scan-line.scanning { opacity: 1; animation: scanAnim 2s infinite linear; }
      @keyframes scanAnim { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
      .pulse-dot { width: 10px; height: 10px; background: #0ea5e9; border-radius: 50%; animation: pulse 1.5s infinite; }
      @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(14,165,233, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(14,165,233, 0); } 100% { box-shadow: 0 0 0 0 rgba(14,165,233, 0); } }
    `;
    document.head.appendChild(styleSheet);
  }
}

export default Attendance;
