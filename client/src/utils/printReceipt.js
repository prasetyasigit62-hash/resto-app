/** Helper otomatis untuk mencetak struk dan laporan */
export const printReceipt = (data, storeSettings = {}) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  document.body.appendChild(iframe);

  const htmlContent = `
    <html>
    <head>
      <title>Struk #${data.receiptNumber || data.id || 'NEW'}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 100%; max-width: 300px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .border-bottom { border-bottom: 1px dashed #000; margin: 5px 0; padding-bottom: 5px; }
        .row { display: flex; justify-content: space-between; }
        .item-row { margin-bottom: 4px; }
      </style>
    </head>
    <body>
      <div class="text-center bold" style="font-size: 16px;">${storeSettings.storeName || 'Restoran Kita'}</div>
      <div class="text-center">${storeSettings.storeAddress || ''}</div>
      <div class="text-center border-bottom">Telp: ${storeSettings.storePhone || ''}</div>
      
      <div>No. Order: ${data.receiptNumber || data.id}</div>
      <div>Tgl: ${new Date(data.date || data.createdAt || Date.now()).toLocaleString('id-ID')}</div>
      <div>Kasir: ${data.kasir?.username || data.seller_name || data.processedBy || 'Staff'}</div>
      ${data.chefName && data.chefName !== '-' ? `<div>Chef: ${data.chefName}</div>` : ''}
      <div class="border-bottom">Metode: ${data.paymentMethod || data.payment_method || 'CASH'}</div>

      <div class="items">
        ${(data.items || []).map(item => {
          const priceNum = parseInt(String(item.price).replace(/[^0-9]/g, '') || '0');
          return `
            <div class="item-row">
              <div>${item.name || item.menu?.name || 'Item'} x${item.qty}</div>
              <div class="text-right">${(priceNum * item.qty).toLocaleString('id-ID')}</div>
            </div>
            ${item.note ? `<div style="font-size: 10px; font-style: italic; color: #555;">* ${item.note}</div>` : ''}
          `;
        }).join('')}
      </div>

      <div class="border-bottom" style="margin-top: 10px;"></div>
      
      <div class="row"><span>Subtotal</span><span>${(data.subtotal || data.total || 0).toLocaleString('id-ID')}</span></div>
      ${data.discountAmount > 0 ? `<div class="row" style="color:red;"><span>Diskon ${data.voucherCode ? '('+data.voucherCode+')' : ''}</span><span>-${(data.discountAmount||0).toLocaleString('id-ID')}</span></div>` : ''}
      ${(data.serviceCharge || 0) > 0 ? `<div class="row"><span>Service</span><span>${Math.round(data.serviceCharge || 0).toLocaleString('id-ID')}</span></div>` : ''}
      <div class="row"><span>PPN</span><span>${Math.round(data.tax || 0).toLocaleString('id-ID')}</span></div>
      ${data.pointsDiscount > 0 ? `<div class="row" style="color:green;"><span>Tukar Poin</span><span>-${(data.pointsDiscount||0).toLocaleString('id-ID')}</span></div>` : ''}
      <div class="row bold" style="font-size: 14px; margin-top: 5px;"><span>TOTAL</span><span>Rp ${(data.total || 0).toLocaleString('id-ID')}</span></div>
      
      <div class="text-center border-bottom" style="margin-top: 15px;"></div>
      <div class="text-center" style="margin-top: 10px;">Terima Kasih</div>
      <div class="text-center">${storeSettings.receiptFooter || 'Simpan struk ini sebagai bukti pembayaran.'}</div>
    </body>
    </html>
  `;

  setTimeout(() => {
    const targetDoc = iframe.contentWindow ? iframe.contentWindow.document : iframe.contentDocument;
    targetDoc.open();
    targetDoc.write(htmlContent);
    targetDoc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 3000);
    }, 500);
  }, 100);
};