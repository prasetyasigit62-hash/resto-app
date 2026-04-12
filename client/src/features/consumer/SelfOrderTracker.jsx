import React from 'react';

const SelfOrderTracker = ({ activeOrderId, orderStatus }) => {
  if (!activeOrderId || !orderStatus) return null;

  const getStatusDisplay = () => {
    if (orderStatus === 'Need_Confirmation') return { text: 'Menunggu Konfirmasi Kasir', color: '#f59e0b', icon: '⏳', desc: 'Pesanan Anda sudah masuk. Kasir akan segera memprosesnya.' };
    if (orderStatus === 'Pending') return { text: 'Pesanan Masuk Antrean Dapur', color: '#3b82f6', icon: '📝', desc: 'Kasir telah mengkonfirmasi, pesanan diteruskan ke dapur.' };
    if (orderStatus === 'Processed') return { text: 'Sedang Dimasak Koki', color: '#8b5cf6', icon: '👨‍🍳', desc: 'Harap tunggu sebentar, koki sedang menyiapkan pesanan.' };
    if (orderStatus === 'Completed') return { text: 'Siap Disajikan!', color: '#10b981', icon: '🛎️' };
    if (orderStatus === 'Cancelled') return { text: 'Pesanan Dibatalkan', color: '#ef4444', icon: '❌' };
    return { text: '', color: 'transparent', icon: '' };
  };

  const trackInfo = getStatusDisplay();

  return (
    <div style={{ background: trackInfo.color, color: 'white', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', animation: 'scaleIn 0.4s ease-out', maxWidth: '800px', margin: '0 auto 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}><div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{trackInfo.icon} {trackInfo.text}</div><div style={{ fontSize: '1rem', opacity: 0.9, background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '8px' }}>#{activeOrderId}</div></div>
      <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>{trackInfo.desc}</div>
    </div>
  );
};
export default SelfOrderTracker;