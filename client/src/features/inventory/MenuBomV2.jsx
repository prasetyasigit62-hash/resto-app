import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const MenuBomV2 = () => {
  const [menus, setMenus] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', image: '', categoryId: '', recipes: [] });

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

  const handleAddCategory = async () => {
    const name = prompt("Masukkan nama kategori baru (Cth: Makanan, Minuman, Dessert):");
    if (!name) return;
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
    try {
      const res = await fetch(`${backendUrl}/api/v2/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        toast.success("Kategori ditambahkan!");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('resto_token');
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

    // Filter resep yang valid
    const validRecipes = formData.recipes.filter(r => r.materialId && r.qtyNeeded > 0).map(r => ({ materialId: r.materialId, qtyNeeded: Number(r.qtyNeeded) }));

    try {
      const res = await fetch(`${backendUrl}/api/v2/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, price: Number(formData.price), categoryId: formData.categoryId || null, recipes: validRecipes })
      });
      if (res.ok) {
        toast.success("Menu dan Resep berhasil ditambahkan!");
        setShowModal(false);
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
        <button onClick={() => { setFormData({ name: '', price: '', image: '', categoryId: '', recipes: [] }); setShowModal(true); }} className="profile-save-btn" style={{ width: 'auto' }}>
          + Tambah Menu Baru
        </button>
      </div>

      {loading ? <p>Memuat data...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {menus.length === 0 ? <p style={{color:'#999'}}>Belum ada menu, tambahkan satu sekarang.</p> : menus.map(m => (
            <div key={m.id} style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
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
              
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
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
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>Tambah Menu Baru</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Lengkapi data menu dan komposisi resep</span>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
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
                    <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Cth: 35000" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
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
                      {formData.image && <img src={formData.image} alt="Preview" style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />}
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
    </div>
  );
};

export default MenuBomV2;