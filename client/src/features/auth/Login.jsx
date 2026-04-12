import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../AuthContext.jsx';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      const response = await fetch(`${backendUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await login(data);
        toast.success('Selamat datang kembali!');
      } else {
        toast.error(data.error || 'Login gagal. Periksa username/password.');
      }
    } catch (err) {
      toast.error('Gagal terhubung ke server backend.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} theme="colored" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        
        .resto-login-container { display: flex; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; background: #ffffff; }
        
        /* Kiri: Banner Visual Restoran */
        .resto-login-left { flex: 1.2; position: relative; background: url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat; display: flex; flex-direction: column; justify-content: space-between; padding: 50px; color: white; }
        .resto-login-left::before { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.9) 100%); }
        .resto-login-left-content { position: relative; z-index: 1; animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* Kanan: Form Login */
        .resto-login-right { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; background: #f8fafc; position: relative; }
        .resto-login-box { width: 100%; max-width: 400px; background: white; padding: 45px 40px; border-radius: 28px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* Form Elements */
        .resto-input-group { margin-bottom: 24px; }
        .resto-input-group label { display: block; margin-bottom: 8px; font-weight: 700; color: #334155; font-size: 0.9rem; }
        .resto-input-wrapper { position: relative; display: flex; align-items: center; }
        .resto-input-wrapper .icon { position: absolute; left: 18px; font-size: 1.2rem; color: #94a3b8; transition: color 0.3s; }
        .resto-input { width: 100%; padding: 16px 16px 16px 52px; border: 2px solid #e2e8f0; border-radius: 16px; font-size: 1rem; outline: none; transition: all 0.3s; box-sizing: border-box; background: #f8fafc; color: #1e293b; font-weight: 600; font-family: inherit; }
        .resto-input:focus { border-color: #f59e0b; background: white; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15); }
        .resto-input:focus + .icon { color: #f59e0b; }
        
        .resto-btn-submit { width: 100%; padding: 18px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 16px; font-size: 1.1rem; font-weight: 800; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4); margin-top: 10px; font-family: inherit; display: flex; justify-content: center; align-items: center; gap: 10px; }
        .resto-btn-submit:hover { transform: translateY(-3px); box-shadow: 0 15px 35px -5px rgba(245, 158, 11, 0.5); }
        .resto-btn-submit:active { transform: translateY(0); }
        .resto-btn-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; box-shadow: none; }
        
        .loading-spinner-resto { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 1s ease-in-out infinite; }
        
        /* Animations & Responsive */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 900px) {
            .resto-login-left { display: none; }
            .resto-login-right { padding: 20px; justify-content: center; }
            .resto-login-box { padding: 40px 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        }
      `}</style>

      <div className="resto-login-container">
        {/* BAGIAN KIRI: Visual Menawan */}
        <div className="resto-login-left">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '30px', fontWeight: '800', letterSpacing: '1px' }}>
              <span style={{ fontSize: '1.2rem' }}>🍽️</span> CULINARY MANAGEMENT
            </div>
          </div>
          <div className="resto-login-left-content">
            <h1 style={{ fontSize: '3.5rem', fontWeight: '900', margin: '0 0 15px', lineHeight: '1.1', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              Sistem POS & <br /><span style={{ color: '#fbbf24' }}>Manajemen Resto.</span>
            </h1>
            <p style={{ fontSize: '1.2rem', maxWidth: '85%', opacity: 0.9, lineHeight: '1.6', marginBottom: '40px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              Kelola pesanan, pantau meja, atur stok inventori dapur, hingga pembukuan keuangan restoran dengan satu platform modern yang terintegrasi penuh.
            </p>
          </div>
        </div>

        {/* BAGIAN KANAN: Form Login Modern */}
        <div className="resto-login-right">
          <div className="resto-login-box">
            <div style={{ textAlign: 'center', marginBottom: '35px' }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 20px', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)' }}>
                👨‍🍳
              </div>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>
                Masuk ke Sistem
              </h2>
              <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.95rem', fontWeight: '500', lineHeight: 1.5 }}>
                Silakan login dengan akun Anda untuk memulai shift kerja dan operasional restoran hari ini.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="resto-input-group">
                <label>Username</label>
                <div className="resto-input-wrapper">
                  <input 
                    type="text" 
                    className="resto-input" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Contoh: kasir_budi" 
                  disabled={isLoading} 
                    required 
                  />
                  <span className="icon">👤</span>
                </div>
              </div>

              <div className="resto-input-group">
                <label>Password</label>
                <div className="resto-input-wrapper">
                  <input 
                    type="password" 
                    className="resto-input" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                  disabled={isLoading} 
                    required 
                  />
                  <span className="icon">🔒</span>
                </div>
              </div>

              <button type="submit" className="resto-btn-submit" disabled={isLoading}>
                {isLoading ? (
                  <><span className="loading-spinner-resto"></span> Memproses...</>
                ) : 'Mulai Shift Kerja'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;