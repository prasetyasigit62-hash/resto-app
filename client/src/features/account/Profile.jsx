import React, { useState } from 'react';
import { toast } from 'react-toastify';

const Profile = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || 'user@resto.com', // Mock email default
    role: user?.role || 'Administrator',
    bio: user?.bio || 'Staff restoran.',
    image: user?.image || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      // Preview lokal
      setFormData({ ...formData, image: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi Format Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Format email tidak valid! (Contoh: user@email.com)');
      return;
    }

    setLoading(true);
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

    try {
      let imageUrl = formData.image;

      // 1. Upload Gambar jika ada file baru
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        const uploadRes = await fetch(`${backendUrl}/api/upload`, { method: 'POST', body: uploadData });

        if (!uploadRes.ok) throw new Error('Gagal upload gambar');
        const uploadJson = await uploadRes.json();
        imageUrl = uploadJson.imageUrl;
      }

      // 2. Update Profile Data ke Backend
      const token = localStorage.getItem('resto_token');
      const res = await fetch(`${backendUrl}/api/users/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, image: imageUrl })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Profil berhasil disimpan!');
        onUpdateUser(data.user); // Update state global di App.jsx
      } else {
        toast.error(data.error || 'Gagal update profil');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-color)', marginBottom: '8px' }}>Profil Pengguna</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>Kelola informasi identitas dan foto akun Anda.</p>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Kiri: Card Profile (Banner + Avatar) */}
        <div style={{ flex: '1', minWidth: '300px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
           {/* Banner Ala Restoran (Warm Gradient) */}
           <div style={{ height: '120px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}></div>
           
           <div style={{ padding: '0 20px 30px', textAlign: 'center', marginTop: '-60px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                 <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--card-bg)', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', fontWeight: 'bold', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {formData.image ? <img src={formData.image} alt="Avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : formData.username.charAt(0).toUpperCase()}
                 </div>
                 <label style={{ position: 'absolute', bottom: '5px', right: '0', background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }} title="Ganti Foto" onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    📷
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                 </label>
              </div>
              
              <h3 style={{ margin: '15px 0 5px', fontSize: '1.5rem', color: 'var(--text-color)', fontWeight: '800' }}>{formData.username}</h3>
              <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px 16px', borderRadius: '20px', display: 'inline-block', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{formData.role}</div>
           </div>
        </div>

        {/* Kanan: Form Details */}
        <div style={{ flex: '2.5', minWidth: '300px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
           <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: 'var(--text-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📝</span> Informasi Pribadi
           </h3>
           <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '20px' }}>
                 <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)' }}>Username (ID Sistem)</label>
                    <input type="text" name="username" value={formData.username} disabled style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-muted)', fontSize: '0.95rem', cursor: 'not-allowed', boxSizing: 'border-box', opacity: 0.7 }} />
                    <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Username bersifat unik dan tidak dapat diubah.</p>
                 </div>
                 <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)' }}>Alamat Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@restoran.com" style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-color)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                 </div>
                 <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-color)' }}>Biografi / Catatan Pegawai</label>
                    <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Ceritakan sedikit tentang tugas Anda di restoran ini..." style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-color)', fontSize: '0.95rem', outline: 'none', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}></textarea>
                 </div>
              </div>
              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                 <button type="submit" disabled={loading} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)' }}>
                    {loading ? 'Menyimpan...' : '💾 Simpan Profil'}
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;