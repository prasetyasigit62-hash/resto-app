import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const OrderHistory = ({ onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');
  
  // ✨ STATE PAYMENT GATEWAY SIMULATOR
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [pgOrder, setPgOrder] = useState(null);
  
  // ✨ STATE UNTUK REVIEW / ULASAN PRODUK
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const fetchOrders = async () => {
    setLoading(true);
    const token = localStorage.getItem('superapp_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const resOrders = await fetch(`${backendUrl}/api/orders/my-history`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (resOrders.ok) setOrders(await resOrders.json());
      
    } catch (err) {
      toast.error('Gagal memuat riwayat pesanan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);


  // ✨ Buka Payment Gateway Simulator
  const handlePay = (order) => {
    setPgOrder(order);
    setShowPaymentGateway(true);
  };

  // ✨ Eksekusi Webhook Payment Gateway (Simulasi dari Server Midtrans/Xendit)
  const executePaymentGateway = async (method) => {
    const token = localStorage.getItem('superapp_token'); // Dalam realita, webhook tidak butuh auth user, tapi server-to-server auth. Kita bypass saja.
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      let res;
      res = await fetch(`${backendUrl}/api/webhook/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            order_id: pgOrder.id,
            transaction_status: 'settlement' // Simulasi status lunas dari bank
        })
      });

      if (res.ok) {
        toast.success(`Pembayaran Rp ${Number(pgOrder.total).toLocaleString('id-ID')} via ${method} Berhasil!`);
        setShowPaymentGateway(false);
        fetchOrders();
      } else {
        toast.error('Transaksi ditolak oleh sistem pembayaran.');
      }
    } catch (err) {
      toast.error('Koneksi ke Payment Gateway terputus.');
    }
  };

  // ✨ FUNGSI KIRIM ULASAN BINTANG (REVIEW)
  const submitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('superapp_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
            itemId: reviewItem.id, 
            rating: reviewForm.rating, 
            comment: reviewForm.comment 
        })
      });
      if (res.ok) {
        toast.success(`Ulasan untuk ${reviewItem.name} berhasil dikirim!`);
        setShowReviewModal(false);
        setReviewForm({ rating: 5, comment: '' });
      } else { toast.error("Gagal mengirim ulasan."); }
    } catch(err) { toast.error("Koneksi terputus"); }
  };

  const tabs = ['Semua', 'Belum Bayar', 'Diproses', 'Selesai', 'Batal'];

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'Semua') return true;
    if (activeTab === 'Belum Bayar') return o.status === 'Awaiting Payment' || o.status === 'Pending';
    if (activeTab === 'Diproses') return o.status === 'Processed' || o.status === 'Cooking' || o.status === 'Ready';
    if (activeTab === 'Selesai') return o.status === 'Completed';
    if (activeTab === 'Batal') return o.status === 'Cancelled';
    return true;
  });

  return (
    <div style={{ padding: '20px 5%', maxWidth: '900px', margin: '0 auto', minHeight: '80vh', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <button onClick={onBack} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: '1.2rem' }}>&larr;</button>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Riwayat Pesanan Saya</h2>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', marginBottom: '25px', paddingBottom: '10px', scrollbarWidth: 'none' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: '30px', border: '1px solid #e2e8f0', background: activeTab === tab ? '#4f46e5' : 'white', color: activeTab === tab ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: activeTab === tab ? '0 4px 10px rgba(79, 70, 229, 0.3)' : 'none' }}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>Memuat pesanan...</p>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '4rem', marginBottom: '15px', opacity: 0.5 }}>📦</div>
          <h3 style={{ color: '#475569', margin: '0 0 5px' }}>Belum ada pesanan</h3>
          <p style={{ color: '#94a3b8', margin: 0 }}>Cari barang impianmu dan mulai belanja sekarang!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map(order => {
            let items = [];
            try { items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch(e){}
            
            return (
              <div key={order.id} style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '800', color: '#1e293b' }}>Order {order.trackingNumber || `#${String(order.id).slice(0,8)}`}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(order.date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <span style={{ 
                    color: order.status === 'Completed' ? '#16a34a' : (order.status === 'Cancelled' ? '#ef4444' : (order.status === 'Awaiting Payment' || order.status === 'Pending' ? '#ea580c' : '#4f46e5')), 
                    fontWeight: 'bold', fontSize: '0.9rem', 
                    background: order.status === 'Cancelled' ? '#fef2f2' : '#f8fafc', 
                    padding: '4px 12px', borderRadius: '12px' 
                  }}>{order.status}</span>
                </div>
                
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#f8fafc', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                      {item.image ? <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} /> : <div style={{ fontSize: '2.5rem', textAlign: 'center', lineHeight: '80px' }}>🛍️</div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.1rem', marginBottom: '4px' }}>{item.name}</div>
                      {item.variantName && <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Varian: <span style={{fontWeight:'bold'}}>{item.variantName}</span></div>}
                      <div style={{ fontSize: '0.9rem', color: '#475569' }}>{item.price} <span style={{fontWeight:'bold'}}>x{item.qty}</span></div>
                      
                      {/* Tombol Beri Ulasan Muncul Per-Produk Jika Pesanan Selesai */}
                      {order.status === 'Completed' && (
                          <button onClick={() => { setReviewItem(item); setShowReviewModal(true); }} style={{ marginTop: '10px', background: 'transparent', border: '1px solid #f59e0b', color: '#d97706', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                              ⭐ Nilai Produk
                          </button>
                      )}
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Belanja</div>
                    <div style={{ fontWeight: '900', color: '#4f46e5', fontSize: '1.3rem' }}>Rp {(Number(order.total) || 0).toLocaleString('id-ID')}</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(order.status === 'Awaiting Payment' || order.status === 'Pending') && <button onClick={() => handlePay(order)} style={{ padding: '12px 25px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}>Bayar Tagihan</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✨ PAYMENT GATEWAY SIMULATOR MODAL (MIDTRANS UI) */}
      {showPaymentGateway && pgOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeUp 0.3s ease-out' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '1.2rem', letterSpacing: '1px' }}>PAYMENT<span style={{color:'#3b82f6'}}>GATEWAY</span></div>
                <button onClick={() => setShowPaymentGateway(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 5px 0', color: '#64748b' }}>Total Tagihan (Order {pgOrder.trackingNumber || `#${String(pgOrder.id).slice(0,8)}`})</p>
                <h2 style={{ margin: '0 0 30px 0', fontSize: '2.2rem', color: '#1e293b' }}>Rp {Number(pgOrder.total).toLocaleString('id-ID')}</h2>
                
                <div style={{ display: 'grid', gap: '15px' }}>
                    <button onClick={() => executePaymentGateway('GoPay')} style={{ background: '#00a5cf', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>📱</span> Pay with GoPay</button>
                    <button onClick={() => executePaymentGateway('ShopeePay')} style={{ background: '#ee4d2d', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>🛒</span> Pay with ShopeePay</button>
                    <button onClick={() => executePaymentGateway('BCA Virtual Account')} style={{ background: '#0066ae', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>🏦</span> BCA Virtual Account</button>
                    <button onClick={() => executePaymentGateway('Credit Card')} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>💳</span> Credit / Debit Card</button>
                </div>
                <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#94a3b8' }}>Secure environment simulated by Resto-app Backend.</p>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL REVIEW / ULASAN BINTANG */}
      {showReviewModal && reviewItem && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
              <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeUp 0.3s ease-out' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, color: '#1e293b' }}>Penilaian Produk</h3>
                      <button onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                  </div>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      {reviewItem.image && <img src={reviewItem.image} alt="item" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />}
                      <div style={{ fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>{reviewItem.name} {reviewItem.variantName ? `(${reviewItem.variantName})` : ''}</div>
                  </div>
                  <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <label style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Beri Rating</label>
                      <select value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: Number(e.target.value)})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}><option value="5">⭐⭐⭐⭐⭐ (Sangat Baik)</option><option value="4">⭐⭐⭐⭐ (Baik)</option><option value="3">⭐⭐⭐ (Cukup)</option><option value="2">⭐⭐ (Kurang)</option><option value="1">⭐ (Buruk)</option></select>
                      <label style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Tulis Pengalaman Anda</label>
                      <textarea required rows="4" placeholder="Bagaimana kualitas produk ini? Apakah sesuai deskripsi?" value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'inherit' }}></textarea>
                      <button type="submit" style={{ background: '#f59e0b', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Kirim Ulasan</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default OrderHistory;