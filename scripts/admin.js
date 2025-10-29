const uid = localStorage.getItem("uid");
const email = localStorage.getItem("email");
if(!uid || email!=="ruxanda.cujba07@gmail.com") location.href="index.html";

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
        <img src="${u.poza || 'imagini/poza.png'}" width="60" style="border-radius:50%"><br>
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
