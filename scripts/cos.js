function getStorageUid() {
  return localStorage.getItem("uid") || "guest";
}

async function afiseazaCos() {

  const uid = getStorageUid();
  let cosItems = JSON.parse(localStorage.getItem(`cart_${uid}`) || "[]");

  cosItems = cosItems.filter((item) => item.cantitate > 0);
  localStorage.setItem(`cart_${uid}`, JSON.stringify(cosItems));

  let produse = [];

  try {

    const resp = await fetch("/Deliciu/data/products.json");

    if (!resp.ok) {
      console.warn("products.json not found:", resp.status);
      produse = [];
    } else {
      produse = await resp.json();
    }

  } catch (e) {
    console.warn("Error fetching products.json:", e);
    produse = [];
  }

  const cosProd = cosItems.map((item) => {

    const prod = produse.find((p) => p.nume === item.nume);

    let totalQty = 0;

    if (!prod) {

      const parser = new DOMParser();
      const doc = parser.parseFromString(item.descriere || "", "text/html");

      const lis = doc.querySelectorAll("li");

      lis.forEach((li) => {

        const text = li.textContent;
        const parts = text.split(", ");

        const qtyStr = parts[parts.length - 1];

        const qty = parseInt(qtyStr) || 0;

        totalQty += qty;

      });

    }

    if (prod) {
      // Asigură calea corectă pentru imagine
      let img = prod.imagine || prod.linkImagine || "/Deliciu/imagini/craft/craft.png";
      if (img.startsWith("./")) img = img.replace("./", "/Deliciu/");
      return { ...prod, imagine: img, cantitate: item.cantitate, isCraft: !!item.isCraft };
    } else {

      return {
        nume: item.nume,
        imagine: "/Deliciu/imagini/craft/craft.png",
        descriere: "Produs personalizat",
        pret: item.pret,
        cantitate: item.cantitate,
        fullDescriere: item.descriere,
        totalQty,
        isCraft: !!item.isCraft,
      };

    }

  });

  const div = document.getElementById("cosDisplay");
  if (!div) return;

  div.innerHTML = "";

  const formatPrice = (price) => parseFloat(price || 0).toFixed(2);

  let total = 0;

  cosProd.forEach((p) => {
    const card = document.createElement("div");
    card.classList.add("produs", "cos-item");
    const imagePath = p.imagine || "/Deliciu/imagini/craft/craft.png";
    card.innerHTML = `
      <div class="img-wrapper">
        <img src="${imagePath}" alt="produs">
        <p class="cantitate">x${p.cantitate}</p>
      </div>
      <h3>${p.nume}</h3>
      <div class="pret-info">${formatPrice(p.pret)} Lei</div>
      <div class="actiuni">
        <button class="sterge-cos" onclick="toggleCos('${p.nume}', ${p.cantitate})">
          <i class="fa fa-trash"></i> Șterge
        </button>
      </div>
    `;
    card.style.cursor = "pointer";
    card.onclick = function(e) {
      // Prevent click if trash button is pressed
      if (e.target.closest('.sterge-cos')) return;
      window.location.href = `../pagini/tort.html?nume=${encodeURIComponent(p.nume || '')}`;
    };
    div.appendChild(card);
    // Adaugă la total
    total += (parseFloat(p.pret) || 0) * (parseInt(p.cantitate) || 1);
  });

  // Creează și afișează elementul pentru total
  const totalDiv = document.createElement("div");
  totalDiv.className = "cos-total";
  totalDiv.style.marginTop = "20px";
  totalDiv.style.fontWeight = "bold";
  totalDiv.style.fontSize = "1.2em";
  totalDiv.textContent = `Total: ${formatPrice(total)} Lei`;
  div.appendChild(totalDiv);
}

function toggleCos(nume, currentCantitate) {

  const uid = getStorageUid();

  const key = `cart_${uid}`;

  let cart = JSON.parse(localStorage.getItem(key) || "[]");

  const idx = cart.findIndex((i) => i.nume === nume);

  if (idx === -1) return;

  if (currentCantitate > 1) {

    cart[idx].cantitate--;

  } else {

    cart.splice(idx, 1);

  }

  localStorage.setItem(key, JSON.stringify(cart));

  afiseazaCos();

}

async function placeOrder() {

  const uid = getStorageUid();
  const email = localStorage.getItem("email") || "";
  let nume = "";
  let poza = "";
  try {
    const userData = JSON.parse(localStorage.getItem(`user_${uid}`) || '{}');
    nume = userData.nume || "";
    poza = userData.poza || userData.photoURL || "";
  } catch (e) {}

  // Dacă nu există uid sau email, nu ești logat(ă)
  if (!uid || uid === "guest" || !email) {
    const errEl = document.getElementById("error");
    if (errEl)
      errEl.textContent = "Trebuie să vă logați pentru a realiza comanda.";
    return;
  }

  const cartKey = `cart_${uid}`;

  const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");

  if (!cart.length) {

    console.log("Coș gol");

    return;

  }

  const phoneEl = document.getElementById("phoneInput");
  const addressEl = document.getElementById("addressInput");
  const messageEl = document.getElementById("messageInput");

  const phone = phoneEl ? phoneEl.value.trim() : "";
  const address = addressEl ? addressEl.value.trim() : "";
  const message = messageEl ? messageEl.value.trim() : "";

  const errEl = document.getElementById("error");
  if (errEl) errEl.textContent = "";

  if (!phone || !address) {

    if (errEl) errEl.textContent = "Completează telefon și adresă.";

    return;

  }

  const orderPayload = {
    id: Date.now().toString(),
    uid,
    nume,
    email,
    poza,
    cart,
    phone,
    address,
    message,
    status: "În desfășurare",
    createdAt: new Date().toISOString(),
  };

  try {

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "saveOrder",
          data: JSON.stringify(orderPayload),
        }),
      }
    );

    const result = await response.json();

    console.log("Order saved:", result);

  } catch (err) {

    console.error("Eroare trimitere comandă:", err);

  }

  localStorage.removeItem(cartKey);

  if (phoneEl) phoneEl.value = "";
  if (addressEl) addressEl.value = "";
  if (messageEl) messageEl.value = "";

  afiseazaCos();

}

document.addEventListener("DOMContentLoaded", () => {

  afiseazaCos();

  const btn = document.getElementById("placeOrderBtn");

  if (btn) btn.onclick = placeOrder;

});
