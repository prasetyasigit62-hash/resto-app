import React, { useMemo } from 'react';

const cardStyles = {
  card: { background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s ease-in-out' },
  iconWrapper: { fontSize: '2rem', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  textWrapper: {},
  title: { margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' },
  value: { margin: '4px 0 0', fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-color)' }
};

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div style={cardStyles.card}>
      <div style={{ ...cardStyles.iconWrapper, background: color.bg, color: color.icon }}>{icon}</div>
      <div style={cardStyles.textWrapper}>
        <p style={cardStyles.title}>{title}</p>
        <h3 style={cardStyles.value}>{value}</h3>
      </div>
    </div>
  );
};

// Tambahkan default parameter (={}) agar tidak error jika data kosong
const Dashboard = ({ data = {}, user, notifications = [] }) => {

  // PERBAIKAN: Gunakan useMemo agar sistem tidak terus-menerus melakukan parsing 
  // LocalStorage JSON pada setiap kali komponen dirender (membuat tidak lemot)
  const currentUser = useMemo(() => {
    if (user) return user;
    try {
      const savedUser = localStorage.getItem('resto_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) { return null; }
  }, [user]);

  // Ekstrak data dari semua layanan yang mungkin ada (tambahkan opsional chaining '?' agar lebih aman)
  const totalRestoran = data?.Restoran?.length || 0;

  const stats = [
    { title: 'Total Menu Tersedia', value: totalRestoran, icon: '🍔', color: { bg: '#fff7ed', icon: '#f97316' }, show: true },
  ].filter(stat => stat.show);

  return (
    <div className="service-view">
      <div style={{ marginBottom: '30px' }}>
        {/* PERBAIKAN: Gunakan currentUser untuk memanggil username */}
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>
          Selamat Datang, {currentUser?.username || 'User'}!
        </h2>
        <p style={{ color: '#64748b' }}>Berikut adalah ringkasan dari modul yang Anda kelola.</p>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {stats.length > 0 ? stats.map(stat => <StatCard key={stat.title} {...stat} />) : (
          <div style={{ background: 'var(--card-bg)', padding: '40px', borderRadius: '16px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <p>Belum ada data di modul ini. Silakan tambahkan data melalui menu 'Back Office'.</p>
          </div>
        )}
      </div>

      {/* NOTIFICATIONS & ACTIVITY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b' }}>🔔 Notifikasi Terbaru</h3>
          {notifications && notifications.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notifications.slice(0, 5).map(notif => (
                <li key={notif.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <strong style={{ color: 'var(--primary-color)' }}>[{notif.service}]</strong> {notif.message}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(notif.timestamp).toLocaleString('id-ID')}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Tidak ada notifikasi baru.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;