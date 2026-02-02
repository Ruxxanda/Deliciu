const uid = localStorage.getItem("uid");
if(!uid) window.location.href="../index.html";

async function incarcaDate() {
  // Load user profile from localStorage (set by firebase.js on login)
  const stored = localStorage.getItem(`user_${uid}`) || localStorage.getItem(`profile_${uid}`) || null;
  let user = null;
  if (stored) {
    try { user = JSON.parse(stored); } catch(e){ user = null; }
  }
  if (!user) {
    // fallback to minimal info from localStorage keys
    user = { uid, nume: localStorage.getItem('email') || uid, email: localStorage.getItem('email') || '' };
  }
  const poza = user.poza || user.photoURL || "../imagini/poza.png";
  // Handle both HTTP URLs (from Google) and local paths
  const imgSrc = (poza && poza.startsWith('http')) ? poza : (poza || "../imagini/poza.png");
  document.getElementById("info").innerHTML = `
    <img src="${imgSrc}" class="poza"><br>
    <b>${user.nume || user.email || uid}</b><br>
    ${user.email || ''}
  `;
}
incarcaDate();

document.getElementById("logoutBtn").onclick = async () => {
  localStorage.removeItem("uid");
  localStorage.removeItem("email");
  window.location.href = "../index.html";
};

document.getElementById("trimiteComentariu").onclick = async () => {
  const text = document.getElementById("comentariuText").value;
  if(!text) return;
  // save comment locally
  const stored = localStorage.getItem(`user_${uid}`) || localStorage.getItem(`profile_${uid}`) || null;
  let user = null;
  if (stored) { try { user = JSON.parse(stored); } catch(e){ user = null; } }
  const userEmail = localStorage.getItem('email') || '';
  const payload = { uid, email: userEmail, nume: (user && user.nume) || userEmail || uid, poza: (user && (user.poza || user.photoURL)) || '../imagini/poza.png', text };
  try {
    if (window.firestore && window.firestore.saveComment) {
      await window.firestore.saveComment(payload);
    } else {
      const comentarii = JSON.parse(localStorage.getItem('comentarii') || '[]');
      const id = Date.now();
      comentarii.push({ id, ...payload });
      localStorage.setItem('comentarii', JSON.stringify(comentarii));
    }
    document.getElementById("comentariuText").value="";
    incarcaComentarii();
  } catch (err) {
    console.error('Eroare la trimitere comentariu', err);
    alert('Nu s-a putut salva comentariul. Încearcă din nou.');
  }
};

async function incarcaComentarii(){
  try {
    let data = [];
    const userEmail = (localStorage.getItem('email') || '').toLowerCase();
    
    // Try to fetch from Firebase first
    if (window.firestore && window.firestore.fetchAllComments) {
      try {
        const allComments = await window.firestore.fetchAllComments();
        // Filter comments by logged-in user's email
        data = allComments.filter(c => {
          const commentEmail = (c.email || '').toLowerCase();
          return commentEmail === userEmail;
        });
        console.log(`Loaded ${data.length} comments from Firebase for ${userEmail}`);
      } catch (firebaseErr) {
        console.error('Eroare la citire comentarii din Firebase:', firebaseErr);
        // Fallback to localStorage
        const all = JSON.parse(localStorage.getItem('comentarii') || '[]');
        data = all.filter(c => (c.email || '').toLowerCase() === userEmail || c.uid === uid);
      }
    } else {
      // Fallback: use localStorage if Firebase is not available
      const all = JSON.parse(localStorage.getItem('comentarii') || '[]');
      data = all.filter(c => (c.email || '').toLowerCase() === userEmail || c.uid === uid);
    }
    
    const container = document.getElementById("listaComentarii");
    if (!container) return; // listaComentarii poate fi ascunsă per setare UI
    container.innerHTML = data.map(c => `
      <div style="border:1px solid #ccc;margin:5px;padding:5px">
        <input type="text" value="${(c.text||'').replace(/"/g,'&quot;')}" id="input${c.id}" style="width:70%">
        <button onclick="salveazaComent('${c.id}')">Salvează</button>
        <button onclick="stergeComentariu('${c.id}')">Șterge</button>
      </div>
    `).join("");
  } catch (err) {
    console.error('Eroare la încărcare comentarii', err);
    const container = document.getElementById("listaComentarii");
    if (container) container.innerHTML = '<div style="padding:20px;color:#999">Nu s-au putut încărca comentariile.</div>';
  }
}
incarcaComentarii();

async function incarcaComenzi(){
  // Load user's orders from Google Sheets (Apps Script). Fallback to localStorage.
  let orders = [];
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec?action=getAllOrders');
    const result = await response.json();
    if (result.success && Array.isArray(result.orders)) {
      orders = result.orders;
    } else {
      // fallback to localStorage
      const ordersKey = `orders_${uid}`;
      orders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
    }
  } catch (err) {
    console.error('Eroare la încărcare comenzi din Google Sheets:', err);
    // fallback to localStorage
    try {
      const ordersKey = `orders_${uid}`;
      orders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
    } catch (e) {
      console.error('Eroare la încărcare comenzi din localStorage:', e);
      document.getElementById("orders").innerHTML = '<div style="padding:20px; text-align:center; color:#999;">Eroare la încărcare comenzilor.</div>';
      return;
    }
  }
  // filter orders for the logged-in user
  const userEmail = (localStorage.getItem('email') || '').toLowerCase();
  orders = orders.filter(o => {
    const ouserEmail = (o.user && o.user.email) || o.email || '';
    const ouid = o.uid || '';
    return (ouserEmail && ouserEmail.toLowerCase() === userEmail) || (ouid && ouid === uid);
  });
  const resProd = await fetch('../data/products.json');
  const data = await resProd.json();
  const produse = Array.isArray(data) ? data : [];
  const htmlArr = await Promise.all(orders.map(o => generateOrderHTMLUser(o, produse)));
  document.getElementById("orders").innerHTML = htmlArr.length > 0 ? htmlArr.join("") : '<div style="padding:20px; text-align:center; color:#999;">Nu aveți comenzi.</div>';
  // Add toggle listeners for products
  document.querySelectorAll('[id^="toggleProducts-"]').forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.id.substring('toggleProducts-'.length);
      const extraDiv = document.getElementById(`extraProducts-${id}`);
      if (this.textContent === 'Ascunde') {
        extraDiv.style.display = 'none';
        this.textContent = 'Mai multe';
      } else {
        extraDiv.style.display = 'block';
        this.textContent = 'Ascunde';
      }
    });
  });
}

function getTotalQty(descriere) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(descriere, 'text/html');
  const lis = doc.querySelectorAll('li');
  let total = 0;
  lis.forEach(li => {
    const text = li.textContent;
    const parts = text.split(', ');
    const qtyStr = parts[parts.length - 1];
    const qty = parseInt(qtyStr) || 0;
    total += qty;
  });
  return total;
}

async function generateOrderHTMLUser(o, produse, isCompleted = false) {
  const user = o.user || { uid: o.uid, nume: o.user && o.user.nume ? o.user.nume : (o.email || o.uid), email: o.user && o.user.email ? o.user.email : (o.email || '') };
  user.nume = user.nume || user.email || user.uid || 'Utilizator';
  user.email = user.email || '';
  const cart = Array.isArray(o.cart) ? o.cart : (o.cartData ? JSON.parse(o.cartData) : []);
  const productItems = cart.map((c, index) => {
    const prod = produse.find(p => p.nume === c.nume);
    const isCustom = c.descriere && c.descriere.includes('<ul>');
    const imagine = prod ? (prod.imagine || prod.linkImagine) : '/pagini/pozeProduse/poza.jpg';
    const areReducere = prod && prod.reducere != null && prod.reducere !== "" && prod.pretRedus != null && prod.pretRedus !== "";
    let pretHTML = "";
    if (!areReducere) {
      pretHTML = `<p>Preț: ${c.pret} Lei</p>`;
    } else {
      pretHTML = `\n        <div style="display: flex; align-items: center; gap: 10px;">\n            <div class="pret-vechi">${prod.pret} Lei</div>\n            <div class="pret-redus">${prod.pretRedus} Lei</div>\n        </div>\n        <div class="badge-reducere">-${prod.reducere}% reducere</div>\n`;
    }
    const descriereHTML = prod ? `<p>${prod.descriere}</p>` : '';
    let detailsHTML = '';
    if (isCustom) {
      detailsHTML = `\n      <button onclick="toggleUserOrderDetails('${o.id}-${index}')" id="btn-user-${o.id}-${index}">Detalii ▶</button>\n      <div id="details-user-${o.id}-${index}" style="display: none; margin-top: 10px;">${c.descriere}</div>\n    `;
    } else if (prod && prod.detalii) {
      const dets = Array.isArray(prod.detalii) ? prod.detalii.map(detail => `<li>${detail}</li>`).join('') : prod.detalii.split('\n').map(line => line.trim()).filter(line => line).map(line => `<li>${line}</li>`).join('');
      detailsHTML = `\n      <button onclick="toggleUserOrderDetails('${o.id}-${index}')" id="btn-user-${o.id}-${index}">Detalii ▶</button>\n      <div id="details-user-${o.id}-${index}" style="display: none; margin-top: 10px; list-style: disc; padding-left: 20px;">${dets}</div>\n    `;
    }
    return `\n        <div style="border:1px solid #eee; padding:5px; margin:5px;" class="produs">\n          <img src="${(imagine||'').replace(/^\\/,'').replace(/^\.\//,'')}" width="100" alt="produs"><br>\n          <b>${c.nume}</b><br>\n          ${descriereHTML}\n          ${pretHTML}<br>\n          Cantitate: ${isCustom ? (getTotalQty(c.descriere) / 1000) + ' kg' : c.cantitate}<br>\n          ${detailsHTML}\n        </div>\n      `;
  });
  const visibleProducts = productItems.slice(0, 3).join('');
  const extraProducts = productItems.slice(3).join('');
  const toggleHTML = extraProducts ? `<button id="toggleProducts-${o.id}" class="extra">Mai multe</button>` : '';
  const extraHTML = extraProducts ? `<div id="extraProducts-${o.id}" style="display:none">${extraProducts}</div>` : '';
  const cancelHTML = isCompleted ? '' : `<button class="delete" onclick="cancelOrder('${o.id}')">Anulează</button>`;
  const imgSrc = (o.poza && o.poza.startsWith('http')) ? o.poza : (o.user && o.user.poza && o.user.poza.startsWith('http') ? o.user.poza : '');
  return `\n    <div class="order-item" data-id="${o.id}">\n        <div class="info">\n          <img class="user" src="${imgSrc}">\n          <div class="date">\n            <p>${user.nume}</p>\n            <p>Email: ${user.email || ''}</p>\n            ${o.phone ? `<p>Telefon: ${o.phone}</p>` : ''}\n            ${o.address ? `<p>Adresa: ${o.address}</p>` : ''}\n            ${o.message ? `<p>Mesaj: ${o.message}</p>` : ''}\n            <div class="status">${o.status}</div>\n          </div>\n        </div>\n        <div class="prod">${visibleProducts}${extraHTML}</div>\n        <div class="toggle">${toggleHTML}   ${cancelHTML}</div>\n    </div>\n  `;
}

window.toggleUserOrderDetails = function(key) {
  const detailsDiv = document.getElementById(`details-user-${key}`);
  const btn = document.getElementById(`btn-user-${key}`);
  if (detailsDiv.style.display === 'none') {
    detailsDiv.style.display = 'block';
    btn.innerHTML = 'Detalii ▼';
  } else {
    detailsDiv.style.display = 'none';
    btn.innerHTML = 'Detalii ▶';
  }
}

window.cancelOrder = async (id) => {
  if(!confirm("Anulezi comanda?")) return;
  try {
    // Request server to update order status to 'Anulat'
    await fetch('https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'updateOrderStatus', orderId: id, status: 'Anulat' })
    });
    console.log('Comandă anulată (cerere server):', id);
  } catch (err) { 
    console.error('Eroare la cancelOrder:', err); 
    alert('Eroare la anulare comanda.'); 
  }
  incarcaComenzi();
}
incarcaComenzi();

window.stergeComentariu = async (id) => {
  try {
    if (window.firestore && window.firestore.deleteComment) {
      await window.firestore.deleteComment(id);
    } else {
      const coms = JSON.parse(localStorage.getItem('comentarii') || '[]');
      const idx = coms.findIndex(c=>String(c.id)===String(id));
      if (idx!==-1) { coms.splice(idx,1); localStorage.setItem('comentarii', JSON.stringify(coms)); }
    }
  } catch(err) { console.error(err); }
  incarcaComentarii();
}

window.salveazaComent = async (id) => {
  const text = document.getElementById(`input${id}`).value;
  try {
    if (window.firestore && window.firestore.updateComment) {
      await window.firestore.updateComment(id, { text });
    } else {
      const coms = JSON.parse(localStorage.getItem('comentarii') || '[]');
      const idx = coms.findIndex(c=>String(c.id)===String(id));
      if (idx !== -1) { coms[idx].text = text; localStorage.setItem('comentarii', JSON.stringify(coms)); }
    }
  } catch(err) { console.error(err); alert('Eroare la salvare'); }
  incarcaComentarii();
}
