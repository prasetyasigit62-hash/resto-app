import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CRM = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      const token = localStorage.getItem('resto_token');
      try {
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
        const res = await fetch(`${backendUrl}/api/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setCustomers(await res.json());
      } catch (err) {
        toast.error("Gagal memuat data pelanggan");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const handleBroadcast = (customer) => {
    const text = `Halo *${customer.name}*! 👋\n\nTerima kasih telah menjadi pelanggan setia *Superapp Resto*. Kami punya penawaran spesial khusus untuk Anda!\n\nGunakan kode voucher: *SUPERSETIA20* untuk mendapatkan diskon 20% di kunjungan berikutnya.\n\nDitunggu kedatangannya ya! ✨`;
    // Konversi format nomor
    let phone = customer.phone;
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 8px 0', color: '#1e293b' }}>👑 CRM & Loyalty</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Kelola pelanggan VIP dan kirim promo WhatsApp langsung.</p>
        </div>
      </div>

      {loading ? <p>Memuat data pelanggan...</p> : (
        customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px dashed var(--border-color)', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#475569' }}>Belum ada data pelanggan</h3>
            <p style={{ margin: 0 }}>Daftarkan pelanggan baru melalui menu <b>POS / Kasir</b> saat melakukan transaksi.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Urutkan pelanggan berdasarkan poin terbanyak (Sultan) */}
            {customers.sort((a,b) => b.points - a.points).map(customer => (
              <div key={customer.id} style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                {/* Label VIP untuk Poin > 100 */}
                {customer.points > 100 && <div style={{ position: 'absolute', top: 15, right: -30, background: '#f59e0b', color: 'white', padding: '4px 30px', transform: 'rotate(45deg)', fontSize: '0.7rem', fontWeight: 'bold' }}>VIP</div>}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{customer.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>📱</span> {customer.phone}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Total Poin</span>
                  <strong style={{ color: '#10b981', fontSize: '1.2rem' }}>⭐ {customer.points}</strong>
                </div>

                <button onClick={() => handleBroadcast(customer)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#25d366', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'transform 0.2s' }}>
                  📢 Kirim Promo WA
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
export default CRM;