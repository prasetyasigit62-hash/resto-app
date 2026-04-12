import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { QRCodeCanvas } from 'qrcode.react'; // Menggunakan named export yang benar

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      const token = localStorage.getItem('resto_token');
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      try {
        const res = await fetch(`${backendUrl}/api/tables`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setTables(await res.json());
        } else {
          toast.error("Gagal mengambil data meja.");
        }
      } catch (err) {
        toast.error("Koneksi error.");
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const selfOrderBaseUrl = window.location.origin;

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    let content = `
      <html>
        <head>
          <title>QR Code Semua Meja</title>
          <style>
            body { font-family: sans-serif; }
            .page { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px 20px; padding: 20px; }
            .qr-card { border: 2px solid #000; border-radius: 10px; padding: 15px; text-align: center; page-break-inside: avoid; }
            h3 { margin: 0 0 10px 0; font-size: 1.5rem; }
            p { margin-top: 5px; font-weight: 500; }
            @media print { .page { page-break-after: always; } }
          </style>
        </head>
        <body><div class="page">
    `;

    tables.forEach((table) => {
      const canvas = document.getElementById(`qr-${table.id}`);
      if (!canvas) return;
      const qrDataUrl = canvas.toDataURL();
      content += `
        <div class="qr-card">
          <h3>${table.name}</h3>
          <img src="${qrDataUrl}" alt="QR Code for ${table.name}" width="150" height="150" />
          <p>Scan untuk Pesan</p>
        </div>
      `;
    });

    content += `</div></body></html>`;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Manajemen Meja & QR Code</h2>
          <p style={{ color: 'var(--text-muted)' }}>Generate QR code untuk fitur Self-Order pelanggan.</p>
        </div>
        <button onClick={handlePrintAll} disabled={tables.length === 0} className="profile-save-btn">
          🖨️ Cetak Semua QR
        </button>
      </div>

      {loading ? <p>Memuat data meja...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {tables.map(table => (
            <div key={table.id} style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <h3 style={{ marginTop: 0, fontSize: '1.2rem' }}>{table.name}</h3>
              <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>
                <QRCodeCanvas
                  id={`qr-${table.id}`}
                  value={`${selfOrderBaseUrl}/order/${table.id}`}
                  size={150}
                  level={"H"}
                  includeMargin={true}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>Scan untuk memesan dari meja ini.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TableManagement;