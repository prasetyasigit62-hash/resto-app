import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

const KitchenView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null); // ✨ State untuk loading button
  const lastOrderCountRef = useRef(0); // ✨ Pakai useRef agar tidak memicu re-render loop

  const fetchOrders = async (signal) => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/v2/orders/history`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal // AbortController signal untuk cancel saat unmount
      });
      if (res.ok) {
        const allOrders = await res.json();
        const restaurantOrders = allOrders.filter(order =>
          (order.items || []).some(item => item.service === 'Restoran') &&
          // ✨ FIX: Tambahkan 'Completed' agar pesanan yang sudah lunas ditarik juga
          ['Pending', 'Cooking', 'Ready', 'Completed'].includes(order.status)
        );
        setOrders(restaurantOrders);

        if (restaurantOrders.length > lastOrderCountRef.current) {
          if ('speechSynthesis' in window) {
            const bellSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            bellSound.play().catch(() => {});
            setTimeout(() => {
              const speech = new SpeechSynthesisUtterance("Perhatian. Pesanan baru telah masuk. Mohon segera disiapkan.");
              speech.lang = 'id-ID';
              speech.rate = 1.0;
              speech.pitch = 1.0;
              speech.volume = 1.0;
              const voices = window.speechSynthesis.getVoices();
              const googleVoice = voices.find(v => v.lang === 'id-ID' && v.name.includes('Google'));
              if (googleVoice) speech.voice = googleVoice;
              window.speechSynthesis.speak(speech);
            }, 800);
          } else {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
          }
          toast.info("🔔 Pesanan baru masuk!");
        }
        lastOrderCountRef.current = restaurantOrders.length;
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // Diabaikan: komponen unmount saat fetch berlangsung
      toast.error("Gagal memuat pesanan dapur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);

    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    const socket = io(backendUrl);
    socket.on('newOrder', () => { fetchOrders(controller.signal); });

    // Polling fallback setiap 20 detik jika socket terputus
    const pollInterval = setInterval(() => {
      if (!socket.connected) fetchOrders(controller.signal);
    }, 20000);

    return () => {
      controller.abort();
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/v2/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        toast.success(`Berhasil diproses!`);
        await fetchOrders(new AbortController().signal); // Refresh data setelah sukses
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Gagal update status pesanan dari Server.');
      }
    } catch (err) {
      toast.error('Koneksi error. Gagal update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = {
    Pending: orders.filter(o => o.status === 'Pending'),
    Cooking: orders.filter(o => o.status === 'Cooking'),
    Ready: orders.filter(o => o.status === 'Ready'),
    Completed: orders.filter(o => o.status === 'Completed'), // ✨ Kolom baru untuk pesanan selesai
  };

  const columnTitles = {
    Pending: { title: 'BARU MASUK', color: '#f39c12' },
    Cooking: { title: 'SEDANG DIMASAK', color: '#3498db' },
    Ready: { title: 'SIAP DISAJIKAN', color: '#2ecc71' },
    Completed: { title: 'SELESAI (LUNAS)', color: '#64748b' }, // ✨ Styling kolom baru (Abu-abu netral)
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>🍳 Kitchen Display</h2>
      <p style={{ color: '#64748b' }}>Tampilan pesanan real-time untuk tim dapur.</p>
      
      {loading && <p>Memuat pesanan...</p>}

      {/* ✨ FIX: Ubah grid kolom dari 3 menjadi 4 agar kolom Selesai muat */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '20px' }}>
        {Object.keys(columns).map(statusKey => (
          <div key={statusKey} style={{ backgroundColor: 'var(--bg-color)', borderRadius: '12px', padding: '15px', minHeight: '500px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 15px 0', paddingBottom: '10px', borderBottom: `3px solid ${columnTitles[statusKey].color}`, color: columnTitles[statusKey].color }}>
              {columnTitles[statusKey].title} ({columns[statusKey].length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: '5px' }}>
              {columns[statusKey].map(order => (
                <div key={order.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    {/* ✨ NEW: Display table number */}
                    {order.address && order.address.startsWith('Meja') && (
                      <span style={{ background: 'var(--primary-color)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {order.address}
                      </span>
                    )}
                    <strong style={{ color: 'var(--primary-color)' }}>{order.trackingNumber || `#${String(order.id).slice(0,8)}`}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(order.date).toLocaleTimeString('id-ID')}</span>
                  </div>
                  <div style={{ borderTop: '1px dashed #ccc', paddingTop: '10px', fontSize: '0.95rem' }}>
                    {(order.items || []).filter(i => i.service === 'Restoran').map((item, idx) => (
                      <div key={idx} style={{ marginBottom: '8px' }}>
                        - {item.name} <span style={{color:'#666', fontSize:'0.8rem', fontWeight:'bold'}}>x{item.qty}</span>
                        {item.note && (
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: '#854d0e', /* Darker yellow text for readability */
                            background: '#fefce8', /* Light yellow background */
                            border: '1px solid #fde047', /* Yellow border */
                            borderRadius: '6px', 
                            padding: '8px 10px', 
                            marginTop: '5px' 
                          }}>
                            <strong>Catatan:</strong> {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    {statusKey === 'Pending' && (
                      <button onClick={() => handleUpdateStatus(order.id, 'Cooking')} disabled={updatingId === order.id} style={{ flex: 1, padding: '8px', border:'none', borderRadius:'6px', cursor: updatingId === order.id ? 'not-allowed' : 'pointer', color:'white', background: '#3498db', fontWeight:'bold', opacity: updatingId === order.id ? 0.7 : 1 }}>
                        {updatingId === order.id ? 'Memproses...' : 'Proses Masak'}
                      </button>
                    )}
                    {statusKey === 'Cooking' && (
                      <button onClick={() => handleUpdateStatus(order.id, 'Ready')} disabled={updatingId === order.id} style={{ flex: 1, padding: '8px', border:'none', borderRadius:'6px', cursor: updatingId === order.id ? 'not-allowed' : 'pointer', color:'white', background: '#2ecc71', fontWeight:'bold', opacity: updatingId === order.id ? 0.7 : 1 }}>
                        {updatingId === order.id ? 'Menyajikan...' : 'Sajikan'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {columns[statusKey].length === 0 && <p style={{textAlign:'center', color:'#999', marginTop:'20px'}}>Tidak ada pesanan.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenView;