import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      const token = localStorage.getItem('resto_token');
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      try {
        const res = await fetch(`${backendUrl}/api/admin/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setReviews(await res.json());
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || "Gagal memuat ulasan.");
        }
      } catch (err) {
        toast.error("Koneksi error.");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Statistik Sederhana
  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, total: 0, stars: [0,0,0,0,0] };
    
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / total).toFixed(1);
    
    // Hitung distribusi bintang (index 0 = 1 bintang, index 4 = 5 bintang)
    const stars = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) stars[r.rating - 1]++;
    });

    return { avg, total, stars: stars.reverse() }; // Reverse agar bintang 5 di atas
  }, [reviews]);

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="service-view">
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>⭐ Ulasan Pelanggan</h2>
        <p style={{ color: '#64748b' }}>Apa kata pelanggan tentang restoran Anda.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
        
        {/* KIRI: Summary Card */}
        <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center', position: 'sticky', top: '20px' }}>
          <h3 style={{ margin: 0, color: '#64748b', fontSize: '1rem', textTransform: 'uppercase' }}>Rata-rata Rating</h3>
          <div style={{ fontSize: '4rem', fontWeight: '800', color: '#f59e0b', margin: '10px 0' }}>{stats.avg}</div>
          <div style={{ color: '#f59e0b', fontSize: '1.2rem', marginBottom: '10px' }}>{renderStars(Math.round(stats.avg))}</div>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Dari total <strong>{stats.total}</strong> ulasan</p>
          
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            {stats.stars.map((count, index) => {
              const starNum = 5 - index;
              const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={starNum} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ width: '15px' }}>{starNum}</span>
                  <span style={{ color: '#f59e0b' }}>★</span>
                  <div style={{ flex: 1, background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, background: '#f59e0b', height: '100%' }}></div>
                  </div>
                  <span style={{ width: '30px', textAlign: 'right', color: '#64748b' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* KANAN: Review List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {loading ? <p>Memuat ulasan...</p> : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: '#94a3b8' }}>Belum ada ulasan dari pelanggan.</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {review.username ? review.username.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{review.username || 'Anonymous'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(review.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div style={{ background: '#fffbeb', padding: '4px 10px', borderRadius: '20px', color: '#b45309', fontWeight: 'bold', fontSize: '0.9rem', height: 'fit-content' }}>
                    {review.rating} ★
                  </div>
                </div>
                
                <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', display: 'inline-block' }}>
                  Menu: <strong>{review.itemName}</strong>
                </div>

                <p style={{ margin: '0', lineHeight: '1.6', color: '#334155' }}>
                  "{review.comment}"
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default Reviews;