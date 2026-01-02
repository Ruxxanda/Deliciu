const uid = localStorage.getItem("uid");
const email = localStorage.getItem("email");
if(!uid || email!=="ruxanda.cujba07@gmail.com") location.href="../index.html";

async function loadAdminInfo(){
  const res = await fetch(`http://localhost:3000/user/${uid}`);
  const user = await res.json();
  // folosește cale absolută pentru poza implicită
  const poza = user.poza || "../imagini/poza.png";
  document.getElementById("adminInfo").innerHTML = `
    <img src="${poza}" width="80" style="border-radius:50%"><br>
    <b>${user.nume}</b>
  `;
}
loadAdminInfo();

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("uid");
  localStorage.removeItem("email");
  window.location.href = "../index.html";
}

async function loadAll(){
  const resU = await fetch("http://localhost:3000/allUsers");
  const users = await resU.json();
  document.getElementById("users").innerHTML = users
    .filter(u=>u.email!=="ruxanda.cujba07@gmail.com")
    .map(u => `
      <div style="border:1px solid #ccc;padding:8px;margin:6px">
        <img src="${u.poza || '../imagini/poza.png'}" width="60" style="border-radius:50%"><br>
        <b>${u.nume}</b> (${u.email})<br>
        ${u.telefon || ""} ${u.adresa || ""}<br>
        <button onclick="deleteUser('${u.uid}')">Șterge user</button>
      </div>
    `).join("");

  const resC = await fetch("http://localhost:3000/comentarii");
  const coms = await resC.json();
  document.getElementById("coms").innerHTML = coms.map(c => `
    <div style="border:1px solid #ddd;padding:6px;margin:6px">
      <img src="${c.poza}" width="40" style="border-radius:50%"> <b>${c.nume}</b><br>
      ${c.text}<br>
      <button onclick="deleteComent(${c.id})">Șterge comentariu</button>
    </div>
  `).join("");

  loadOrders();
}
loadAll();

window.deleteUser = async (uidDel) => {
  if(!confirm("Ștergi userul?")) return;
  await fetch(`http://localhost:3000/deleteUser/${uidDel}`,{method:"DELETE"});
  loadAll();
}

window.deleteComent = async (id) => {
  if(!confirm("Ștergi comentariul?")) return;
  await fetch(`http://localhost:3000/stergeComentariu/${id}`,{method:"DELETE"});
  loadAll();
}

async function loadOrders() {
  try {
    const res = await fetch("http://localhost:3000/comenzi");
    if (!res.ok) throw new Error(await res.text());
    const orders = await res.json();
    const resProd = await fetch("http://localhost:3000/api/produse");
    if (!resProd.ok) throw new Error(await resProd.text());
    const data = await resProd.json();
    const produse = data.products;
    const activeOrders = orders.filter(o => o.status !== 'efectuat');
    const completedOrders = orders.filter(o => o.status === 'efectuat');
    document.getElementById("orders").innerHTML = activeOrders.length > 0 ? activeOrders.map(o => generateOrderHTML(o, produse)).join("") : '<div style="padding:20px; text-align:center; color:#999;">Nu există comenzi active.</div>';
    document.getElementById("completedOrders").innerHTML = completedOrders.length > 0 ? completedOrders.map(o => generateOrderHTML(o, produse, true)).join("") : '<div style="padding:20px; text-align:center; color:#999;">Nu există comenzi efectuate.</div>';
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

function generateOrderHTML(o, produse, isCompleted = false) {
  const user = JSON.parse(o.userData);
  const cart = JSON.parse(o.cartData);
  const productsHTML = cart.map((c, index) => {
    const prod = produse.find(p => p.nume === c.nume);
    const isCustom = c.descriere && c.descriere.includes('<ul>');
    const imagine = prod ? prod.imagine : 'pagini/pozeProduse/poza.jpg';
    const detailsHTML = isCustom ? `
      <button onclick="toggleOrderDetails('${o.id}-${index}')" id="btn-${o.id}-${index}">Detalii ▶</button>
      <div id="details-${o.id}-${index}" style="display: none; margin-top: 10px;">${c.descriere}</div>
    ` : '';
    return `
      <div style="border:1px solid #eee; padding:5px; margin:5px;">
        <img src="http://localhost:3000/${imagine}" width="100" alt="produs"><br>
        <b>${c.nume}</b><br>
        Preț: ${c.pret} Lei<br>
        Cantitate: ${isCustom ? (getTotalQty(c.descriere) / 1000) + ' kg' : c.cantitate}<br>
        ${detailsHTML}
      </div>
    `;
  }).join('');
  const cancelHTML = isCompleted ? '' : `<button onclick="deleteOrder(${o.id})">Anulează</button>`;
  const bgColor = isCompleted ? 'background-color: lightgreen;' : '';
  return `
    <div class="order-item" data-id="${o.id}" style="border:1px solid #ccc; margin:10px; padding:10px; ${bgColor}">
      <h4>Comandă ${o.id}</h4>
      <p><img src="${user.poza || '../imagini/poza.png'}" width="50" style="border-radius:50%"> <b>${user.nume}</b> (${user.email})<br>${user.telefon || ''} ${user.adresa || ''}</p>
      <div style="display: flex; flex-wrap: wrap;">${productsHTML}</div>
      <select onchange="updateStatus(${o.id}, this.value)">
        <option value="în desfășurare" ${o.status === 'în desfășurare' ? 'selected' : ''}>în desfășurare</option>
        <option value="pe drum" ${o.status === 'pe drum' ? 'selected' : ''}>pe drum</option>
        <option value="efectuat" ${o.status === 'efectuat' ? 'selected' : ''}>efectuat</option>
      </select>
      ${cancelHTML}
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

window.toggleOrderDetails = function(key) {
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

window.updateStatus = async (id, status) => {
  await fetch(`http://localhost:3000/updateComanda/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  loadOrders();
}

window.deleteOrder = async (id) => {
  if(confirm("Anulezi comanda?")) {
    await fetch(`http://localhost:3000/comanda/${id}`, {method:"DELETE"});
    loadOrders();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAll();
});

// Context menu for orders (right-click -> Elimina comanda)
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
        if (confirm('Eliminați comanda?')) {
          await fetch(`http://localhost:3000/comanda/${id}`, { method: 'DELETE' });
          menu.style.display = 'none';
          loadOrders();
        }
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
    panel.innerHTML = '<h4>Selectează user</h4>' + users.filter(u => u.email !== 'ruxanda.cujba07@gmail.com').map(u => `<div onclick="selectUser('${u.uid}')" style="cursor:pointer; padding:5px;"><img src="${u.poza || '../imagini/poza.png'}" width="30"> ${u.nume}</div>`).join('') + '<div id="chatArea" style="display:none;"></div>';
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

window.toggleOrderDetails = function(key) {
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
