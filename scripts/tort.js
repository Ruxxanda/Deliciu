document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const nume = params.get('nume');
    const container = document.getElementById('tortDisplay');
    if (!nume) {
        container.innerHTML = '<p>Produs neidentificat.</p>';
        return;
    }

    // try to find product in products.json
    try {
        const resp = await fetch('../data/products.json');
        let produse = [];
        if (resp.ok) {
            const data = await resp.json();
            produse = Array.isArray(data) ? data : [];
        }
        const prod = produse.find(p => p.nume === nume);
        if (prod) {
            renderProduct(prod, container);
            return;
        }
    } catch (e) {
        console.warn('Nu s-a putut citi products.json:', e);
    }

    // if not in products.json, check user's cart (custom/craft products)
    const uid = localStorage.getItem('uid') || 'guest';
    const cart = JSON.parse(localStorage.getItem(`cart_${uid}`) || '[]');
    const item = cart.find(i => i.nume === nume);
    if (item) {
            // build a product-like object
            const custom = {
                nume: item.nume,
                descriere: item.descriere || 'Produs personalizat',
                pret: item.pret || 0,
                imagine: item.imagine || item.imagini || '/imagini/craft/craft.png',
                cantitate: item.cantitate ,
                fullDescriere: item.descriere || ''
            };
            renderProduct(custom, container, true);
            return;
    }

    container.innerHTML = '<p>Produsul nu a fost găsit.</p>';
});

function renderProduct(p, container, isCustom = false) {
    const formatPrice = (price) => parseFloat(price || 0).toFixed(2);
    const imageSrc = (p.imagine || p.linkImagine || p.imagine_url || '').replace(/^\./,'').replace(/^\//,'');
    const mainDescr = (p.descriere || p.fullDescriere || '');
    const showFullDescr = isCustom && p.fullDescriere && p.fullDescriere.trim() && (p.fullDescriere !== (p.descriere || ''));
    let cantitateInfoHTML = '';
    // Nu afișa .cantitate-info pentru produsele craft (isCraft==true)
    if (!p.isCraft) {
        let cantitateAfisata = p.cantitate ? p.cantitate : '';
        cantitateInfoHTML = `<div class="cantitate-info" style="color:#888;font-size:0.95em; margin-bottom:8px;">${cantitateAfisata}</div>`;
    }
    container.innerHTML = `
        <div class="detalii-produse">
            <img src="../${imageSrc || 'imagini/craft/craft.png'}" alt="${p.nume}" onerror="this.src='../imagini/craft/craft.png'">
            <div class="info">
                <h2>${p.nume}</h2>
                <p class="price">${formatPrice(p.pret)} Lei</p>
                <div class="descriere">${mainDescr}</div>
                ${cantitateInfoHTML}
                ${Array.isArray(p.detalii) ? `<ul class="detalii-list">${p.detalii.map(d=>`<li>${d}</li>`).join('')}</ul>` : ''}
                ${showFullDescr ? `<div style="margin-top:12px;"><strong>Descriere completă:</strong><div>${p.fullDescriere}</div></div>` : ''}
            </div>
        </div>
    `;
}
document.querySelectorAll('.cantitate-info').forEach(el => {
    if (el.textContent.trim() === '1') {
        el.style.display = 'none';
    }
});
