function getStorageUid() { return localStorage.getItem('uid') || 'guest'; }

async function afiseazaSalvări() {
    const uid = getStorageUid();
    const salvariNume = JSON.parse(localStorage.getItem(`salvari_${uid}`) || '[]');
    let data = [];
    try {
        const resp = await fetch('../data/products.json');
        if (!resp.ok) {
            console.warn('products.json not found (salvari):', resp.status);
            data = [];
        } else {
            data = await resp.json();
        }
    } catch (e) {
        console.warn('Error fetching products.json (salvari):', e);
        data = [];
    }
    let produse = Array.isArray(data) ? data : [];
    
    if (typeof applyActiveReductions === 'function') {
      produse = await applyActiveReductions(produse);
    }
    
    const salvariProd = produse.filter(p => salvariNume.includes(p.nume));
    const div = document.getElementById("salvariDisplay");
    div.innerHTML = "";
    const formatPrice = (price) => parseFloat(price || 0).toFixed(2);
    salvariProd.forEach(p => {
        const areReducere = p.reducere != null && p.reducere !== "" && p.pretRedus != null && p.pretRedus !== "";
        let pretHTML = "";
        if (!areReducere) {
            pretHTML = `<span>${formatPrice(p.pret)} Lei</span>`; 
        } else {
            pretHTML = `
<div>
    <div style="display: flex; align-items: center; gap: 10px;">
        <div class="pret-vechi">${formatPrice(p.pret)} Lei</div>
        <div class="pret-redus">${formatPrice(p.pretRedus)} Lei</div>
    </div>
</div>
`;
        }
        // details are intentionally hidden on the saved items page — no details button
        const detailsHTML = '';
        const card = document.createElement("div");
        card.classList.add("produs", "salvare-item");
        card.innerHTML = `
            <div class="img-wrapper">
                <img src="../${(p.imagine || p.linkImagine || '').replace(/^\//,'').replace(/^\.\//,'')}" alt="produs">
                ${areReducere ? `<div class="badge-reducere">-${p.reducere}%</div>` : ''}
                <i class="fa fa-heart heart-icon active" onclick="toggleSalvare('${p.nume}')"></i>
            </div>
            <h3>${p.nume}</h3>
            <!-- descriere eliminată -->
            <div class="pret-info">${pretHTML}</div>
            <div class="cantitate-info" style="color:#888;font-size:0.95em; margin-bottom:8px;">${p.cantitate ? p.cantitate : ''}</div>
            ${detailsHTML}
            <div class="actiuni">
                <button class="adauga-cos" onclick="adaugaInCosDinSalvări('${p.nume}')">
                    <i class="fa fa-shopping-cart"></i> Adaugă în Coș
                </button>
            </div>`;
        div.appendChild(card);
        // Make whole card clickable to go to product detail (tort.html),
        // but don't navigate when user clicks the heart, details, img-wrapper or action buttons
        card.addEventListener('click', function(e) {
            if (e.target.closest('.img-wrapper') || e.target.closest('.actiuni') || e.target.closest('.detalii') || e.target.closest('.heart-icon') || e.target.closest('button')) return;
            window.location.href = `tort.html?nume=${encodeURIComponent(p.nume)}`;
        });
    });
}

async function toggleSalvare(nume, ev) {
    const uid = getStorageUid();
    const heartIcon = ev && ev.target;
    const key = `salvari_${uid}`;
    let saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(saved)) saved = [];
    // toggle behavior: if already saved -> remove, else add
    const exists = saved.includes(nume);
    if (exists) saved = saved.filter(s => s !== nume);
    else saved.push(nume);
    localStorage.setItem(key, JSON.stringify(saved));
    if (heartIcon) heartIcon.style.color = exists ? 'white' : 'red';
    afiseazaSalvări();
    if (typeof loadStats === 'function') loadStats();
}

function toggleDetailsSalvari(detailsId, buttonId) {
    const detailsDiv = document.getElementById(detailsId);
    const btn = document.getElementById(buttonId);

    if (!detailsDiv || !btn) {
        console.error('Could not find details or button element', detailsId, buttonId);
        return;
    }

    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        btn.innerHTML = 'Detalii ▼';
    } else {
        detailsDiv.style.display = 'none';
        btn.innerHTML = 'Detalii ▶';
    }
}

async function adaugaInCosDinSalvări(nume) {
    const uid = getStorageUid();
    const cantitate = 1;
    let product = null;
    try {
        const resp = await fetch('../data/products.json');
        if (resp.ok) {
            const all = await resp.json();
            const produseAll = Array.isArray(all) ? all : [];
            product = produseAll.find(p => p.nume === nume);
        } else {
            console.warn('products.json not found (adaugaInCosDinSalvari):', resp.status);
        }
    } catch (e) {
        console.warn('Error fetching products.json (adaugaInCosDinSalvari):', e);
    }
    const pret = product ? (product.pretRedus || product.pret) : 0;
    const descriere = product ? product.descriere : '';
    const cartKey = `cart_${uid}`;
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const existing = cart.find(i => i.nume === nume);
    if (existing) existing.cantitate = (existing.cantitate || 0) + cantitate;
    else cart.push({ nume, cantitate, pret, descriere });
    localStorage.setItem(cartKey, JSON.stringify(cart));
    const btn = event.target.closest('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-check"></i> Adăugat!';
    btn.style.background = '#4CAF50';
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
    }, 2000);
    if (typeof loadStats === 'function') loadStats();
}

document.addEventListener("DOMContentLoaded", afiseazaSalvări);