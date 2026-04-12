import React, { useState } from 'react';
import { toast } from 'react-toastify';

const Profile = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || 'admin@superapp.com', // Mock email default
    role: user?.role || 'Administrator',
    bio: user?.bio || 'Superapp account.',
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
    <div className="service-view">
      <h2>Profil Pengguna</h2>
      <p>Kelola informasi akun Anda.</p>

      <div className="profile-page-container" style={{ marginTop: '30px' }}>
        {/* Kartu Foto Profil */}
        <div className="profile-sidebar-card">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {formData.image ? (
                  <img src={formData.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  formData.username.charAt(0).toUpperCase()
                )}
              </div>
              <label className="profile-avatar-upload-btn" title="Ganti Foto Profil">
                📷
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            </div>
            <h3 className="profile-name">{formData.username}</h3>
            <span className="profile-role-badge">{formData.role}</span>
        </div>

        {/* Form Edit Profil */}
        <div className="profile-main-content">
            <div className="profile-form-header">
              <h3>Informasi Akun</h3>
            </div>
            <form onSubmit={handleSubmit} style={{ margin: 0 }}>
              <div className="profile-form">
                <div className="profile-form-group">
                    <label>Username</label>
                    <input type="text" name="username" value={formData.username} disabled className="profile-input" />
                </div>
                <div className="profile-form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="profile-input" />
                </div>
                <div className="profile-form-group">
                    <label>Bio</label>
                    <textarea name="bio" value={formData.bio} onChange={handleChange} className="profile-input" style={{ minHeight: '100px', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
              </div>
              <div className="profile-form-actions">
                    <button type="submit" className="profile-save-btn" disabled={loading}>
                      {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;