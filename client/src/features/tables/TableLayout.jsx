import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const TableLayout = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggingId, setDraggingId] = useState(null); // ID meja yang sedang digeser

    const fetchTables = async () => {
        setLoading(true);
        const token = localStorage.getItem('resto_token');
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/tables/layout`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                let data = await res.json();

                // ✨ AUTO-FIX: Pastikan koordinat adalah ANGKA (bukan string/null/undefined)
                data = data.map((t, i) => ({
                    ...t,
                    x: (t.x !== undefined && t.x !== null) ? Number(t.x) : (i % 5) * 120 + 20,
                    y: (t.y !== undefined && t.y !== null) ? Number(t.y) : Math.floor(i / 5) * 120 + 20
                }));

                setTables(data);
            }
        } catch (err) {
            toast.error("Gagal memuat denah meja.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    // --- LOGIKA DRAG MENGGUNAKAN POINTER EVENTS (LEBIH KUAT DARI MOUSE EVENTS) ---
    const handlePointerDown = (e, table) => {
        e.preventDefault();
        e.stopPropagation();

        const element = e.currentTarget;
        // PENTING: Mengunci pointer ke elemen ini. Mouse tidak akan "lepas" meskipun digeser cepat.
        element.setPointerCapture(e.pointerId);

        setDraggingId(table.id);

        // Simpan posisi awal
        const startX = e.clientX;
        const startY = e.clientY;
        const initialTableX = Number(table.x) || 0;
        const initialTableY = Number(table.y) || 0;

        // Handler saat pointer bergerak
        const onPointerMove = (moveEvent) => {
            moveEvent.preventDefault();

            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            // Hitung posisi baru + Snap Grid 10px
            const newX = Math.round((initialTableX + dx) / 10) * 10;
            const newY = Math.round((initialTableY + dy) / 10) * 10;

            // Update state
            setTables(prevTables => prevTables.map(t =>
                t.id === table.id ? { ...t, x: newX, y: newY } : t
            ));
        };

        // Handler saat pointer dilepas
        const onPointerUp = (upEvent) => {
            element.releasePointerCapture(upEvent.pointerId);
            setDraggingId(null);
            element.removeEventListener('pointermove', onPointerMove);
            element.removeEventListener('pointerup', onPointerUp);
        };

        // Pasang listener langsung ke elemen yang di-capture
        element.addEventListener('pointermove', onPointerMove);
        element.addEventListener('pointerup', onPointerUp);
    };

    const saveLayout = async () => {
        const token = localStorage.getItem('resto_token');
        const backendUrl = import.meta.env.VITE_API_BASE_URL?.split('/api')[0] || import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/tables/layout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(tables)
            });
            if (res.ok) {
                toast.success("Denah meja berhasil disimpan!");
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal menyimpan denah meja.");
            }
        } catch (err) {
            toast.error("Koneksi error.");
        }
    };

    return (
        <div className="service-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Denah Meja Restoran</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Atur posisi meja dengan drag-and-drop. Klik Simpan untuk menyimpan perubahan.</p>
                </div>
                <button onClick={saveLayout} className="profile-save-btn">
                    💾 Simpan Layout
                </button>
            </div>

            <div style={{ position: 'relative', height: 'calc(100vh - 250px)', background: 'var(--bg-color)', border: '2px dashed var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                {loading ? <p style={{ textAlign: 'center', paddingTop: '20px' }}>Memuat...</p> : tables.map(table => (
                    <div
                        key={table.id}
                        // Ganti onMouseDown dengan onPointerDown
                        onPointerDown={(e) => handlePointerDown(e, table)}
                        style={{
                            position: 'absolute',
                            left: `${table.x}px`, // Tambahkan px eksplisit
                            top: `${table.y}px`,  // Tambahkan px eksplisit
                            width: '100px',
                            height: '100px',
                            background: 'var(--card-bg)',
                            // Style saat digeser
                            border: draggingId === table.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            boxShadow: draggingId === table.id ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                            cursor: draggingId === table.id ? 'grabbing' : 'grab',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: draggingId === table.id ? 100 : 1, // Pastikan di paling atas saat digeser
                            userSelect: 'none',
                            touchAction: 'none', // PENTING: Mencegah scroll layar saat drag di touch device
                            transition: draggingId === table.id ? 'none' : 'box-shadow 0.2s',
                            padding: '4px'
                        }}
                    >
                        <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🍽️</div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.8rem', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', pointerEvents: 'none' }}>{table.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableLayout;
