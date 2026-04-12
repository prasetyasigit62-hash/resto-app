import React, { useState, useEffect } from 'react';

const CustomerPortal = ({ user, onLogout }) => {
    const [greeting, setGreeting] = useState('Selamat Datang');
    const [currentPromoIdx, setCurrentPromoIdx] = useState(0);

    // Mengatur sapaan berdasarkan waktu lokal
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 11) setGreeting('Selamat Pagi');
        else if (hour < 15) setGreeting('Selamat Siang');
        else if (hour < 18) setGreeting('Selamat Sore');
        else setGreeting('Selamat Malam');
    }, []);

    // Promo Banner Simulasi (Cross-Selling Ekosistem)
    const promos = [
        { id: 1, title: 'Diskon 50% Fine Dining', subtitle: 'Khusus pengguna baru Superapp di Resto Bintang 5', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80', color: '#f59e0b' },
        { id: 2, title: 'Staycation Hemat', subtitle: 'Cashback 20% booking kamar hotel akhir pekan ini', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', color: '#3b82f6' },
        { id: 3, title: 'Midnight Sale Mall', subtitle: 'Tukarkan poin loyalty Anda untuk ekstra diskon', image: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=800&q=80', color: '#8b5cf6' }
    ];

    // Auto-slide promo banner
    useEffect(() => {
        const timer = setInterval(() => setCurrentPromoIdx(prev => (prev + 1) % promos.length), 4000);
        return () => clearInterval(timer);
    }, [promos.length]);

    // Modul Utama Ekosistem
    const modules = [
        { id: 'mall', name: 'Mega Mall', desc: 'Belanja, antrean virtual & reward', icon: '🏬', color: '#8b5cf6', bg: '#f3e8ff', path: '/mall-web' },
        { id: 'hotel', name: 'Super Hotel', desc: 'Reservasi kamar & layanan', icon: '🏨', color: '#3b82f6', bg: '#dbeafe', path: '/hotel-web' },
        { id: 'resto', name: 'Resto & Cafe', desc: 'Pesan makan & reservasi', icon: '🍽️', color: '#f59e0b', bg: '#fef3c7', path: '/customer' },
        { id: 'ecommerce', name: 'E-Commerce', desc: 'Belanja online praktis', icon: '🛒', color: '#10b981', bg: '#dcfce7', path: '/toko' },
        { id: 'properti', name: 'Properti', desc: 'Beli & sewa real estate', icon: '🏠', color: '#ef4444', bg: '#fee2e2', path: '/properti-web' },
        { id: 'tiket', name: 'Tiket & Event', desc: 'Bioskop, konser & atraksi', icon: '🎟️', color: '#ec4899', bg: '#fdf2f8', path: '/mall-web?tab=ticketing' }
    ];

    // Aksi Cepat (Quick Actions)
    const quickActions = [
        { icon: '📷', label: 'Scan QR', action: () => alert('Fitur Scan QR Universal akan mengarahkan ke kamera.') },
        { icon: '💳', label: 'Top Up', action: () => alert('Menuju halaman Top Up Saldo Dompet Digital.') },
        { icon: '🎟️', label: 'Voucher', action: () => alert('Melihat koleksi voucher Anda.') },
        { icon: '📜', label: 'Riwayat', action: () => alert('Melihat riwayat transaksi semua layanan.') }
    ];

    // Rekomendasi Spesial (Untuk memenuhi layout bawah)
    const recommendations = [
        { id: 1, title: 'Kopi Sultan Promo', desc: 'Cashback 50% pakai E-Wallet Mall di Food Court.', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=400&q=80' },
        { id: 2, title: 'Nonton Bioskop Nyaman', desc: 'Beli 1 Gratis 1 Tiket Premiere XXI Superapp Mall.', image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=400&q=80' },
        { id: 3, title: 'Flash Sale Hotel', desc: 'Kamar Superior cuma Rp 399rb khusus malam ini!', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80' }
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
                
                .portal-root { min-height: 100vh; background: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; color: #0f172a; padding-bottom: 60px; }
                
                /* Header / Top App Bar */
                .portal-header { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); padding: 15px 5%; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 50; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
                .brand-logo { background: linear-gradient(135deg, #4f46e5, #8b5cf6); color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.5rem; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); }
                
                /* Main Container */
                .portal-container { max-width: 1200px; margin: 0 auto; padding: 30px 20px; }
                
                /* Top Grid Layout */
                .top-dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 30px; margin-bottom: 40px; }
                @media (min-width: 960px) {
                    .top-dashboard-grid { grid-template-columns: 1.2fr 1fr; }
                }
                .dashboard-left { display: flex; flex-direction: column; gap: 20px; }
                .dashboard-right { display: flex; flex-direction: column; height: 100%; }
                
                /* Greeting & Profile Card */
                .greeting-section { animation: slideDown 0.5s ease-out; }
                .greeting-text { font-size: 1.6rem; font-weight: 900; margin: 0 0 5px 0; color: #1e293b; }
                .greeting-sub { color: #64748b; margin: 0; font-weight: 500; }
                
                .loyalty-card { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; border-radius: 24px; padding: 25px; margin-top: 15px; box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.3); position: relative; overflow: hidden; display: flex; justify-content: space-between; align-items: center; }
                .loyalty-card::before { content: ''; position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%; filter: blur(20px); }
                .loyalty-tier { background: linear-gradient(135deg, #fbbf24, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: 1.1rem; letter-spacing: 1px; }
                
                /* Quick Actions */
                .quick-actions { display: flex; justify-content: space-between; gap: 15px; background: white; padding: 20px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
                .action-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.2s; border: none; background: none; flex: 1; }
                .action-btn:hover { transform: translateY(-3px); }
                .action-icon { width: 50px; height: 50px; background: #f1f5f9; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; transition: background 0.2s; }
                .action-btn:hover .action-icon { background: #e0e7ff; color: #4f46e5; }
                .action-label { font-size: 0.8rem; font-weight: 700; color: #475569; }

                /* Promo Slider */
                .promo-slider { position: relative; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 30px rgba(0,0,0,0.08); cursor: pointer; flex: 1; min-height: 220px; }
                .promo-slide { position: absolute; inset: 0; background-size: cover; background-position: center; transition: opacity 0.8s ease-in-out; display: flex; flex-direction: column; justify-content: flex-end; padding: 25px; color: white; }
                .promo-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%); z-index: 1; }
                .promo-content { position: relative; z-index: 2; }
                .promo-badge { display: inline-block; background: #ef4444; color: white; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; margin-bottom: 8px; letter-spacing: 1px; }
                
                /* Modules Grid */
                .section-title { font-size: 1.5rem; font-weight: 900; color: #1e293b; margin: 0 0 20px 0; }
                .modules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 40px; }
                .module-card { background: white; border-radius: 20px; padding: 20px; border: 1px solid #f1f5f9; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 15px; text-decoration: none; position: relative; overflow: hidden; }
                .module-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.05); border-color: #cbd5e1; }
                .module-icon-box { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0; }
                .module-info h3 { margin: 0 0 4px 0; font-size: 1.1rem; font-weight: 800; color: #1e293b; }
                .module-info p { margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.4; }
                .module-arrow { position: absolute; right: 20px; color: #cbd5e1; font-size: 1.2rem; transition: transform 0.3s; opacity: 0; }
                .module-card:hover .module-arrow { transform: translateX(5px); opacity: 1; color: var(--color); }

                /* Recommendations Section */
                .explore-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                .explore-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; cursor: pointer; transition: transform 0.3s; display: flex; flex-direction: column; }
                .explore-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08); border-color: #e2e8f0; }
                .explore-img { height: 160px; background-size: cover; background-position: center; }
                .explore-body { padding: 20px; }
                .explore-body h4 { margin: 0 0 5px 0; font-size: 1.1rem; font-weight: 800; color: #1e293b; }
                .explore-body p { margin: 0; font-size: 0.9rem; color: #64748b; line-height: 1.5; }

                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <div className="portal-root">
                {/* Header Navbar */}
                <header className="portal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="brand-logo">S</div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#1e293b', letterSpacing: '-0.5px' }}>Super<span style={{ color: '#4f46e5' }}>app</span></h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={onLogout} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fecaca'} onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}>
                            Keluar
                        </button>
                    </div>
                </header>

                <main className="portal-container">
                    <div className="top-dashboard-grid">
                        {/* Left Column: Profile & Actions */}
                        <div className="dashboard-left">
                            <div className="greeting-section">
                                <h2 className="greeting-text">{greeting}, {user.username}!</h2>
                                <p className="greeting-sub">Mau menjelajah ke mana hari ini?</p>
                                
                                <div className="loyalty-card">
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Superapp Member</div>
                                        <div className="loyalty-tier">GOLD TIER</div>
                                        <div style={{ marginTop: '15px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                            <span style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: 1 }}>{user.points || '0'}</span>
                                            <span style={{ fontSize: '0.9rem', color: '#94a3b8', paddingBottom: '3px', fontWeight: 'bold' }}>Poin</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                            👑
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="quick-actions" style={{ animation: 'fadeUp 0.6s ease-out forwards' }}>
                                {quickActions.map((action, idx) => (
                                    <button key={idx} className="action-btn" onClick={action.action}>
                                        <div className="action-icon">{action.icon}</div>
                                        <span className="action-label">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Right Column: Promo Slider */}
                        <div className="dashboard-right">
                            <div className="promo-slider" style={{ animation: 'fadeUp 0.7s ease-out forwards' }}>
                                {promos.map((promo, idx) => (
                                    <div key={promo.id} className="promo-slide" style={{ backgroundImage: `url(${promo.image})`, opacity: idx === currentPromoIdx ? 1 : 0, zIndex: idx === currentPromoIdx ? 1 : 0 }}>
                                        <div className="promo-overlay"></div>
                                        <div className="promo-content">
                                            <span className="promo-badge">PENAWARAN SPESIAL</span>
                                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: '900' }}>{promo.title}</h3>
                                            <p style={{ margin: 0, fontSize: '1rem', color: '#e2e8f0' }}>{promo.subtitle}</p>
                                        </div>
                                    </div>
                                ))}
                                {/* Slider Indicators */}
                                <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, display: 'flex', gap: '6px' }}>
                                    {promos.map((_, idx) => (
                                        <div key={idx} style={{ width: idx === currentPromoIdx ? '18px' : '8px', height: '8px', borderRadius: '4px', background: 'white', opacity: idx === currentPromoIdx ? 1 : 0.5, transition: 'all 0.3s' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Main Modules / Layanan Ekosistem */}
                    <div style={{ animation: 'fadeUp 0.8s ease-out forwards' }}>
                        <h3 className="section-title">Layanan Ekosistem</h3>
                        <div className="modules-grid">
                            {modules.map((m) => (
                                <a 
                                    key={m.id} 
                                    href={m.path} 
                                    className="module-card"
                                    style={{ '--color': m.color }}
                                >
                                    <div className="module-icon-box" style={{ background: m.bg, color: m.color }}>
                                        {m.icon}
                                    </div>
                                    <div className="module-info">
                                        <h3>{m.name}</h3>
                                        <p>{m.desc}</p>
                                    </div>
                                    <div className="module-arrow">&rarr;</div>
                                </a>
                            ))}
                        </div>
                    </div>
                    
                    {/* Section 3: Extra Content (Recommendations) */}
                    <div style={{ animation: 'fadeUp 0.9s ease-out forwards' }}>
                        <h3 className="section-title">Rekomendasi Spesial</h3>
                        <div className="explore-grid">
                            {recommendations.map(rec => (
                                <div key={rec.id} className="explore-card" onClick={() => alert('Menuju detail promo!')}>
                                    <div className="explore-img" style={{ backgroundImage: `url(${rec.image})` }}></div>
                                    <div className="explore-body">
                                        <h4>{rec.title}</h4>
                                        <p>{rec.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mini Footer */}
                    <div style={{ textAlign: 'center', marginTop: '60px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500', animation: 'fadeUp 1s ease-out forwards' }}>
                        &copy; {new Date().getFullYear()} Superapp Ecosystem.
                    </div>
                </main>
            </div>
        </>
    );
};

export default CustomerPortal;