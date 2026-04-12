import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../../api';

const fetchUsers = async () => (await api.get('/users')).data;
const fetchOutlets = async () => (await api.get('/outlets')).data;

const UserManagementV2 = ({ user }) => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'KASIR', outletId: '' });

  const { data: users = [], isLoading: loadingUsers } = useQuery({ queryKey: ['usersV2'], queryFn: fetchUsers });
  const { data: outlets = [] } = useQuery({ queryKey: ['outletsV2'], queryFn: fetchOutlets });

  // Mutations for Create, Status, Reset
  const createUser = useMutation({
    mutationFn: (newUser) => api.post('/users/register', newUser),
    onSuccess: () => {
      toast.success('Akun baru berhasil dibuat!');
      queryClient.invalidateQueries(['usersV2']);
      setShowModal(false);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Gagal membuat user')
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/users/${id}/status`, { isActive }),
    onSuccess: (data) => {
      toast.success(data.data.message);
      queryClient.invalidateQueries(['usersV2']);
    }
  });

  const resetPassword = useMutation({
    mutationFn: ({ id, newPassword }) => api.put(`/users/${id}/reset-password`, { newPassword }),
    onSuccess: (data) => {
      toast.success(data.data.message);
      queryClient.invalidateQueries(['usersV2']);
    }
  });

  const handleResetPassword = (id, username) => {
    const newPass = prompt(`Masukkan Password Baru untuk ${username}:`);
    if (newPass && newPass.length >= 6) {
      resetPassword.mutate({ id, newPassword: newPass });
    } else if (newPass) {
      toast.warn("Password minimal 6 karakter!");
    }
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>👥 Manajemen Akun (Role-Based)</h2>
          <p style={{ color: '#64748b' }}>Kelola staff, kasir, dan admin untuk tiap outlet.</p>
        </div>
        <button onClick={() => { setFormData({ username: '', password: '', role: 'KASIR', outletId: '' }); setShowModal(true); }} className="profile-save-btn" style={{ width: 'auto' }}>
          + Daftarkan Pegawai
        </button>
      </div>

      {loadingUsers ? <p>Memuat data pengguna...</p> : (
        <div className="table-responsive" style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role / Akses</th>
                <th>Outlet Penugasan</th>
                <th>Status Akun</th>
                <th style={{ textAlign: 'center' }}>Aksi Khusus</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 'bold', color: '#1e293b' }}>{u.username}</td>
                  <td><span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>{u.role}</span></td>
                  <td>{u.outlet?.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Semua Outlet (Pusat)</span>}</td>
                  <td>
                    <span style={{ color: u.isActive ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                      {u.isActive ? '✅ Aktif' : '🚫 Dinonaktifkan'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button 
                        onClick={() => toggleStatus.mutate({ id: u.id, isActive: !u.isActive })} 
                        style={{ padding: '6px 12px', background: u.isActive ? '#fee2e2' : '#dcfce7', color: u.isActive ? '#dc2626' : '#16a34a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                    >
                        {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    {user.role === 'OWNER' && (
                        <button onClick={() => handleResetPassword(u.id, u.username)} style={{ padding: '6px 12px', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          Reset Sandi
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah User */}
      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#eff6ff', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👥</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>Daftar Pegawai Baru</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Buat akses login untuk staff baru</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createUser.mutate(formData); }} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Username Login <span style={{color:'#ef4444'}}>*</span></label><input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g,'')})} placeholder="Cth: joko_kasir" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Password Sementara <span style={{color:'#ef4444'}}>*</span></label><input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Minimal 6 karakter" minLength={6} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Hak Akses (Role) <span style={{color:'#ef4444'}}>*</span></label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}><option value="KASIR">KASIR</option><option value="CHEF">CHEF (Dapur)</option><option value="ADMIN">ADMIN CABANG</option>{user.role === 'OWNER' && <option value="OWNER">OWNER</option>}</select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Tugaskan ke Outlet</label>
                  <select value={formData.outletId} onChange={e => setFormData({...formData, outletId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}><option value="">Semua Outlet (Pusat)</option>{outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
                </div>
              </div>
              <button type="submit" disabled={createUser.isPending} style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: createUser.isPending ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: createUser.isPending ? 'none' : '0 10px 15px -3px rgba(59, 130, 246, 0.3)', color: 'white', border: 'none', cursor: createUser.isPending ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
                {createUser.isPending ? 'Mendaftarkan...' : '💾 Simpan Pegawai'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementV2;