import React from 'react';

const Help = () => {
  const faqs = [
    {
      q: "Bagaimana cara menambahkan data baru?",
      a: "Klik menu 'Master Bahan Baku' atau 'Manajemen Pegawai' di sidebar, isi formulir pada modal, dan klik 'Simpan'."
    },
    {
      q: "Bagaimana cara mengubah password?",
      a: "Masuk ke menu 'Settings' (ikon gembok), masukkan password baru Anda dan konfirmasi, lalu simpan."
    },
    {
      q: "Saya lupa password, apa yang harus dilakukan?",
      a: "Hubungi Administrator utama. Admin dapat mereset password Anda melalui menu 'Users'."
    },
    {
      q: "Apakah data yang dihapus bisa dikembalikan?",
      a: "Tidak. Data yang dihapus permanen. Namun, Admin dapat melakukan Restore jika memiliki file Backup sebelumnya."
    },
    {
      q: "Bagaimana cara export laporan ke PDF?",
      a: "Masuk ke menu 'Laporan Penjualan' atau 'Inventori', lalu klik tombol merah 'Export PDF' di pojok kanan atas tabel."
    }
  ];

  return (
    <div className="service-view">
      <h2>Pusat Bantuan</h2>
      <p>Panduan dan pertanyaan umum seputar penggunaan Superapp.</p>

      <div style={{ marginTop: '30px', maxWidth: '800px' }}>
        {faqs.map((item, index) => (
          <div key={index} style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '10px', fontSize: '1.1rem' }}>
              {index + 1}. {item.q}
            </h3>
            <p style={{ lineHeight: '1.6', color: 'var(--text-color)' }}>{item.a}</p>
          </div>
        ))}

        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <h3>Butuh bantuan lebih lanjut?</h3>
          <p>Silakan hubungi tim IT Support kami:</p>
          <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
            <li>Email: support@superapp.com</li>
            <li>WhatsApp: +62 812 3456 7890</li>
            <li>Jam Operasional: Senin - Jumat (09:00 - 17:00)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Help;