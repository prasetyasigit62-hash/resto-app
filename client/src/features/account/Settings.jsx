import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Settings = ({ user, onUpdateUser }) => {
  const [passwords, setPasswords] = useState({
    current: '',
    newPassword: '',
    confirmPassword: ''
  });
  // ✨ NEW: State untuk Pengaturan Toko
  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    receiptFooter: '',
    taxPercentage: 0,
    serviceChargePercentage: 0,
    primaryColor: '#4f46e5', // ✨ Default Color
    shrinkageTolerance: 5 // ✨ Parameter Pemakluman Fraud
  });
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // ✨ Fetch Settings saat load
  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('resto_token');
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      try {
        const res = await fetch(`${backendUrl}/api/settings/store`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setStoreSettings(await res.json());
        }
      } catch (err) { console.error(err); }
    };
    fetchSettings();
  }, []);

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (passwords.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter!');
      setLoading(false);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok!');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('resto_token');
      const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
      const res = await fetch(`${backendUrl}/api/users/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(passwords)
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Password berhasil diubah!');
        setPasswords({ current: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error || 'Gagal mengubah password.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  // ✨ Handler Simpan Pengaturan Toko
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    
    // ✨ FIX: Bersihkan payload untuk memastikan hanya 6 pengaturan utama yang dikirim dan tersimpan di DB
    const payload = {
      storeName: storeSettings.storeName || '',
      storeAddress: storeSettings.storeAddress || '',
      storePhone: storeSettings.storePhone || '',
      receiptFooter: storeSettings.receiptFooter || '',
      taxPercentage: Number(storeSettings.taxPercentage || 0),
      serviceChargePercentage: Number(storeSettings.serviceChargePercentage || 0),
      primaryColor: storeSettings.primaryColor || '#4f46e5',
      shrinkageTolerance: Number(storeSettings.shrinkageTolerance || 5)
    };

    try {
      const res = await fetch(`${backendUrl}/api/settings/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Konfigurasi toko berhasil disimpan!');
        // ✨ SUNTIKKAN WARNA BARU KE SELURUH APLIKASI SECARA INSTAN
        document.documentElement.style.setProperty('--primary-color', payload.primaryColor);
        document.documentElement.style.setProperty('--primary-hover', payload.primaryColor + 'E6');
      } else {
        toast.error('Gagal menyimpan konfigurasi.');
      }
    } catch (err) { toast.error('Error koneksi.'); }
    finally { setSavingSettings(false); }
  };

  // Handler Backup
  const handleBackup = async () => {
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const response = await fetch(`${backendUrl}/api/system/backup`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `superapp_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Backup berhasil didownload!');
      } else { toast.error('Gagal melakukan backup.'); }
    } catch (err) { toast.error('Terjadi kesalahan koneksi.'); }
  };

  // Handler Restore
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const jsonData = JSON.parse(evt.target.result);
        const token = localStorage.getItem('resto_token');
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
        const res = await fetch(`${backendUrl}/api/system/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(jsonData)
        });
        if (res.ok) { toast.success('Database berhasil direstore! Halaman akan dimuat ulang.'); setTimeout(() => window.location.reload(), 2000); }
        else { toast.error('Gagal restore database.'); }
      } catch (err) { toast.error('File backup tidak valid.'); }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-color)', marginBottom: '8px' }}>Pengaturan Akun</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>Kelola konfigurasi sistem dan keamanan akun.</p>
      </div>

      {/* ✨ BAGIAN PENGATURAN TOKO (Hanya Admin) */}
      {user && ['admin', 'superadmin', 'OWNER', 'ADMIN'].includes(String(user.role).toUpperCase()) && (
        <div style={{ 
          background: 'var(--card-bg)', 
          borderRadius: '16px', 
          padding: '30px', 
          border: '1px solid var(--border-color)', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          marginBottom: '30px'
        }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '25px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🏪 Konfigurasi Restoran
                </h3>
                <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Atur informasi yang akan tampil pada struk dan perhitungan pajak.</p>
            </div>

            <form onSubmit={handleSaveSettings}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                    <div>
                        <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)'}}>Nama Restoran</label>
                        <input type="text" className="profile-input" value={storeSettings.storeName} onChange={e => setStoreSettings({...storeSettings, storeName: e.target.value})} required placeholder="Contoh: Superapp Resto" />
                    </div>
                    <div>
                        <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)'}}>Nomor Telepon</label>
                        <input type="text" className="profile-input" value={storeSettings.storePhone} onChange={e => setStoreSettings({...storeSettings, storePhone: e.target.value})} placeholder="021-xxxx-xxxx" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)'}}>Alamat Lengkap</label>
                        <input type="text" className="profile-input" value={storeSettings.storeAddress} onChange={e => setStoreSettings({...storeSettings, storeAddress: e.target.value})} placeholder="Alamat lengkap lokasi..." />
                    </div>
                    <div>
                        <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)'}}>Pajak / PPN (%)</label>
                        <div style={{position: 'relative'}}>
                            <input type="number" step="0.1" className="profile-input" value={storeSettings.taxPercentage} onChange={e => setStoreSettings({...storeSettings, taxPercentage: parseFloat(e.target.value)})} style={{paddingRight: '40px'}} />
                            <span style={{position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold'}}>%</span>
                        </div>
                    </div>
                    <div>
                        <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)'}}>Service Charge (%)</label>
                        <div style={{position: 'relative'}}>
                            <input type="number" step="0.1" className="profile-input" value={storeSettings.serviceChargePercentage} onChange={e => setStoreSettings({...storeSettings, serviceChargePercentage: parseFloat(e.target.value)})} style={{paddingRight: '40px'}} />
                            <span style={{position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold'}}>%</span>
                        </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)'}}>Pesan Footer Struk</label>
                        <input type="text" className="profile-input" value={storeSettings.receiptFooter} onChange={e => setStoreSettings({...storeSettings, receiptFooter: e.target.value})} placeholder="Terima kasih atas kunjungan Anda" />
                    </div>
                    
                    <div style={{ gridColumn: '1 / -1', background: '#fef2f2', padding: '15px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '800', fontSize: '0.9rem', color: '#b91c1c'}}>🚨 Toleransi Penyusutan / Pemakluman (%)</label>
                        <span style={{ fontSize: '0.8rem', color: '#7f1d1d', display: 'block', marginBottom: '10px' }}>Batas wajar barang hilang/susut sebelum sistem mendeteksinya sebagai indikasi FRAUD atau Kecolongan.</span>
                        <div style={{position: 'relative', width: '150px'}}>
                            <input type="number" step="0.1" className="profile-input" value={storeSettings.shrinkageTolerance} onChange={e => setStoreSettings({...storeSettings, shrinkageTolerance: parseFloat(e.target.value)})} style={{paddingRight: '40px', background: 'white'}} />
                            <span style={{position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold'}}>%</span>
                        </div>
                    </div>
                    
                    {/* ✨ COLOR PICKER UNTUK TEMA DINAMIS */}
                    <div style={{ gridColumn: '1 / -1', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)'}}>Warna Utama Aplikasi (Theme)</label>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pilih warna identitas yang sesuai dengan merek restoran Anda.</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: 'auto' }}>
                            <input type="color" value={storeSettings.primaryColor || '#4f46e5'} onChange={e => setStoreSettings({...storeSettings, primaryColor: e.target.value})} style={{ width: '45px', height: '45px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>{storeSettings.primaryColor || '#4f46e5'}</span>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="profile-save-btn" disabled={savingSettings} style={{width: 'auto'}}>
                        {savingSettings ? 'Menyimpan...' : '💾 Simpan Konfigurasi Toko'}
                    </button>
                </div>
            </form>
        </div>
      )}

      <div style={{ 
          background: 'var(--card-bg)', 
          borderRadius: '16px', 
          padding: '30px', 
          border: '1px solid var(--border-color)', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          marginBottom: '30px'
        }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🔐 Keamanan Akun
            </h3>
            <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ganti password secara berkala untuk menjaga keamanan akun.</p>
        </div>

        <form onSubmit={handleSubmitPassword} style={{ maxWidth: '700px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)'}}>Username</label>
                <input type="text" value={user?.username || ''} disabled className="profile-input" style={{ backgroundColor: 'var(--bg-color)', opacity: 0.7 }} />
            </div>
            <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)'}}>Password Saat Ini</label>
                <input type="password" name="current" className="profile-input" value={passwords.current} onChange={handlePasswordChange} placeholder="Masukkan password lama Anda" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)'}}>Password Baru</label>
                    <input type="password" name="newPassword" className="profile-input" value={passwords.newPassword} onChange={handlePasswordChange} placeholder="Minimal 6 karakter" required />
                </div>
                <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)'}}>Konfirmasi Password Baru</label>
                    <input type="password" name="confirmPassword" className="profile-input" value={passwords.confirmPassword} onChange={handlePasswordChange} placeholder="Ulangi password baru" required />
                </div>
            </div>
          </div>
          <div style={{ marginTop: '30px' }}>
            <button type="submit" className="profile-save-btn" disabled={loading}>{loading ? 'Menyimpan...' : 'Update Password'}</button>
          </div>
        </form>
      </div>

      {/* Area Khusus Admin: System Maintenance */}
      {user && ['admin', 'superadmin', 'OWNER', 'ADMIN'].includes(String(user.role).toUpperCase()) && (
        <div style={{ 
            background: '#fff1f2', /* Light Red bg for danger zone */
            borderRadius: '16px', 
            padding: '30px', 
            border: '1px solid #fecaca', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ borderBottom: '1px solid #fecaca', paddingBottom: '20px', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
                ⚠️ System Maintenance
            </h3>
            <p style={{ margin: '5px 0 0', color: '#7f1d1d', fontSize: '0.9rem' }}>Area sensitif. Pastikan Anda tahu apa yang Anda lakukan.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button onClick={handleBackup} style={{
                background: '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              📥 Download Backup Database
            </button>
            <label style={{
                background: '#f97316', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              📤 Restore Database
              <input type="file" accept=".json" onChange={handleRestore} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;