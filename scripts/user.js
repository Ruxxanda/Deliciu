const uid = localStorage.getItem("uid");
if(!uid) window.location.href="/index.html";

async function incarcaDate() {
  const res = await fetch(`http://localhost:3000/user/${uid}`);
  const user = await res.json();
  // foloseste cale absoluta pentru poza implicita
  const poza = user.poza || "../imagini/poza.png";
  document.getElementById("info").innerHTML = `
    <img src="${poza}" width="80" style="border-radius:50%"><br>
    <b>${user.nume}</b><br>${user.email}<br>${user.telefon || ""}<br>${user.adresa || ""}
  `;
}
incarcaDate();

document.getElementById("editBtn").onclick = () => window.location.href = "../pagini/edit.html";
document.getElementById("logoutBtn").onclick = async () => {
  localStorage.removeItem("uid");
  localStorage.removeItem("email");
  window.location.href = "../index.html";
};

document.getElementById("trimiteComentariu").onclick = async () => {
  const text = document.getElementById("comentariuText").value;
  if(!text) return;
  await fetch("http://localhost:3000/adaugaComentariu", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({uid,text})
  });
  document.getElementById("comentariuText").value="";
  incarcaComentarii();
};

async function incarcaComentarii(){
  const res = await fetch(`http://localhost:3000/comentariiUser/${uid}`);
  const data = await res.json();
  document.getElementById("listaComentarii").innerHTML = data.map(c => `
    <div style="border:1px solid #ccc;margin:5px;padding:5px">
      <input type="text" value="${c.text}" id="input${c.id}" style="width:70%">
      <button onclick="salveazaComent(${c.id})">Salvează</button>
      <button onclick="stergeComentariu(${c.id})">Șterge</button>
    </div>
  `).join("");
}
incarcaComentarii();

async function incarcaComenzi(){
  const res = await fetch(`http://localhost:3000/userComenzi/${uid}`);
  const orders = await res.json();
  const resProd = await fetch("http://localhost:3000/api/produse");
  const data = await resProd.json();
  const produse = data.products;
  document.getElementById("userOrders").innerHTML = orders.length > 0 ? orders.map(o => {
    const cart = JSON.parse(o.cartData);
    const productsHTML = cart.map((c, index) => {
      const prod = produse.find(p => p.nume === c.nume);
      const isCustom = c.descriere && c.descriere.includes('<ul>');
      const imagine = prod ? prod.imagine : 'pagini/pozeProduse/poza.jpg';
      const detailsHTML = isCustom ? `
        <button onclick="toggleUserOrderDetails('${o.id}-${index}')" id="btn-user-${o.id}-${index}">Detalii ▶</button>
        <div id="details-user-${o.id}-${index}" style="display: none; margin-top: 10px;">${c.descriere}</div>
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
    return `
      <div style="border:1px solid #ccc; margin:10px; padding:10px">
        <h4>Comandă ${o.id}</h4>
        <p>Status: ${o.status}</p>
        <div style="display: flex; flex-wrap: wrap;">${productsHTML}</div>
        ${o.status !== 'efectuat' ? `<button onclick="cancelOrder(${o.id})">Anulează</button>` : ''}
      </div>
    `;
  }).join("") : '<div style="padding:20px; text-align:center; color:#999;">Nu aveți comenzi.</div>';
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
  if(confirm("Anulezi comanda?")) {
    await fetch(`http://localhost:3000/comanda/${id}`, {method:"DELETE"});
    incarcaComenzi();
  }
}
incarcaComenzi();

window.stergeComentariu = async (id) => {
  await fetch(`http://localhost:3000/stergeComentariu/${id}`,{method:"DELETE"});
  incarcaComentarii();
}

window.salveazaComent = async (id) => {
  const text = document.getElementById(`input${id}`).value;
  await fetch(`http://localhost:3000/updateComentariu/${id}`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({text})
  });
  incarcaComentarii();
}
