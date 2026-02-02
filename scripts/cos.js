async function afiseazaCos() {
    const uid = localStorage.getItem("uid");
    if (!uid) {
        document.getElementById("error").innerText = "Trebuie să fiți logat pentru a vedea coșul.";
        return;
    }
    let cosItems = JSON.parse(localStorage.getItem(`cart_${uid}`) || '[]');
    
    // Elimină automat orice produse cu cantitate <= 0
    cosItems = cosItems.filter(item => item.cantitate > 0);
    localStorage.setItem(`cart_${uid}`, JSON.stringify(cosItems));
    
    const data = await fetch('../data/products.json').then(r => r.json());
    const produse = Array.isArray(data) ? data : [];
    const cosProd = cosItems.map(item => {
        const prod = produse.find(p => p.nume === item.nume);
        let totalQty = 0;
        if (!prod) {
            // Produs personalizat, calculeaza totalQty
            const parser = new DOMParser();
            const doc = parser.parseFromString(item.descriere, 'text/html');
            const lis = doc.querySelectorAll('li');
            lis.forEach(li => {
                const text = li.textContent;
                const parts = text.split(', ');
                const qtyStr = parts[parts.length - 1];
                const qty = parseInt(qtyStr) || 0;
                totalQty += qty;
            });
        }
        if (prod) {
            return { ...prod, cantitate: item.cantitate };
        } else {
            // Produs personalizat
            return { nume: item.nume, imagine: '../pagini/pozeProduse/poza.jpg', descriere: 'Produs personalizat', pret: item.pret, cantitate: item.cantitate, fullDescriere: item.descriere, totalQty };
        }
    });
    const div = document.getElementById("cosDisplay");
    div.innerHTML = "";
    const formatPrice = (price) => parseFloat(price || 0).toFixed(2);
    cosProd.forEach((p, index) => {
        const isCustom = !produse.find(prod => prod.nume === p.nume);
        const areReducere = p.reducere != null && p.reducere !== "" && p.pretRedus != null && p.pretRedus !== "";
        let pretHTML = "";
        if (!areReducere) {
            pretHTML = `<span>${formatPrice(p.pret)} Lei</span>`;
        } else {
            pretHTML = `\n<div>\n    <div style="display: flex; align-items: center; gap: 10px;">\n        <div class="pret-vechi">${formatPrice(p.pret)} Lei</div>\n        <div class="pret-redus">${formatPrice(p.pretRedus)} Lei</div>\n    </div>\n    <div class="badge-reducere">-${p.reducere}% reducere</div>\n</div>\n`;
        }
        const card = document.createElement("div");
        card.classList.add("produs", "cos-item");
        let detailsHTML = '';
        if (isCustom) {
            detailsHTML = `\n                        <button class="detalii" onclick="toggleDetails(${index})" id="btn-${index}">Detalii ▶</button>\n                        <div id="details-${index}" style="display: none; margin-top: 10px;">${p.fullDescriere}</div>\n                    `;
        }
            const imagePath = p.imagine || p.linkImagine || '../pagini/pozeProduse/poza.jpg';
            card.innerHTML = `\n            <div class="img-wrapper">\n                <img src="../${(imagePath||'').replace(/^\\/,'').replace(/^\.\//,'')}" alt="produs">\n                ${areReducere ? `<div class="badge-reducere">-${p.reducere}%</div>` : ''}\n            </div>\n            <h3>${p.nume}</h3>\n            <p>${p.descriere.split('\n')[0] || p.descriere}</p>\n            <div class="pret-info">${pretHTML}</div>\n            <p class="cantitate">Cantitate: ${isCustom ? (p.totalQty / 1000) + ' kg' : p.cantitate}</p>\n            ${detailsHTML}\n            <div class="actiuni">\n                <button class="sterge-cos" onclick="toggleCos('${p.nume}', ${p.cantitate})">\n                    <i class="fa fa-trash"></i> Șterge\n                </button>\n            </div>`;
        div.appendChild(card);
    });
}

async function toggleDetails(index) {
    const detailsDiv = document.getElementById(`details-${index}`);
    const btn = document.getElementById(`btn-${index}`);
    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        btn.innerHTML = 'Detalii ▼';
    } else {
        detailsDiv.style.display = 'none';
        btn.innerHTML = 'Detalii ▶';
    }
}

async function toggleCos(nume, currentCantitate) {
    const uid = localStorage.getItem("uid");
    if (!uid) return;
    const key = `cart_${uid}`;
    let cart = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = cart.findIndex(i => i.nume === nume);
    if (idx === -1) return afiseazaCos();
    if (currentCantitate > 1) {
        cart[idx].cantitate = Math.max(0, cart[idx].cantitate - 1);
        if (cart[idx].cantitate === 0) cart.splice(idx,1);
    } else {
        cart.splice(idx,1);
    }
    localStorage.setItem(key, JSON.stringify(cart));
    afiseazaCos();
    try { if (typeof loadStats === 'function') loadStats(); else if (window && window.loadStats) window.loadStats(); else setTimeout(()=>{ if (typeof loadStats === 'function') loadStats(); }, 200); } catch(e){}
}

async function placeOrder() {
    const uid = localStorage.getItem("uid");
    if (!uid) return;
    const cartKey = `cart_${uid}`;
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    if (!cart || cart.length === 0) {
        console.error("Coșul este gol!");
        alert('Coșul este gol!');
        return;
    }
    
    // Get form data
    const phone = document.getElementById("phoneInput").value.trim();
    const address = document.getElementById("addressInput").value.trim();
    const message = document.getElementById("messageInput").value.trim();
    
    if (!phone || !address) {
        alert('Te rog completează numărul de telefon și adresa!');
        return;
    }
    
    // Get complete user info from localStorage
    const stored = localStorage.getItem(`user_${uid}`) || localStorage.getItem(`profile_${uid}`) || null;
    let userInfo = { uid, email: localStorage.getItem('email') || '' };
    if (stored) {
      try { userInfo = JSON.parse(stored); } catch(e){}
    }
    const user = { uid: userInfo.uid || uid, email: userInfo.email, nume: userInfo.nume, poza: userInfo.poza || userInfo.photoURL || '/imagini/poza.png' };
    
    // Save order to localStorage
    const orderId = Date.now().toString();
    const orderPayload = {
            id: orderId,
            uid,
            user,
            cart,
            phone,
            address,
            message,
            poza: user.poza,
            status: 'În desfășurare',
            createdAt: new Date().toISOString()
    };
    
    // Do NOT save orders to localStorage anymore; orders are stored in Google Sheets
    // Send order to Google Sheets via Apps Script
    try {
            const response = await fetch('https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                            action: 'saveOrder',
                            data: JSON.stringify(orderPayload)
                    })
            });
            const result = await response.json();
            console.log('Comandă trimisă la Google Sheets:', result);
        } catch (err) {
            console.error('Eroare la trimitere către Google Sheets:', err);
            // Order could not be sent to Google Sheets; handle as needed
        }
    
    // Clear cart and form
    localStorage.removeItem(cartKey);
    document.getElementById("phoneInput").value = '';
    document.getElementById("addressInput").value = '';
    document.getElementById("messageInput").value = '';
    afiseazaCos();
    alert('Comandă plasată cu succes!');
    try { if (typeof loadStats === 'function') loadStats(); } catch(e){}
}


document.addEventListener("DOMContentLoaded", () => {
    afiseazaCos();
    const btn = document.getElementById("placeOrderBtn");
    if (btn) btn.onclick = placeOrder;
});
