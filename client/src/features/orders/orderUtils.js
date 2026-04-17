import React from 'react';
import { toast } from 'react-toastify';

export const getStatusPill = (status) => {
  const styles = {
    Pending: { background: '#fffbeb', color: '#f59e0b' },
    Processed: { background: '#eff6ff', color: '#3b82f6' },
    Completed: { background: '#f0fdf4', color: '#22c55e' },
    Cancelled: { background: '#fef2f2', color: '#ef4444' },
    CheckOut: { background: '#eff6ff', color: '#3b82f6' },
    Served: { background: '#f0fdf4', color: '#22c55e' },
  };
  const style = styles[status] || { background: '#f1f5f9', color: '#64748b' };
  
  return React.createElement(
    'span',
    { style: { ...style, padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' } },
    status
  );
};

export const handlePrintInvoice = (order) => {
  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice #${order.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #333; padding-bottom: 10px; }
          .details { margin-bottom: 20px; font-size: 0.9rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; border-bottom: 1px solid #333; padding: 5px 0; }
          td { padding: 5px 0; }
          .total { text-align: right; font-weight: bold; margin-top: 20px; font-size: 1.2rem; border-top: 2px dashed #333; padding-top: 10px; }
          .footer { text-align: center; margin-top: 30px; font-size: 0.8rem; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>SUPERAPP INVOICE</h2>
          <p>Bukti Transaksi Resmi</p>
        </div>
        <div class="details">
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Tanggal:</strong> ${new Date(order.date).toLocaleString('id-ID')}</p>
          <p><strong>Pelanggan:</strong> ${order.customerName}</p>
          <p><strong>Metode Bayar:</strong> ${order.paymentMethod}</p>
          <p><strong>Alamat:</strong> ${order.address}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Harga</th>
              <th style="text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => {
              const priceNum = item.price ? Number(String(item.price).replace(/[^0-9]/g, '')) : 0;
              const qty = item.qty || 1;
              return `
              <tr>
                <td>${item.name}${item.note ? `<br><small style="color:#856404;background:#fff3cd;padding:1px 4px;border-radius:3px">📝 ${item.note}</small>` : ''}<br><small>(${item.service})</small></td>
                <td style="text-align:center;font-weight:bold">${qty}x</td>
                <td style="text-align:right">Rp ${priceNum.toLocaleString('id-ID')}</td>
                <td style="text-align:right;font-weight:bold">Rp ${(priceNum * qty).toLocaleString('id-ID')}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
        <div class="total">
          Total: Rp ${order.total.toLocaleString('id-ID')}
        </div>
        <div class="footer">Terima kasih telah berbelanja di Superapp Ecosystem.</div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const handleExportCSV = (orders) => {
  if (orders.length === 0) {
    toast.warn('Tidak ada data pesanan untuk diexport');
    return;
  }
  
  const csvRows = [];
  csvRows.push(['ID Order', 'Tanggal', 'Pelanggan', 'Total', 'Status', 'Metode Bayar', 'Alamat', 'Items'].join(','));
  
  orders.forEach(order => {
    const itemsString = order.items.map(i => `${i.name} (${i.service})`).join('; ');
    const row = [
      order.id,
      new Date(order.date).toISOString(),
      `"${order.customerName}"`,
      order.total,
      order.status,
      order.paymentMethod,
      `"${order.address}"`,
      `"${itemsString}"`
    ];
    csvRows.push(row.join(','));
  });
  
  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Laporan_Pesanan_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success('Laporan pesanan berhasil didownload!');
};