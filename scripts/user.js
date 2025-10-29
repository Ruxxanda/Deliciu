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
