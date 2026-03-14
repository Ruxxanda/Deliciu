let uid = null;

function getUid() {
  uid = localStorage.getItem("uid");
  return uid;
}

/* ==============================
   Așteaptă UID din Firebase
============================== */

function waitForUid(timeout = 4000, interval = 200) {
  return new Promise(resolve => {

    if (getUid()) return resolve(true);

    const start = Date.now();

    const t = setInterval(() => {

      if (getUid()) {
        clearInterval(t);
        return resolve(true);
      }

      if (Date.now() - start > timeout) {
        clearInterval(t);
        resolve(false);
      }

    }, interval);

  });
}



/* ==============================
   Încarcă profil user
============================== */

async function incarcaDate() {

  getUid();

  const stored =
    localStorage.getItem(`user_${uid}`) ||
    localStorage.getItem(`profile_${uid}`);

  let user = null;

  if (stored) {
    try {
      user = JSON.parse(stored);
    } catch {
      user = null;
    }
  }

  if (!user) {

    user = {
      uid,
      nume: localStorage.getItem("email") || uid,
      email: localStorage.getItem("email") || ""
    };

  }

  const poza =
    user.poza ||
    user.photoURL ||
    "../imagini/poza.png";

  const imgSrc =
    poza && poza.startsWith("http")
      ? poza
      : poza;

  const info = document.getElementById("info");

  if (!info) return;

  info.innerHTML = `
        <img src="${imgSrc}" class="poza">
        <b>${user.nume || user.email}</b>
        ${user.email || ""}
    `;

}



/* ==============================
   LOGOUT
============================== */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.onclick = () => {

    localStorage.removeItem("uid");
    localStorage.removeItem("email");

    window.location.href = "../index.html";

  };

}



/* ==============================
   COMENTARII USER
============================== */

async function incarcaComentarii() {

  const container = document.getElementById("listaComentarii");
  if (!container) return;

  const userEmail =
    (localStorage.getItem("email") || "").toLowerCase();

  let data = [];

  try {

    if (window.firestore?.fetchAllComments) {

      const all = await window.firestore.fetchAllComments();

      data = all.filter(c =>
        (c.email || "").toLowerCase() === userEmail ||
        c.uid === uid
      );

    } else {

      const all =
        JSON.parse(localStorage.getItem("comentarii") || "[]");

      data = all.filter(c =>
        (c.email || "").toLowerCase() === userEmail ||
        c.uid === uid
      );

    }

  } catch (err) {

    console.error("Eroare comentarii:", err);

  }

  container.innerHTML = data.map(c => {

    const avatar = c.poza || "../imagini/poza.png";

    const author =
      c.nume ||
      c.email ||
      "Utilizator";

    return `
    <div class="comment-item">

      <img class="comment-avatar" src="${avatar}">

      <div class="comment-body">

        <div class="comment-author">
            ${author}
        </div>

        <textarea
            id="input${c.id}"
            class="comment-text"
        >${c.text || ""}</textarea>

        <div class="comment-actions">

            <button onclick="salveazaComent('${c.id}')">
            Salvează
            </button>

            <button onclick="stergeComentariu('${c.id}')">
            Șterge
            </button>

        </div>

      </div>

    </div>
    `;

  }).join("");

}



/* ==============================
   ȘTERGE COMENTARIU
============================== */

window.stergeComentariu = async id => {

  try {

    if (window.firestore?.deleteComment) {

      await window.firestore.deleteComment(id);

    }

  } catch (err) {

    console.error(err);

  }

  incarcaComentarii();

};



/* ==============================
   SALVEAZĂ COMENTARIU
============================== */

window.salveazaComent = async id => {

  const text =
    document.getElementById(`input${id}`).value;

  try {

    if (window.firestore?.updateComment) {

      await window.firestore.updateComment(id, { text });

    }

  } catch (err) {

    console.error(err);

  }

  incarcaComentarii();

};



/* ==============================
   COMENZI USER
============================== */

async function incarcaComenzi() {

  const container = document.getElementById("orders");
  if (!container) return;

  let orders = [];

  try {

    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec?action=getAllOrders"
    );

    const data = await res.json();

    if (data.success) {

      orders = data.orders;

    }

  } catch (err) {

    console.warn("Server indisponibil");

  }

  const userEmail =
    (localStorage.getItem("email") || "").toLowerCase();

  orders = orders.filter(o =>

    (o.email || "").toLowerCase() === userEmail ||
    o.uid === uid

  );

  container.innerHTML = orders.map(o => {

    const user =
      o.user || { email: o.email };

    return `
    <div class="order-item">

      <div class="info">

        <b>${user.email || ""}</b>

        <div class="status">
            ${o.status}
        </div>

      </div>

    </div>
    `;

  }).join("");

}



/* ==============================
   INIT
============================== */

document.addEventListener("DOMContentLoaded", async () => {

  const found = await waitForUid();

  if (!found) {

    console.warn("User nelogat");

    window.location.href = "../index.html";

    return;

  }

  incarcaDate();
  incarcaComentarii();
  incarcaComenzi();

});
