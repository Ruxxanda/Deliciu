const uid = localStorage.getItem("uid");
const email = localStorage.getItem("email");
if (!uid || email !== "ruxanda.cujba07@gmail.com") location.href = "/Deliciu/index.html";

async function getUser(uid) {
  const stored = localStorage.getItem(`user_${uid}`) || localStorage.getItem(`profile_${uid}`) || null;
  if (!stored) return { uid, nume: uid, email: '' };
  try { return JSON.parse(stored); } catch (e) { return { uid, nume: uid, email: '' }; }
}

async function loadStats() {
  try {
    const keys = Object.keys(localStorage);
    let savedCount = 0;
    let cartCount = 0;
    keys.forEach(k => {
      if (k.startsWith('salvari_')) {
        const arr = JSON.parse(localStorage.getItem(k) || '[]');
        savedCount += arr.length;
      }
      if (k.startsWith('cart_')) {
        const arr = JSON.parse(localStorage.getItem(k) || '[]');
        cartCount += arr.reduce((s, i) => s + (i.cantitate || 0), 0);
      }
    });

    console.log("Saved count:", savedCount, "Cart count:", cartCount);
    document.getElementById("savedCount").textContent = savedCount;
    document.getElementById("cartCount").textContent = cartCount;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

async function loadAdminInfo() {
  try {
    const stored = localStorage.getItem(`user_${uid}`) || localStorage.getItem(`profile_${uid}`) || null;
    let user = null;
    if (stored) { try { user = JSON.parse(stored); } catch (e) { user = null; } }
    const poza = (user && (user.poza || user.photoURL)) || "../imagini/poza.png";
    const imgSrc = poza && poza.startsWith('http') ? poza : (poza || '../imagini/poza.png');
    document.getElementById("adminInfo").innerHTML = `
      <img class="poza" src="${imgSrc}"><br>
      <b>${(user && (user.nume || user.email)) || uid}</b>
    `;
  } catch (err) {
    const savedEmail = localStorage.getItem('email') || '';
    document.getElementById("adminInfo").innerHTML = `
      <img class="poza" src="../imagini/poza.png"><br>
      <b>${savedEmail || uid}</b>
    `;
  }
}
loadAdminInfo();

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("uid");
  localStorage.removeItem("email");
  window.location.href = "/Deliciu/index.html";
}

async function loadAll() {
  try {
    const coms = JSON.parse(localStorage.getItem('comentarii') || '[]');
    document.getElementById("coms").innerHTML = coms.length ? coms.map(c => {
      const imgSrc = c.poza && (c.poza.startsWith('http') || c.poza.startsWith('data:')) ? c.poza : (c.poza || '/imagini/poza.png');
      return `
      <div class="comentariu">
        <img src="${imgSrc}">
        <b>${c.nume}</b>
        <p>${c.text}</p>
        <button onclick="deleteComent(${c.id})">Șterge comentariu</button>
      </div>
    `;
    }).join("") : '<p>Comentarii indisponibile local.</p>';
  } catch (err) {
    document.getElementById("coms").innerHTML = '<p>Comentarii indisponibile local.</p>';
  }

  const comentarii = document.querySelectorAll('.comentariu');
  for (let i = 3; i < comentarii.length; i++) {
    comentarii[i].style.display = 'none';
  }
  const toggleBtn = document.getElementById('toggleComments');
  if (comentarii.length <= 3) {
    toggleBtn.style.display = 'none';
  } else {
    toggleBtn.style.display = 'block';
    toggleBtn.textContent = 'Mai multe';
  }

  loadOrders();
  loadProductsForReduction();
  loadStats();
}

loadAll();

document.getElementById('toggleComments').addEventListener('click', function () {
  const comentarii = document.querySelectorAll('.comentariu');
  const isExpanded = this.textContent === 'Ascunde';
  if (isExpanded) {
    for (let i = 3; i < comentarii.length; i++) {
      comentarii[i].style.display = 'none';
    }
    this.textContent = 'Mai multe';
  } else {
    for (let i = 3; i < comentarii.length; i++) {
      comentarii[i].style.display = '';
    }
    this.textContent = 'Ascunde';
  }
});

window.deleteComent = async (id) => {
  const coms = JSON.parse(localStorage.getItem('comentarii') || '[]');
  const idx = coms.findIndex(c => c.id == id);
  if (idx !== -1) { coms.splice(idx, 1); localStorage.setItem('comentarii', JSON.stringify(coms)); }
  loadAll();
}

async function loadOrders() {
  try {
    let orders = [];

    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec?action=getAllOrders');
      const result = await response.json();
      if (result.success && Array.isArray(result.orders)) {
        orders = result.orders;
        console.log('Comenzi încărcate din Google Sheets:', orders.length);
      } else {
        console.warn('Nu s-au putut încărca comenzile din Google Sheets, încerc localStorage');
        const keys = Object.keys(localStorage).filter(k => k.startsWith('orders_'));
        keys.forEach(k => {
          const userOrders = JSON.parse(localStorage.getItem(k) || '[]');
          orders = orders.concat(userOrders);
        });
      }
    } catch (err) {
      console.error('Eroare la fetch Google Sheets:', err);
      const keys = Object.keys(localStorage).filter(k => k.startsWith('orders_'));
      keys.forEach(k => {
        const userOrders = JSON.parse(localStorage.getItem(k) || '[]');
        orders = orders.concat(userOrders);
      });
    }

    const resProd = await fetch('../data/products.json');
    if (!resProd.ok) throw new Error(await resProd.text());
    const data = await resProd.json();
    const produse = Array.isArray(data) ? data : [];
    const activeOrders = orders.filter(o => (o.status || '').toString().toLowerCase() !== 'efectuat');
    const completedOrders = orders.filter(o => (o.status || '').toString().toLowerCase() === 'efectuat');
    const activeHTML = await Promise.all(activeOrders.map(o => generateOrderHTML(o, produse)));
    const completedHTML = await Promise.all(completedOrders.map(o => generateOrderHTML(o, produse, true)));
    document.getElementById("orders").innerHTML = activeHTML.length > 0 ? activeHTML.join("") : '<div style="padding:20px; text-align:center; color:#999;">Nu există comenzi active.</div>';
    document.getElementById("completedOrders").innerHTML = completedHTML.length > 0 ? completedHTML.join("") : '<div style="padding:20px; text-align:center; color:#999;">Nu există comenzi efectuate.</div>';
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
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

async function generateOrderHTML(o, produse, isCompleted = false) {
  const user = o.user || (await getUser(o.uid).catch(() => ({ nume: o.uid, email: '' })));
  user.nume = user.nume || user.email || user.uid || 'Utilizator';
  user.email = user.email || '';
  const cart = Array.isArray(o.cart) ? o.cart : (o.cartData ? JSON.parse(o.cartData) : []);
    const productItems = cart.map((c, index) => {
      const prod = produse.find(p => p.nume === c.nume);
      const isCustom = c.descriere && c.descriere.includes('<ul>');
      const imagine = prod ? (prod.imagine || prod.linkImagine) : './imagini/craft/craft.png';
      const areReducere = prod && prod.reducere != null && prod.reducere !== "" && prod.pretRedus != null && prod.pretRedus !== "";
      let pretHTML = "";
      if (!areReducere) {
        pretHTML = `<p>Preț: ${c.pret} Lei</p>`;
      } else {
        pretHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
              <div class="pret-vechi">${prod.pret} Lei</div>
              <div class="pret-redus">${prod.pretRedus} Lei</div>
          </div>
          <div class="badge-reducere">-${prod.reducere}% reducere</div>
        `;
      }
      const descriereHTML = prod ? `<p>${prod.descriere}</p>` : '';
      return `
        <div class="produs" onclick="goToProductDetails('${c.nume}')" style="cursor: pointer;">
          <img src="../${(imagine||'').replace(/^\//, '').replace(/^\.\//,'')}" width="100" alt="produs">
          <div class="infor">
              <p class="nume">${c.nume}</p>
              <p>${pretHTML}</p>
              <div class="cantitate-info" style="color:#888;font-size:0.95em; margin-bottom:8px;">${prod && prod.cantitate ? prod.cantitate : ''}</div>
              <p>${c.cantitate ? `x${c.cantitate}` : ''}</p>
          </div>
        </div>
      `;
    });
    const visibleProducts = productItems.slice(0, 3).join('');
    const extraProducts = productItems.slice(3).join('');
    const toggleHTML = extraProducts ? `<button id="toggleProducts-${o.id}" class="extra">Mai multe</button>` : '';
    const extraHTML = extraProducts ? `<div id="extraProducts-${o.id}" style="display:none">${extraProducts}</div>` : '';
    const cancelHTML = isCompleted ? '' : `<button class="delete" onclick="deleteOrder('${o.id}')">Anulează</button>`;
    return `
      <div class="order-item" data-id="${o.id}">
          <div class="info">
            <img class="user"
              src="${(o.poza && o.poza.startsWith('http')) ? o.poza : (o.user.poza && o.user.poza.startsWith('http') ? o.user.poza : '')}">
            <div class="date">
              <p>${user.nume}</p>
              <p>Email: ${user.email || ''}</p>
              ${o.phone ? `<p>Telefon: ${o.phone}</p>` : ''}
              ${o.address ? `<p>Adresa: ${o.address}</p>` : ''}
              ${o.message ? `<p>Mesaj: ${o.message}</p>` : ''}
              <select onchange="updateStatus('${o.id}', this.value)">
                <option value="În desfășurare" ${o.status === 'În desfășurare' ? 'selected' : ''}>În desfășurare</option>
                <option value="Pe drum" ${o.status === 'Pe drum' ? 'selected' : ''}>Pe drum</option>
                <option value="Efectuat" ${o.status === 'Efectuat' ? 'selected' : ''}>Efectuat</option>
              </select>
            </div>
          </div>
          <div class="prod">${visibleProducts}${extraHTML}</div>
          <div class="toggle">${toggleHTML}   ${cancelHTML}</div>
      </div>
    `;
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

window.toggleOrderDetails = function (key) {
  const detailsDiv = document.getElementById(`details-${key}`);
  const btn = document.getElementById(`btn-${key}`);
  if (detailsDiv.style.display === 'none') {
    detailsDiv.style.display = 'block';
    btn.innerHTML = 'Detalii ▼';
  } else {
    detailsDiv.style.display = 'none';
    btn.innerHTML = 'Detalii ▶';
  }
};

window.goToProductDetails = function (productName) {
  window.location.href = `tort.html?nume=${encodeURIComponent(productName)}`;
};

window.updateStatus = async (id, status) => {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'updateOrderStatus',
        orderId: id,
        status: status
      })
    });
    const result = await response.json();
    if (result.success) {
      console.log('Status actualizat în Google Sheets:', id, status);
    }

    const keys = Object.keys(localStorage).filter(k => k.startsWith('orders_'));
    keys.forEach(k => {
      const userOrders = JSON.parse(localStorage.getItem(k) || '[]');
      const order = userOrders.find(o => o.id == id);
      if (order) {
        order.status = status;
        localStorage.setItem(k, JSON.stringify(userOrders));
      }
    });
  } catch (err) {
    console.error('Eroare la updateStatus:', err);
  }
  loadOrders();
}

window.deleteOrder = async (id) => {
  try {
    const el = document.querySelector(`.order-item[data-id="${id}"]`);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  } catch (e) {  }

  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('orders_'));
    keys.forEach(k => {
      let userOrders = JSON.parse(localStorage.getItem(k) || '[]');
      userOrders = userOrders.filter(o => o.id != id);
      localStorage.setItem(k, JSON.stringify(userOrders));
    });

    console.log('Comandă ștearsă din localStorage:', id);
  } catch (err) {
    console.error('Eroare la deleteOrder:', err);
  }
  loadOrders();
}

async function loadProductsForReduction() {
  try {
    const res = await fetch('../data/products.json');
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const products = Array.isArray(data) ? data : [];
    const lang = (typeof getLang === 'function') ? getLang() : (document.documentElement.lang || 'ro');
    const checkboxes = products.map(p => {
      const displayName = p[`nume_${lang}`] || p.nume || p[`nume_ro`] || p.nume;
      const value = p.nume || displayName;
      return `
      <div class="product-card">
        <input type="checkbox" value="${value}" title="Selectează ${displayName}">
        <img src="../${(p.imagine || p.linkImagine || '').replace(/^\//,'').replace(/^\.\//,'')}" alt="${displayName}">
        <div class="product-name">${displayName}</div>
        <div class="product-price">${parseFloat(p.pret || 0).toFixed(2)} Lei</div>
      </div>
    `}).join("");
    document.getElementById("productsCheckboxes").innerHTML = checkboxes;
    
    // Add event listeners to product cards to toggle checkbox on click
    const productCards = document.querySelectorAll("#productsCheckboxes .product-card");
    productCards.forEach(card => {
      card.addEventListener("click", (e) => {
        const checkbox = card.querySelector("input[type='checkbox']");
        // Only toggle if clicking on the card but not directly on the checkbox
        if (checkbox && e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }
      });
      // Make cursor pointer on product card to indicate it's clickable
      card.style.cursor = "pointer";
    });
  } catch (error) {
    console.error("Error loading products for reduction:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAll();

  const reductionForm = document.getElementById("reductionForm");
  if (reductionForm) {
    reductionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const denumire = document.getElementById("reductionName").value;
      const descriere = document.getElementById("reductionDetails").value;
      const reducere = document.getElementById("reductionPercent").value;
      const dataStart = document.getElementById("dataStart").value;
      const dataEnd = document.getElementById("dataEnd").value;

      const checkboxes = document.querySelectorAll("#productsCheckboxes input[type='checkbox']:checked");
      const produse = Array.from(checkboxes).map(cb => cb.value);

      try {
        if (!window.firestore || !window.firestore.saveReduction) {
          setTimeout(() => reductionForm.dispatchEvent(new Event('submit')), 500);
          return;
        }

        await window.firestore.saveReduction({
          denumire,
          descriere,
          reducere: Number(reducere),
          produse,
          dataStart,
          dataEnd
        });

        reductionForm.reset();
        loadProductsForReduction();
        const btn = reductionForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Adăugat';
        btn.classList.add('adaugat');
        setTimeout(() => { btn.textContent = originalText; btn.classList.remove('adaugat'); }, 5000);
      } catch (error) {
        console.error("Error adding reduction:", error);
      }
    });
  }
});

(() => {
  const menu = document.createElement('div');
  menu.id = 'orderContextMenu';
  menu.style.position = 'absolute';
  menu.style.background = '#fff';
  menu.style.border = '1px solid #ccc';
  menu.style.padding = '6px';
  menu.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  menu.style.display = 'none';
  menu.style.zIndex = 10000;
  document.body.appendChild(menu);

  document.addEventListener('contextmenu', (e) => {
    const orderEl = e.target.closest('.order-item');
    if (orderEl) {
      e.preventDefault();
      const id = orderEl.dataset.id;
      menu.innerHTML = `<div id="ctx-delete" style="padding:6px 12px;cursor:pointer;">Elimina comanda</div>`;
      menu.style.top = (e.pageY) + 'px';
      menu.style.left = (e.pageX) + 'px';
      menu.style.display = 'block';

      const del = document.getElementById('ctx-delete');
      del.onclick = async () => {
        const comenzi = JSON.parse(localStorage.getItem('comenzi') || '[]');
        const idx = comenzi.findIndex(c => String(c.id) === String(id));
        if (idx !== -1) {
          comenzi.splice(idx, 1);
          localStorage.setItem('comenzi', JSON.stringify(comenzi));
        }
        menu.style.display = 'none';
        loadOrders();
      };
    } else {
      menu.style.display = 'none';
    }
  });

  document.addEventListener('click', () => { menu.style.display = 'none'; });
})();

function loadUserList() {
  fetch('http://localhost:3000/allUsers').then(r => r.json()).then(users => {
    const panel = document.getElementById("chatPanel");
    panel.innerHTML = '<h4>Selectează user</h4>' + users.filter(u => u.email !== 'ruxanda.cujba07@gmail.com').map(u => {
      const poza = u.poza || '/imagini/poza.png';
      const imgSrc = poza.startsWith('http') ? poza : `http://localhost:3000${poza}`;
      return `<div onclick="selectUser('${u.uid}')" style="cursor:pointer; padding:5px;"><img src="${imgSrc}" width="30"> ${u.nume}</div>`;
    }).join('') + '<div id="chatArea" style="display:none;"></div>';
  });
}

window.selectUser = (userUid) => {
  if (chatInterval) clearInterval(chatInterval);
  const panel = document.getElementById("chatPanel");
  panel.innerHTML = '<button onclick="backToList()">Înapoi</button><div id="messages" style="height:300px; overflow-y:auto;"></div><input id="msgInput" type="text" style="width:70%;"><button onclick="sendMessage(\'' + userUid + '\')">📤</button>';
  loadMessages(ADMIN_UID, userUid);
  chatInterval = setInterval(() => loadMessages(ADMIN_UID, userUid), 5000);
}

window.backToList = () => {
  if (chatInterval) {
    clearInterval(chatInterval);
    chatInterval = null;
  }
  loadUserList();
}

window.sendMessage = (toUid) => {
  const msg = document.getElementById("msgInput").value;
  if (!msg) return;
  fetch('http://localhost:3000/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from_uid: localStorage.getItem("uid"), to_uid: toUid, message: msg }) });
  document.getElementById("msgInput").value = '';
  loadMessages(ADMIN_UID, toUid);
}

window.toggleOrderDetails = function (key) {
  const detailsDiv = document.getElementById(`details-${key}`);
  const btn = document.getElementById(`btn-${key}`);
  if (detailsDiv.style.display === 'none') {
    detailsDiv.style.display = 'block';
    btn.innerHTML = 'Detalii ▼';
  } else {
    detailsDiv.style.display = 'none';
    btn.innerHTML = 'Detalii ▶';
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    input.addEventListener('click', function (e) {
      this.showPicker();
    });
  });
});
