let uid = localStorage.getItem("uid");

function waitForUid(timeout = 3000, interval = 200) {
  return new Promise((resolve) => {
    if (localStorage.getItem('uid')) return resolve(true);
    const start = Date.now();
    const t = setInterval(() => {
      if (localStorage.getItem('uid')) {
        clearInterval(t);
        uid = localStorage.getItem('uid');
        return resolve(true);
      }
      if (Date.now() - start > timeout) {
        clearInterval(t);
        return resolve(false);
      }
    }, interval);
  });
}

async function incarcaDate() {
  const stored = localStorage.getItem(`user_${uid}`) || localStorage.getItem(`profile_${uid}`) || null;
  let user = null;
  if (stored) {
    try { user = JSON.parse(stored); } catch(e){ user = null; }
  }
  if (!user) {
    user = { uid, nume: localStorage.getItem('email') || uid, email: localStorage.getItem('email') || '' };
  }
  const poza = user.poza || user.photoURL || "../imagini/poza.png";
  const imgSrc = (poza && poza.startsWith('http')) ? poza : (poza || "../imagini/poza.png");
  const infoEl = document.getElementById("info");
  console.log('incarcaDate:', { uid, user });
  if (infoEl) {
    infoEl.innerHTML = `
      <img src="${imgSrc}" class="poza">
      <b>${user.nume || user.email || uid}</b>
      ${user.email || ''}
    `;
  }
}
waitForUid(2500).then(found => {
  if (!found) {
    console.warn('No uid found in localStorage after wait; redirecting to index.html');
    window.location.href = "../index.html";
  } else {
    incarcaDate();
  }
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    localStorage.removeItem("uid");
    localStorage.removeItem("email");
    window.location.href = "../index.html";
  };
}

const trimiteBtn = document.getElementById("trimiteComentariu");
if (trimiteBtn) {
  trimiteBtn.onclick = async () => {
    const comentInput = document.getElementById("comentariuText");
    const text = comentInput ? comentInput.value : '';
    if(!text) return;
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
    if (document.getElementById("comentariuText")) document.getElementById("comentariuText").value="";
    incarcaComentarii();
  } catch (err) {
    console.error('Eroare la trimitere comentariu', err);
    console.warn('Nu s-a putut salva comentariul. Încearcă din nou.');
  }
  };
}

async function incarcaComentarii(){
  try {
    let data = [];
    const userEmail = (localStorage.getItem('email') || '').toLowerCase();
    
    if (window.firestore && window.firestore.fetchAllComments) {
      try {
        const allComments = await window.firestore.fetchAllComments();
        data = allComments.filter(c => {
          const commentEmail = (c.email || '').toLowerCase();
          return commentEmail === userEmail;
        });
        console.log(`Loaded ${data.length} comments from Firebase for ${userEmail}`);
      } catch (firebaseErr) {
        console.error('Eroare la citire comentarii din Firebase:', firebaseErr);
        const all = JSON.parse(localStorage.getItem('comentarii') || '[]');
        data = all.filter(c => (c.email || '').toLowerCase() === userEmail || c.uid === uid);
      }
    } else {
      const all = JSON.parse(localStorage.getItem('comentarii') || '[]');
      data = all.filter(c => (c.email || '').toLowerCase() === userEmail || c.uid === uid);
    }
    
    const container = document.getElementById("listaComentarii");
    if (!container) return;
    container.innerHTML = data.map(c => `
      <div style="border:1px solid #ccc;margin:5px;padding:5px">
        <input type="text" value="${(c.text||'').replace(/"/g,'&quot;')}" id="input${c.id}" style="width:90%">
        <button class="save" onclick="salveazaComent('${c.id}')">
          <i class="fa-regular fa-circle-check"></i>
        </button>
        <button class="delete" onclick="stergeComentariu('${c.id}')">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join("");
  } catch (err) {
    console.error('Eroare la încărcare comentarii', err);
    const container = document.getElementById("listaComentarii");
    if (container) container.innerHTML = '<div style="padding:20px;color:#999">Nu s-au putut încărca comentariile.</div>';
  }
}

async function incarcaComenzi(){
  let orders = [];
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec?action=getAllOrders');
    const result = await response.json();
    if (result.success && Array.isArray(result.orders)) {
      orders = result.orders;
    } else {
      const ordersKey = `orders_${uid}`;
      orders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
    }
  } catch (err) {
    console.error('Eroare la încărcare comenzi din Google Sheets:', err);
    try {
      const ordersKey = `orders_${uid}`;
      orders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
    } catch (e) {
      console.error('Eroare la încărcare comenzi din localStorage:', e);
      document.getElementById("orders").innerHTML = '<div style="padding:20px; text-align:center; color:#999;">Eroare la încărcare comenzilor.</div>';
      return;
    }
  }
  const userEmail = (localStorage.getItem('email') || '').toLowerCase();
  orders = orders.filter(o => {
    const ouserEmail = (o.user && o.user.email) || o.email || '';
    const ouid = o.uid || '';
    return (ouserEmail && ouserEmail.toLowerCase() === userEmail) || (ouid && ouid === uid);
  });
  let produse = [];
  try {
    const resProd = await fetch('../data/products.json');
    if (!resProd.ok) {
      console.warn('products.json not found (user):', resProd.status);
      produse = [];
    } else {
      const data = await resProd.json();
      produse = Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.warn('Error fetching products.json (user):', e);
    produse = [];
  }
  const htmlArr = await Promise.all(orders.map(o => generateOrderHTMLUser(o, produse)));
  document.getElementById("orders").innerHTML = htmlArr.length > 0 ? htmlArr.join("") : '';
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
    const imagine = prod ? (prod.imagine || prod.linkImagine) : '/imagini/craft/craft.png';
    const areReducere = prod && prod.reducere != null && prod.reducere !== "" && prod.pretRedus != null && prod.pretRedus !== "";
    let pretHTML = "";
    if (!areReducere) {
      pretHTML = `<p>Preț: ${c.pret} Lei</p>`;
    } else {
      pretHTML = `\n        <div style="display: flex; align-items: center; gap: 10px;">\n            <div class="pret-vechi">${prod.pret} Lei</div>\n            <div class="pret-redus">${prod.pretRedus} Lei</div>\n        </div>\n        <div class="badge-reducere">-${prod.reducere}% reducere</div>\n`;
    }
    const descriereHTML = prod ? `<p>${prod.descriere}</p>` : '';
    const detailsHTML = '';
    let imgPath = (imagine || '').replace(/^\\/,'').replace(/^\.\//,'').replace(/^\//,'');
    if (imgPath && !imgPath.startsWith('http')) imgPath = `../${imgPath}`;
    const imgTagSrc = imgPath || '../imagini/craft/craft.png';
    return `\n        <div style="border:1px solid #eee; padding:5px; margin:5px; cursor:pointer;" class="produs" onclick="openProductPage('${encodeURIComponent(c.nume || '')}')">\n          <img src="${imgTagSrc}" width="100" alt="produs">\n          <b>${c.nume}</b>\n          ${descriereHTML}\n          ${pretHTML}\n          Cantitate: ${isCustom ? (getTotalQty(c.descriere) / 1000) + ' kg' : c.cantitate}\n        </div>\n      `;
  });
  const visibleProducts = productItems.slice(0, 3).join('');
  const extraProducts = productItems.slice(3).join('');
  const toggleHTML = extraProducts ? `<button id="toggleProducts-${o.id}" class="extra">Mai multe</button>` : '';
  const extraHTML = extraProducts ? `<div id="extraProducts-${o.id}" style="display:none">${extraProducts}</div>` : '';
  const cancelHTML = isCompleted ? '' : `<button class="delete" onclick="cancelOrder('${o.id}')">Anulează</button>`;
  let userImg = o.poza || (o.user && (o.user.poza || o.user.photoURL)) || '';
  if (userImg && !userImg.startsWith('http')) {
    userImg = userImg.replace(/^\\/,'').replace(/^\.\//,'').replace(/^\//,'');
    userImg = `../${userImg}`;
  }
  const imgSrc = userImg || '../imagini/poza.png';
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
  try {
    try {
      const el = document.querySelector(`.order-item[data-id="${id}"]`);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    } catch (e) { /* ignore DOM removal errors */ }
    await fetch('https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'updateOrderStatus', orderId: id, status: 'Anulat' })
    });
    console.log('Comandă anulată (cerere server):', id);
  } catch (err) { 
    console.error('Eroare la cancelOrder:', err); 
    console.error('Eroare la anulare comanda.'); 
  }
  incarcaComenzi();
}

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
  } catch(err) {
    console.error(err);
  }
  incarcaComentarii();
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    incarcaDate();
    incarcaComentarii();
    incarcaComenzi();
  }, 500);
});