const uid = localStorage.getItem("uid");
const email = localStorage.getItem("email");

const ADMIN_EMAILS = [
"ruxanda.cujba07@gmail.com",
"ursumarina@gmail.com"
];

if (!uid || !ADMIN_EMAILS.includes(email)) {
location.href = "/Deliciu/index.html";
}

async function getUser(uid) {

const stored =
localStorage.getItem(`user_${uid}`) ||
localStorage.getItem(`profile_${uid}`) ||
null;

if (!stored) return { uid, nume: uid, email: "" };

try {
return JSON.parse(stored);
} catch {
return { uid, nume: uid, email: "" };
}

}

async function loadStats() {

try {

const keys = Object.keys(localStorage);

let savedCount = 0;
let cartCount = 0;

keys.forEach((k) => {

if (k.startsWith("salvari_")) {
const arr = JSON.parse(localStorage.getItem(k) || "[]");
savedCount += arr.length;
}

if (k.startsWith("cart_")) {
const arr = JSON.parse(localStorage.getItem(k) || "[]");
cartCount += arr.reduce((s, i) => s + (i.cantitate || 0), 0);
}

});

document.getElementById("savedCount").textContent = savedCount;
document.getElementById("cartCount").textContent = cartCount;

} catch (error) {

console.error("Error loading stats:", error);

}

}

async function loadAdminInfo() {

try {

const stored =
localStorage.getItem(`user_${uid}`) ||
localStorage.getItem(`profile_${uid}`) ||
null;

let user = null;

if (stored) {
try {
user = JSON.parse(stored);
} catch {
user = null;
}
}

const poza =
(user && (user.poza || user.photoURL)) ||
"/Deliciu/imagini/poza.png";

document.getElementById("adminInfo").innerHTML = `
<img class="poza" src="${poza}">
<br>
<b>${(user && (user.nume || user.email)) || uid}</b>
`;

} catch {

const savedEmail = localStorage.getItem("email") || "";

document.getElementById("adminInfo").innerHTML = `
<img class="poza" src="/Deliciu/imagini/poza.png">
<br>
<b>${savedEmail || uid}</b>
`;

}

}

document.getElementById("logoutBtn").onclick = () => {

localStorage.removeItem("uid");
localStorage.removeItem("email");

window.location.href = "/Deliciu/index.html";

};

async function loadOrders() {

try {

const response = await fetch(
"https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec?action=getAllOrders"
);

const result = await response.json();

let orders = [];

if (result.success && Array.isArray(result.orders)) {
orders = result.orders;
}

const resProd = await fetch("/Deliciu/data/products.json");

const produse = await resProd.json();

const activeOrders = orders.filter(
(o) => (o.status || "").toLowerCase() !== "efectuat"
);

const completedOrders = orders.filter(
(o) => (o.status || "").toLowerCase() === "efectuat"
);

const activeHTML = await Promise.all(
activeOrders.map((o) => generateOrderHTML(o, produse))
);

const completedHTML = await Promise.all(
completedOrders.map((o) => generateOrderHTML(o, produse, true))
);

document.getElementById("orders").innerHTML =
activeHTML.length > 0
? activeHTML.join("")
: '<div style="padding:20px;text-align:center;color:#999;">Nu există comenzi active.</div>';

document.getElementById("completedOrders").innerHTML =
completedHTML.length > 0
? completedHTML.join("")
: '<div style="padding:20px;text-align:center;color:#999;">Nu există comenzi efectuate.</div>';

} catch (error) {

console.error("Error loading orders:", error);

}

}

async function generateOrderHTML(o, produse, isCompleted = false) {

const user = o.user || { nume: "Utilizator", email: "" };

const cart = Array.isArray(o.cart)
? o.cart
: o.cartData
? JSON.parse(o.cartData)
: [];

const productItems = cart
.map((c) => {

const prod = produse.find((p) => p.nume === c.nume);

const imagine = prod
? prod.imagine || prod.linkImagine
: "/Deliciu/imagini/craft/craft.png";

return `
<div class="produs">

<img src="${imagine}" width="100">

<div class="infor">

<p class="nume">${c.nume}</p>

<p>Preț: ${c.pret} Lei</p>

<p>x${c.cantitate}</p>

</div>

</div>
`;

})
.join("");

const cancelHTML = isCompleted
? ""
: `<button class="delete" onclick="deleteOrder('${o.id}')">Anulează</button>`;

return `

<div class="order-item" data-id="${o.id}">

<div class="info">

<img class="user" src="${
o.poza || "/Deliciu/imagini/poza.png"
}">

<div class="date">

<p>${user.nume}</p>

<p>Email: ${user.email || ""}</p>

${o.phone ? `<p>Telefon: ${o.phone}</p>` : ""}

${o.address ? `<p>Adresa: ${o.address}</p>` : ""}

${o.message ? `<p>Mesaj: ${o.message}</p>` : ""}

<select onchange="updateStatus('${o.id}', this.value)">

<option value="În desfășurare" ${
o.status === "În desfășurare" ? "selected" : ""
}>În desfășurare</option>

<option value="Pe drum" ${
o.status === "Pe drum" ? "selected" : ""
}>Pe drum</option>

<option value="Efectuat" ${
o.status === "Efectuat" ? "selected" : ""
}>Efectuat</option>

</select>

</div>

</div>

<div class="prod">${productItems}</div>

<div>${cancelHTML}</div>

</div>

`;

}

window.updateStatus = async (id, status) => {

try {

await fetch(
"https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec",
{
method: "POST",
headers: { "Content-Type": "application/x-www-form-urlencoded" },
body: new URLSearchParams({
action: "updateOrderStatus",
orderId: id,
status: status,
}),
}
);

} catch (err) {

console.error("Eroare updateStatus:", err);

}

loadOrders();

};

window.deleteOrder = async (id) => {

try {

await fetch(
"https://script.google.com/macros/s/AKfycbzGZdepaLFf-ASxJyf9ARWimGJbMY2Q2-CKrryMRKeRSY264aw5FkZ-nv5LlNzFjclFMw/exec",
{
method: "POST",
headers: { "Content-Type": "application/x-www-form-urlencoded" },
body: new URLSearchParams({
action: "deleteOrder",
orderId: id,
}),
}
);

} catch (err) {

console.error("Delete error:", err);

}

loadOrders();

};

document.addEventListener("DOMContentLoaded", () => {

loadAdminInfo();

loadStats();

loadOrders();

});
