import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const MenuBomV2 = ({ user }) => {
  const [menus, setMenus] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', image: '', categoryId: '', recipes: [] });
  const [zoomedImage, setZoomedImage] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [archiveTarget, setArchiveTarget] = useState(null);

  // ✨ Helper Format Rupiah Otomatis
  const formatRupiah = (value) => {
    if (!value) return '';
    return String(value).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const [resMenu, resMat, resCat] = await Promise.all([
        fetch(`${backendUrl}/api/v2/menus`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/v2/materials`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/v2/categories`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ ok: false }))
      ]);
      if (resMenu.ok) setMenus(await resMenu.json());
      if (resMat.ok) setMaterials(await resMat.json());
      if (resCat && resCat.ok) setCategories(await resCat.json());
    } catch (err) { toast.error("Gagal memuat data menu/resep"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddRecipeRow = () => {
    setFormData({ ...formData, recipes: [...formData.recipes, { materialId: '', qtyNeeded: '' }] });
  };

  const handleRecipeChange = (index, field, value) => {
    const newRecipes = [...formData.recipes];
    newRecipes[index][field] = value;
    setFormData({ ...formData, recipes: newRecipes });
  };

  const removeRecipeRow = (index) => {
    setFormData({ ...formData, recipes: formData.recipes.filter((_, i) => i !== index) });
  };

  const handleAddCategory = () => {
    setNewCategoryName('');
    setShowCategoryModal(true);
  };

  const submitAddCategory = async () => {
    if (!newCategoryName.trim()) return toast.warn('Nama kategori tidak boleh kosong.');
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/v2/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      if (res.ok) {
        const newCat = await res.json();
        toast.success("Kategori berhasil ditambahkan!");
        setShowCategoryModal(false);
        setFormData(prev => ({ ...prev, categoryId: newCat.id || '' }));
        fetchData();
      } else toast.error("Gagal menambah kategori");
    } catch (e) { toast.error("Koneksi error"); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
        const res = await fetch(`${backendUrl}/api/upload`, {
            method: 'POST',
            body: uploadData
        });
        const data = await res.json();
        if (res.ok) {
            setFormData({ ...formData, image: data.imageUrl });
            toast.success('Gambar berhasil diunggah!');
        } else {
            toast.error(data.error || 'Gagal mengunggah gambar');
        }
    } catch (err) { toast.error('Error saat mengunggah gambar'); }
  };

  const handleOpenEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      price: formatRupiah(menu.price),
      image: menu.image || '',
      categoryId: menu.categoryId || '',
      recipes: menu.recipes ? menu.recipes.map(r => ({ materialId: r.materialId, qtyNeeded: r.qtyNeeded })) : []
    });
    setShowModal(true);
  };

  const handleDelete = (menuId, menuName) => {
    setArchiveTarget({ id: menuId, name: menuName });
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/v2/menus/${archiveTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { toast.success('Menu berhasil diarsipkan.'); fetchData(); }
      else toast.error('Gagal mengarsipkan menu.');
    } catch (err) { toast.error('Koneksi error.'); }
    setArchiveTarget(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

    const validRecipes = formData.recipes.filter(r => r.materialId && r.qtyNeeded > 0).map(r => ({ materialId: r.materialId, qtyNeeded: Number(r.qtyNeeded) }));
    const url = editingMenu ? `${backendUrl}/api/v2/menus/${editingMenu.id}` : `${backendUrl}/api/v2/menus`;
    const method = editingMenu ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, price: Number(String(formData.price).replace(/\./g, '')), categoryId: formData.categoryId || null, recipes: validRecipes })
      });
      if (res.ok) {
        toast.success(editingMenu ? "Menu berhasil diperbarui!" : "Menu dan Resep berhasil ditambahkan!");
        setShowModal(false);
        setEditingMenu(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menyimpan menu");
      }
    } catch (err) { toast.error("Koneksi error"); }
  };

  return (
    <div className="service-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>🍲 Resep & Menu (BOM)</h2>
          <p style={{ color: '#64748b' }}>Kelola daftar menu makanan dan komposisi bahan baku (Bill of Materials).</p>
        </div>
        {['OWNER', 'ADMIN', 'SUPERADMIN'].includes(user?.role) && (
          <button onClick={() => { setEditingMenu(null); setFormData({ name: '', price: '', image: '', categoryId: '', recipes: [] }); setShowModal(true); }} className="profile-save-btn" style={{ width: 'auto' }}>
            + Tambah Menu Baru
          </button>
        )}
      </div>

      {loading ? <p>Memuat data...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {menus.length === 0 ? <p style={{color:'#999'}}>Belum ada menu, tambahkan satu sekarang.</p> : menus.map(m => (
            <div key={m.id} style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', overflow: 'hidden' }}>
                  {m.image ? <img src={m.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={m.name} /> : '🍔'}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#1e293b' }}>{m.name}</h3>
                  <span style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px' }}>{m.category?.name || 'Tanpa Kategori'}</span>
                  <div style={{ fontWeight: '900', color: '#3b82f6', fontSize: '1.1rem' }}>Rp {m.price.toLocaleString('id-ID')}</div>
                </div>
              </div>
              
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Komposisi Bahan (BOM):</div>
                {m.recipes && m.recipes.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569' }}>
                    {m.recipes.map(r => (
                      <li key={r.id}>{r.material?.name} : <strong style={{color:'#0f172a'}}>{r.qtyNeeded} {r.material?.unit}</strong></li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Tanpa resep bahan baku.</div>
                )}
              </div>
              {['OWNER', 'ADMIN', 'SUPERADMIN'].includes(user?.role) && (
                <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <button onClick={() => handleOpenEdit(m)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>✏️ Edit</button>
                  <button onClick={() => handleDelete(m.id, m.name)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontWeight: '600', color: '#ef4444', fontSize: '0.85rem' }}>🗑️ Arsip</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Header Modal */}
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#eff6ff', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🍲</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>{editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Lengkapi data menu dan komposisi resep</span>
                </div>
              </div>
              <button type="button" onClick={() => { setShowModal(false); setEditingMenu(null); }} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* Informasi Dasar (Grid 2 Kolom Symmetrical) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                {/* Kiri */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Nama Menu <span style={{color:'#ef4444'}}>*</span></label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Cth: Nasi Goreng Spesial" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Harga Jual (Rp) <span style={{color:'#ef4444'}}>*</span></label>
                    <input required type="text" value={formData.price} onChange={e => setFormData({...formData, price: formatRupiah(e.target.value)})} placeholder="Cth: 35.000" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* Kanan */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Kategori Menu</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})} style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', background: 'white' }}>
                        <option value="">-- Pilih Kategori --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button type="button" onClick={handleAddCategory} style={{ background: '#f8fafc', color: '#3b82f6', border: '1.5px solid #cbd5e1', borderRadius: '12px', width: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }} title="Tambah Kategori Baru">+</button>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Gambar Produk <span style={{fontWeight:'normal', color:'#94a3b8'}}>(Opsional)</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <label style={{ flex: 1, padding: '11px', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', fontSize: '0.9rem', color: '#64748b', fontWeight: '600', transition: 'all 0.2s' }}>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        {formData.image ? '🔄 Ganti Gambar' : '📁 Pilih File Gambar'}
                      </label>
                      {formData.image && <img src={formData.image} alt="Preview" style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0', cursor: 'zoom-in' }} onClick={(e) => { e.stopPropagation(); setZoomedImage(formData.image); }} title="Klik untuk memperbesar" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Komposisi Resep (BOM) Area */}
              <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '800', color: '#0f172a', fontSize: '1.1rem' }}>📦 Komposisi Resep (BOM)</label>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Otomatis potong stok gudang saat menu terjual.</span>
                  </div>
                  <button type="button" onClick={handleAddRecipeRow} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>
                    <span>+</span> Tambah Bahan
                  </button>
                </div>
                
                {formData.recipes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', background: '#ffffff', borderRadius: '12px', border: '1.5px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.95rem' }}>
                    Belum ada bahan baku.<br/>Menu ini tidak akan memotong stok gudang.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {formData.recipes.map((recipe, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#ffffff', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ flex: 2 }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Bahan Baku</label>
                          <select required value={recipe.materialId} onChange={e => handleRecipeChange(idx, 'materialId', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'white' }}>
                            <option value="">-- Pilih --</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Jumlah</label>
                          <input required type="number" step="0.01" value={recipe.qtyNeeded} onChange={e => handleRecipeChange(idx, 'qtyNeeded', e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                          <button type="button" onClick={() => removeRecipeRow(idx)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', transition: 'background 0.2s', marginTop: '22px' }} title="Hapus Bahan">&times;</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '10px' }}>
                <button type="submit" className="profile-save-btn" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: '800', borderRadius: '14px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
                  <span>💾</span> Simpan Menu
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH KATEGORI */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.15s ease-out' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: 0, width: '100%', maxWidth: '440px', boxShadow: '0 25px 60px -10px rgba(0,0,0,0.3)', animation: 'slideUp 0.2s ease-out', overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: '#eff6ff', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🏷️</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Tambah Kategori Baru</h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Kategori akan langsung tersedia di dropdown</p>
              </div>
              <button type="button" onClick={() => setShowCategoryModal(false)} style={{ marginLeft: 'auto', background: '#f1f5f9', border: 'none', width: '34px', height: '34px', borderRadius: '50%', fontSize: '1.1rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>&times;</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#334155', marginBottom: '10px' }}>Nama Kategori <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                autoFocus
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitAddCategory()}
                placeholder="Cth: Makanan, Minuman, Dessert..."
                style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' }}>Batal</button>
                <button type="button" onClick={submitAddCategory} style={{ flex: 2, padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span>✓</span> Simpan Kategori
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI ARSIP MENU */}
      {archiveTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.15s ease-out' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 60px -10px rgba(0,0,0,0.3)', animation: 'slideUp 0.2s ease-out', overflow: 'hidden' }}>
            <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: '#fef2f2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>🗄️</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Arsipkan Menu?</h3>
              <p style={{ margin: '0 0 6px', color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Menu <strong style={{ color: '#0f172a' }}>"{archiveTarget.name}"</strong> akan disembunyikan dari daftar POS.
              </p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem' }}>Data resep & BOM tetap tersimpan dan bisa dipulihkan kapan saja.</p>
            </div>
            <div style={{ padding: '0 28px 28px', display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setArchiveTarget(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.15s' }}>Batal</button>
              <button type="button" onClick={confirmArchive} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>🗄️</span> Ya, Arsipkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL ZOOM GAMBAR */}
      {zoomedImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.9)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setZoomedImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', padding: '20px' }}>
            <button onClick={() => setZoomedImage(null)} style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>&times;</button>
            <img src={zoomedImage} alt="Zoomed Preview" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', objectFit: 'contain', border: '4px solid white' }} onClick={(e) => e.stopPropagation()} />
            <p style={{ color: 'white', textAlign: 'center', marginTop: '15px', fontWeight: 'bold', fontSize: '1.1rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Mode Pratinjau Gambar</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuBomV2;