// scripts/edit.js
const uid = localStorage.getItem("uid");
if (!uid) location.href = "index.html";

const infoDiv = document.getElementById("info");
const form = document.getElementById("editForm");
const btnCancel = document.getElementById("cancel");
const fileInput = document.getElementById("pozaFile");

btnCancel.onclick = () => location.href = "../pagini/user.html";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  // dacă există fișier - încarcă mai întâi
  let pozaPath = null;
  if (fileInput.files.length > 0) {
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    const up = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData
    });
    const j = await up.json();
    pozaPath = j.path; // ex: /uploads/abcd
  }

  const payload = {
    uid,
    nume: document.getElementById("nume").value,
    email: document.getElementById("email").value,
    telefon: document.getElementById("telefon").value,
    adresa: document.getElementById("adresa").value,
    poza: pozaPath // poate fi null
  };

  await fetch("http://localhost:3000/updateUser", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });

  alert("Date salvate");
  location.href = "../pagini/user.html";
});

// De asemenea folosește poza implicită cu cale absolută când afișezi info la loadUser()
async function loadUser() {
  const res = await fetch(`http://localhost:3000/user/${uid}`);
  const user = await res.json();
  document.getElementById("nume").value = user.nume || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("telefon").value = user.telefon || "";
  document.getElementById("adresa").value = user.adresa || "";
  const poza = user.poza || "../imagini/poza.png";
  infoDiv.innerHTML = `<img src="${poza}" width="100" style="border-radius:50%"><br>`;
}
loadUser();
