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
    const resp = await fetch("../data/products.json");
    if (!resp.ok) {
      console.warn("products.json not found (cos):", resp.status);
      produse = [];
    } else {
      const data = await resp.json();
      produse = Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.warn("Error fetching products.json (cos):", e);
    produse = [];
  }
  const cosProd = cosItems.map((item) => {
    const prod = produse.find((p) => p.nume === item.nume);
    let totalQty = 0;
    if (!prod) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(item.descriere, "text/html");
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
      return { ...prod, cantitate: item.cantitate, isCraft: !!item.isCraft };
    } else {
      return {
        nume: item.nume,
        imagine: "/imagini/craft/craft.png",
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
  div.innerHTML = "";
  const formatPrice = (price) => parseFloat(price || 0).toFixed(2);
  cosProd.forEach((p, index) => {
    const prodObj = produse.find((prod) => prod.nume === p.nume);
    const isCustom = !prodObj;
    const areReducere =
      p.reducere != null &&
      p.reducere !== "" &&
      p.pretRedus != null &&
      p.pretRedus !== "";
        let pretHTML = "";
    if (!areReducere) {
      pretHTML = `<span>${formatPrice(p.pret)} Lei</span>`;
    } else {
      pretHTML = `\n<div>\n    <div style="display: flex; align-items: center; gap: 10px;">\n        <div class="pret-vechi">${formatPrice(p.pret)} Lei</div>\n        <div class="pret-redus">${formatPrice(p.pretRedus)} Lei</div>\n    </div>\n    <div class="badge-reducere">-${p.reducere}% reducere</div>\n</div>\n`;
    }
    const card = document.createElement("div");
    card.classList.add("produs", "cos-item");
    let detailsHTML = "";
    if (isCustom && !p.isCraft) {
      detailsHTML = `\n <button class="detalii" onclick="toggleDetails(${index})" id="btn-${index}">Detalii ▶</button>\n
      <div id="details-${index}" style="display: none; margin-top: 10px;">${p.fullDescriere}</div>\n`;
    }
    const imagePath = p.imagine || p.linkImagine || "/imagini/craft/craft.png";
        card.innerHTML = `\n
    <div class="img-wrapper">\n
    <img src="../${(imagePath || "").replace(/^\\/, "").replace(/^\.\//, "")}" alt="produs">\n
    ${areReducere ? `<div class="badge-reducere">-${p.reducere}%</div>` : ""}\n
        <p class="cantitate">x${p.isCraft ? 1 : (isCustom ? p.totalQty / 1000 + " kg" : p.cantitate)}</p>\n
    </div>\n
    <h3>${p.nume}</h3>\n
    <!-- descriere eliminată -->\n
    <div class="pret-info">${pretHTML}</div>\n 
    <div class="cantitate-info" style="color:#888;font-size:0.95em;">${isCustom ? (p.totalQty ? p.totalQty / 1000 + " kg" : "") : prodObj && prodObj.cantitate ? prodObj.cantitate : ""}</div>\n
    ${detailsHTML}\n<div class="actiuni">\n
    <button class="sterge-cos" onclick="toggleCos('${p.nume}', ${p.cantitate})">\n
    <i class="fa fa-trash"></i> Șterge\n
    </button>\n
    </div>`;
    div.appendChild(card);
    card.addEventListener("click", function (e) {
      if (
        e.target.closest(".img-wrapper") ||
        e.target.closest(".actiuni") ||
        e.target.closest(".detalii") ||
        e.target.closest("button") ||
        e.target.closest(".sterge-cos")
      )
        return;
      window.location.href = `tort.html?nume=${encodeURIComponent(p.nume)}`;
    });
  });
}
async function toggleDetails(index) {
  const detailsDiv = document.getElementById(`details-${index}`);
  const btn = document.getElementById(`btn-${index}`);
  if (detailsDiv.style.display === "none") {
    detailsDiv.style.display = "block";
    btn.innerHTML = "Detalii ▼";
  } else {
    detailsDiv.style.display = "none";
    btn.innerHTML = "Detalii ▶";
  }
}

async function toggleCos(nume, currentCantitate) {
  const uid = getStorageUid();
  const key = `cart_${uid}`;
  let cart = JSON.parse(localStorage.getItem(key) || "[]");
  const idx = cart.findIndex((i) => i.nume === nume);
  if (idx === -1) return afiseazaCos();
  if (currentCantitate > 1) {
    cart[idx].cantitate = Math.max(0, cart[idx].cantitate - 1);
    if (cart[idx].cantitate === 0) cart.splice(idx, 1);
  } else {
    cart.splice(idx, 1);
  }
  localStorage.setItem(key, JSON.stringify(cart));
  afiseazaCos();
  try {
    if (typeof loadStats === "function") loadStats();
    else if (window && window.loadStats) window.loadStats();
    else
      setTimeout(() => {
        if (typeof loadStats === "function") loadStats();
      }, 200);
  } catch (e) {}
}

async function placeOrder() {
  const uid = getStorageUid();
  if (!uid || uid === "guest") {
    const errEl = document.getElementById("error");
    if (errEl)
      errEl.textContent = "Trebuie să vă logați pentru a realiza comanda.";
    return;
  }
  const cartKey = `cart_${uid}`;
  const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
  if (!cart || cart.length === 0) {
    console.error("Coșul este gol!");
    return;
  }

  const phoneEl = document.getElementById("phoneInput");
  innerHTML = `
                <p class="cantitate" style="color:#e74c3c;font-weight:600;">x${p.cantitate}</p>
                <div class="cantitate-info" style="color:#888;font-size:0.95em;">${produse.find((prod) => prod.nume === p.nume)?.cantitate || ""}
                </div>`;
  const messageEl = document.getElementById("messageInput");

  const phone = phoneEl ? phoneEl.value.trim() : "";
  const address = addressEl ? addressEl.value.trim() : "";
  const message = messageEl ? messageEl.value.trim() : "";

  // Clear previous invalid markers
  if (phoneEl) phoneEl.classList.remove("invalid");
  if (addressEl) addressEl.classList.remove("invalid");
  const errEl = document.getElementById("error");
  if (errEl) errEl.textContent = "";

  if (!phone || !address) {
    if (!phone && phoneEl) phoneEl.classList.add("invalid");
    if (!address && addressEl) addressEl.classList.add("invalid");
    if (errEl) errEl.textContent = "Te rog completează telefon și adresă!";
    if (!phone && phoneEl) phoneEl.focus();
    else if (!address && addressEl) addressEl.focus();
    return;
  }

  const stored =
    localStorage.getItem(`user_${uid}`) ||
    localStorage.getItem(`profile_${uid}`) ||
    null;
  let userInfo = { uid, email: localStorage.getItem("email") || "" };
  if (stored) {
    try {
      userInfo = JSON.parse(stored);
    } catch (e) {}
  }
  const user = {
    uid: userInfo.uid || uid,
    email: userInfo.email,
    nume: userInfo.nume,
    poza: userInfo.poza || userInfo.photoURL || "/imagini/poza.png",
  };

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
    status: "În desfășurare",
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "saveOrder",
          data: JSON.stringify(orderPayload),
        }),
      },
    );
    const result = await response.json();
    console.log("Comandă trimisă la Google Sheets:", result);
  } catch (err) {
    console.error("Eroare la trimitere către Google Sheets:", err);
  }

  localStorage.removeItem(cartKey);
  if (phoneEl) phoneEl.value = "";
  if (addressEl) addressEl.value = "";
  if (messageEl) messageEl.value = "";
  if (errEl) errEl.textContent = "";
  afiseazaCos();
  console.log("Comandă plasată cu succes!");
  try {
    if (typeof loadStats === "function") loadStats();
  } catch (e) {}
}

document.addEventListener("DOMContentLoaded", () => {
  afiseazaCos();
  const btn = document.getElementById("placeOrderBtn");
  if (btn) btn.onclick = placeOrder;

  const phoneEl = document.getElementById("phoneInput");
  const addrEl = document.getElementById("addressInput");
  const msgEl = document.getElementById("messageInput");
  const errorP = document.getElementById("error");
  const removeInvalid = (e) => {
    if (e.target.value && e.target.value.trim() !== "")
      e.target.classList.remove("invalid");
    if (errorP) errorP.textContent = "";
  };
  if (phoneEl) phoneEl.addEventListener("input", removeInvalid);
  if (addrEl) addrEl.addEventListener("input", removeInvalid);
  if (msgEl) msgEl.addEventListener("input", removeInvalid);
});
