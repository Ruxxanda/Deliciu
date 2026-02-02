async function afiseazaSalvări() {
    const uid = localStorage.getItem("uid");
    if (!uid) {
        document.getElementById("error").innerText = "Trebuie să fiți logat pentru a vedea salvările.";
        return;
    }
    const salvariNume = JSON.parse(localStorage.getItem(`salvari_${uid}`) || '[]');
    let data = await fetch('../data/products.json').then(r => r.json());
    let produse = Array.isArray(data) ? data : [];
    
    // Apply active reductions from Firestore
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
    <div class="badge-reducere">-${p.reducere}% reducere</div>
</div>
`;
        }
        const detailsId = `details-${p.nume.replace(/\s/g, '-')}`;
        const buttonId = `btn-${p.nume.replace(/\s/g, '-')}-details`;
        const detailsHTML = p.detalii ? `
            <button class="detalii" onclick="toggleDetailsSalvari('${detailsId}', '${buttonId}')" id="${buttonId}">Detalii ▶</button>
            <div id="${detailsId}" style="display: none; margin-top: 10px; list-style: disc; padding-left: 20px;">${Array.isArray(p.detalii) ? p.detalii.map(detail => `<li>${detail}</li>`).join('') : p.detalii.split('\n').map(line => line.trim()).filter(line => line).map(line => `<li>${line}</li>`).join('')}</div>
        ` : '';
        const card = document.createElement("div");
        card.classList.add("produs", "salvare-item");
        card.innerHTML = `
            <div class="img-wrapper">
                <img src="../${(p.imagine || p.linkImagine || '').replace(/^\//,'').replace(/^\.\//,'')}" alt="produs">
                ${areReducere ? `<div class="badge-reducere">-${p.reducere}%</div>` : ''}
                <i class="fa fa-heart heart-icon active" onclick="toggleSalvare('${p.nume}')"></i>
            </div>
            <h3>${p.nume}</h3>
            <p>${p.descriere}</p>
            <div class="pret-info">${pretHTML}</div>
            ${detailsHTML}
            <div class="actiuni">
                <button class="adauga-cos" onclick="adaugaInCosDinSalvări('${p.nume}')">
                    <i class="fa fa-shopping-cart"></i> Adaugă în Coș
                </button>
            </div>`;
        div.appendChild(card);
    });
}

async function toggleSalvare(nume, ev) {
    const uid = localStorage.getItem("uid");
    if (!uid) return;
    const heartIcon = ev && ev.target;
    const key = `salvari_${uid}`;
    let saved = JSON.parse(localStorage.getItem(key) || '[]');
    saved = saved.filter(s => s !== nume);
    localStorage.setItem(key, JSON.stringify(saved));
    if (heartIcon) heartIcon.style.color = 'white';
    afiseazaSalvări();
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
    const uid = localStorage.getItem("uid");
    if (!uid) {
        document.getElementById("error").innerText = "Trebuie să fiți logat pentru a adăuga în coș.";
        return;
    }
    const cantitate = 1; // Default quantity
    const product = await fetch('../data/products.json').then(res => res.json()).then(data => {
        const produse = Array.isArray(data) ? data : [];
        return produse.find(p => p.nume === nume);
    });
    const pret = product ? (product.pretRedus || product.pret) : 0;
    const descriere = product ? product.descriere : '';
    // add to cart stored in localStorage
    const cartKey = `cart_${uid}`;
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const existing = cart.find(i => i.nume === nume);
    if (existing) existing.cantitate = (existing.cantitate || 0) + cantitate;
    else cart.push({ nume, cantitate, pret, descriere });
    localStorage.setItem(cartKey, JSON.stringify(cart));
    // Show success message or update UI
    const btn = event.target.closest('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-check"></i> Adăugat!';
    btn.style.background = '#4CAF50';
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
    }, 2000);
}

document.addEventListener("DOMContentLoaded", afiseazaSalvări);