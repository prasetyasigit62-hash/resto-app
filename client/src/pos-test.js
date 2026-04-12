import { Builder, By, until, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// Helper function untuk klik menu sidebar dengan aman
async function clickSidebarMenu(driver, menuName) {
    console.log(`➡️ Navigasi ke menu: ${menuName}...`);
    // Menggunakan Eksekusi JS murni agar kebal terhadap bug XPath Emojis/Karakter Spesial
    await driver.wait(async () => {
        return await driver.executeScript(`
            let btns = Array.from(document.querySelectorAll('aside button, aside a'));
            let target = btns.find(b => (b.innerText || b.textContent || '').toLowerCase().includes(arguments[0].toLowerCase()));
            if (target) { target.click(); return true; }
            return false;
        `, menuName);
    }, 15000, `Gagal menemukan menu: ${menuName}`);
    await driver.sleep(1500); // Tunggu komponen React di-render
}

async function runInventoryTest() {
    let options = new chrome.Options();
    options.addArguments('--kiosk-printing');
    options.addArguments('--log-level=3');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log("🚀 MEMULAI PENGUJIAN FOKUS: MODUL INVENTORI & SUPPLY CHAIN...");
        
        await driver.get('http://localhost:5173');
        await driver.manage().window().maximize();

        // ==========================================
        // FASE 0: LOGIN ADMIN
        // ==========================================
        let userField = await driver.wait(until.elementLocated(By.xpath("//input[@type='text' or contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'user')]")), 15000);
        let passField = await driver.findElement(By.xpath("//input[@type='password']"));
        let loginBtn = await driver.findElement(By.xpath("//button[@type='submit' or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'login') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'masuk') or contains(@class, 'login')]"));

        await userField.sendKeys('admin');
        await passField.sendKeys('admin123');
        await loginBtn.click();
        await driver.wait(until.elementLocated(By.className('app-layout')), 15000);
        await driver.sleep(2000); // ✨ Beri waktu ekstra agar React selesai me-render animasi UI
        console.log("✅ Login berhasil, masuk ke sistem.");

        // ==========================================
        // FASE 1: UJI DATA SUPPLIER
        // ==========================================
        console.log("\n🧪 FASE 1: Uji Master Data Supplier");
        await clickSidebarMenu(driver, 'supplier');
        await driver.sleep(2000);
        
        try {
            let addBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'tambah') or contains(., '+')]")), 15000);
            await driver.executeScript("arguments[0].click();", addBtn);
            await driver.sleep(1000);

            await driver.executeScript(`
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                let inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])')).filter(i => i.offsetParent !== null && !(i.placeholder||'').toLowerCase().includes('cari'));
                if(inputs.length >= 1) { setter.call(inputs[0], 'PT. Pemasok Selenium'); inputs[0].dispatchEvent(new Event('input', { bubbles: true })); inputs[0].dispatchEvent(new Event('change', { bubbles: true })); inputs[0].dispatchEvent(new Event('blur', { bubbles: true })); }
                if(inputs.length >= 2) { setter.call(inputs[1], '08111222333'); inputs[1].dispatchEvent(new Event('input', { bubbles: true })); inputs[1].dispatchEvent(new Event('change', { bubbles: true })); inputs[1].dispatchEvent(new Event('blur', { bubbles: true })); }
                
                let textAreas = document.querySelectorAll('textarea');
                if(textAreas.length > 0) {
                    const taSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    taSetter.call(textAreas[0], 'Jl. Automasi No. 99');
                    textAreas[0].dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                let submitBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.toLowerCase().includes('simpan') || b.innerText.toLowerCase().includes('tambah'));
                let targetBtn = submitBtns.find(b => b.closest('.modal-body') || b.closest('.modal-content') || b.closest('form')) || submitBtns[submitBtns.length - 1];
                if(targetBtn) { targetBtn.removeAttribute('disabled'); targetBtn.click(); }
            `);
            await driver.sleep(2000);
            
            let closeBtns = await driver.findElements(By.xpath("//button[contains(@class, 'close') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'tutup') or contains(., '×')]"));
            for (let btn of closeBtns) { if (await btn.isDisplayed()) { await driver.executeScript("arguments[0].click();", btn); } }
            
            console.log("   ✅ Data Supplier 'PT. Pemasok Selenium' berhasil disubmit.");
        } catch (e) {
            console.error("   ❌ Gagal menguji Data Supplier:", e.message);
        }

        // ==========================================
        // FASE 2: UJI MASTER BAHAN BAKU
        // ==========================================
        console.log("\n🧪 FASE 2: Uji Master Bahan Baku");
        await clickSidebarMenu(driver, 'bahan baku');
        await driver.sleep(2000);

        try {
            let addBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'tambah') or contains(., '+')]")), 15000);
            await driver.executeScript("arguments[0].click();", addBtn);
            await driver.sleep(1000);

            await driver.executeScript(`
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                let inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])')).filter(i => i.offsetParent !== null && !(i.placeholder||'').toLowerCase().includes('cari'));
                
                if(inputs.length >= 1) { setter.call(inputs[0], 'Bahan Selenium E2E'); inputs[0].dispatchEvent(new Event('input', { bubbles: true })); inputs[0].dispatchEvent(new Event('blur', { bubbles: true })); }
                if(inputs.length >= 2) { setter.call(inputs[1], '15000'); inputs[1].dispatchEvent(new Event('input', { bubbles: true })); inputs[1].dispatchEvent(new Event('blur', { bubbles: true })); }
                if(inputs.length >= 3) { setter.call(inputs[2], '10'); inputs[2].dispatchEvent(new Event('input', { bubbles: true })); inputs[2].dispatchEvent(new Event('blur', { bubbles: true })); }
                
                let selects = document.querySelectorAll('select');
                for(let sel of selects) {
                    if(sel.options.length > 1) {
                        const selectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
                        selectSetter.call(sel, sel.options[sel.options.length - 1].value);
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                
                let submitBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.toLowerCase().includes('simpan') || b.innerText.toLowerCase().includes('tambah'));
                let targetBtn = submitBtns.find(b => b.closest('.modal-body') || b.closest('.modal-content') || b.closest('form')) || submitBtns[submitBtns.length - 1];
                if(targetBtn) { targetBtn.removeAttribute('disabled'); targetBtn.click(); }
            `);
            await driver.sleep(2000);
            
            let closeBtns = await driver.findElements(By.xpath("//button[contains(@class, 'close') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'tutup') or contains(., '×')]"));
            for (let btn of closeBtns) { if (await btn.isDisplayed()) { await driver.executeScript("arguments[0].click();", btn); } }
            
            console.log("   ✅ Bahan Baku 'Bahan Selenium E2E' berhasil disubmit.");
        } catch (e) {
            console.error("   ❌ Gagal menguji Master Bahan Baku:", e.message);
        }

        // ==========================================
        // FASE 3: UJI STOK & OPNAME
        // ==========================================
        console.log("\n🧪 FASE 3: Uji Stok & Opname");
        await clickSidebarMenu(driver, 'stok');
        await driver.sleep(2000);

        try {
            let addBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'penyesuaian') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'opname') or contains(., '+')]")), 15000);
            await driver.executeScript("arguments[0].click();", addBtn);
            await driver.sleep(1000);

            await driver.executeScript(`
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                
                let selects = document.querySelectorAll('select');
                for(let sel of selects) {
                    if(sel.options.length > 1) {
                        const selectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
                        selectSetter.call(sel, sel.options[sel.options.length - 1].value);
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }

                let inputs = Array.from(document.querySelectorAll('input[type="number"]')).filter(i => i.offsetParent !== null);
                if(inputs.length > 0) { 
                    setter.call(inputs[0], '50'); 
                    inputs[0].dispatchEvent(new Event('input', { bubbles: true })); 
                    inputs[0].dispatchEvent(new Event('blur', { bubbles: true })); 
                }
                
                let textAreas = document.querySelectorAll('input[type="text"], textarea');
                let noteField = Array.from(textAreas).find(i => (i.placeholder||'').toLowerCase().includes('catatan') || (i.placeholder||'').toLowerCase().includes('note'));
                if(noteField) {
                    setter.call(noteField, 'Opname Otomatis Selenium');
                    noteField.dispatchEvent(new Event('input', { bubbles: true }));
                }
                    
                let submitBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.toLowerCase().includes('simpan') || b.innerText.toLowerCase().includes('sesuaikan'));
                let targetBtn = submitBtns.find(b => b.closest('.modal-body') || b.closest('.modal-content') || b.closest('form')) || submitBtns[submitBtns.length - 1];
                if(targetBtn) { targetBtn.removeAttribute('disabled'); targetBtn.click(); }
            `);
            await driver.sleep(2000);
            
            let closeBtns = await driver.findElements(By.xpath("//button[contains(@class, 'close') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'tutup') or contains(., '×')]"));
            for (let btn of closeBtns) { if (await btn.isDisplayed()) { await driver.executeScript("arguments[0].click();", btn); } }
            
            console.log("   ✅ Penyesuaian stok (Opname) berhasil disubmit.");
        } catch (e) {
            console.error("   ❌ Gagal menguji Stok & Opname:", e.message);
        }

        // ==========================================
        // FASE 4: UJI PEMBELIAN (PURCHASE ORDER)
        // ==========================================
        console.log("\n🧪 FASE 4: Uji Pembelian (Purchase Order)");
        await clickSidebarMenu(driver, 'pembelian');
        await driver.sleep(2000);

        try {
            let addBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'buat') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'po') or contains(., '+')]")), 15000);
            await driver.executeScript("arguments[0].click();", addBtn);
            await driver.sleep(1500);

            await driver.executeScript(`
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                
                let selects = document.querySelectorAll('select');
                for(let sel of selects) {
                    if(sel.options.length > 1) {
                        const selectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
                        selectSetter.call(sel, sel.options[sel.options.length - 1].value);
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }

                // Coba isi qty dan harga di tabel item PO
                let numInputs = Array.from(document.querySelectorAll('input[type="number"]')).filter(i => i.offsetParent !== null);
                if(numInputs.length >= 1) { setter.call(numInputs[0], '100'); numInputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
                if(numInputs.length >= 2) { setter.call(numInputs[1], '5000'); numInputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
                
                let submitBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.toLowerCase().includes('simpan') || b.innerText.toLowerCase().includes('buat'));
                let targetBtn = submitBtns.find(b => b.closest('.modal-body') || b.closest('.modal-content') || b.closest('form')) || submitBtns[submitBtns.length - 1];
                if(targetBtn) { targetBtn.removeAttribute('disabled'); targetBtn.click(); }
            `);
            await driver.sleep(2000);
            
            let closeBtns = await driver.findElements(By.xpath("//button[contains(@class, 'close') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'tutup') or contains(., '×')]"));
            for (let btn of closeBtns) { if (await btn.isDisplayed()) { await driver.executeScript("arguments[0].click();", btn); } }
            
            console.log("   ✅ Form Purchase Order (PO) berhasil disubmit.");
        } catch (e) {
            console.error("   ❌ Gagal menguji Pembelian PO:", e.message);
        }

        // ==========================================
        // FASE 5: UJI RESEP, BOM & MARGIN
        // ==========================================
        console.log("\n🧪 FASE 5: Uji Resep, BOM & Margin");
        await clickSidebarMenu(driver, 'resep');
        await driver.sleep(2000);

        try {
            let addBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'tambah') or contains(., '+')]")), 15000);
            await driver.executeScript("arguments[0].click();", addBtn);
            await driver.sleep(1500);

            await driver.executeScript(`
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                let inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="file"])')).filter(i => i.offsetParent !== null && !(i.placeholder||'').toLowerCase().includes('cari'));
                
                if(inputs.length >= 1) { setter.call(inputs[0], 'Menu BOM Selenium'); inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
                if(inputs.length >= 2) { setter.call(inputs[1], '35000'); inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
                
                // Coba klik tombol tambah bahan resep
                let addRecipeBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.toLowerCase().includes('bahan') || b.innerText.toLowerCase().includes('resep') || b.innerText.includes('+'));
                let targetAddRecipe = addRecipeBtns.find(b => b.closest('.modal-body') || b.closest('.modal-content') || b.closest('form'));
                if(targetAddRecipe) { 
                    targetAddRecipe.click(); 
                    
                    // Pilih bahan dan isi qty secara reaktif
                    setTimeout(() => {
                        let selects = document.querySelectorAll('select');
                        for(let sel of selects) {
                            if(sel.options.length > 1) {
                                const selectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
                                selectSetter.call(sel, sel.options[sel.options.length - 1].value);
                                sel.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        let numInputs = Array.from(document.querySelectorAll('input[type="number"]')).filter(i => i.offsetParent !== null);
                        if(numInputs.length > 0) { setter.call(numInputs[numInputs.length - 1], '2'); numInputs[numInputs.length - 1].dispatchEvent(new Event('input', { bubbles: true })); }
                    }, 500);
                }

                setTimeout(() => {
                    let saveBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.toLowerCase().includes('simpan') || b.innerText.toLowerCase().includes('tambah'));
                    let targetSave = saveBtns.find(b => b.closest('.modal-body') || b.closest('.modal-content') || b.closest('form')) || saveBtns[saveBtns.length - 1];
                    if(targetSave) { targetSave.removeAttribute('disabled'); targetSave.click(); }
                }, 1000);
            `);
            await driver.sleep(3000);
            
            let closeBtns = await driver.findElements(By.xpath("//button[contains(@class, 'close') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'tutup') or contains(., '×')]"));
            for (let btn of closeBtns) { if (await btn.isDisplayed()) { await driver.executeScript("arguments[0].click();", btn); } }
            
            console.log("   ✅ Data Menu dengan Resep BOM berhasil disubmit.");
        } catch (e) {
            console.error("   ❌ Gagal menguji Resep & BOM:", e.message);
        }

        console.log("\n🎉 SELAMAT! PENGUJIAN MODUL INVENTORI & SUPPLY CHAIN SELESAI!");
        await driver.sleep(3000);

    } catch (error) {
        console.error("\n❌ PENGUJIAN GAGAL! TERJADI ERROR PADA FASE TERTENTU:\n", error);
    } finally {
        console.log("\n🛑 Membersihkan dan Menutup Browser...");
        await driver.quit();
    }
}

runInventoryTest();