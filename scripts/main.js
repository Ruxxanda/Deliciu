const loginBtn = document.getElementById("loginGoogle");
const link = document.getElementById("linkUser");

// afișare comentarii publice
async function loadComentariiPublice() {
  const coms = JSON.parse(localStorage.getItem('comentarii') || '[]');
  const div = document.getElementById("comentariiPublice");
  if (!div) return;
  div.innerHTML = coms.map(c => `
    <div>
      <img src="${c.poza && c.poza.startsWith('data:') ? c.poza : (c.poza || '/imagini/poza.png')}" width="40" style="border-radius:50%">
      <b>${c.nume}</b>: ${c.text}
    </div>
  `).join("");
}
loadComentariiPublice();

// logare cu Google
if (loginBtn) {
  loginBtn.onclick = async () => {
    try {
      const result = await window.firestore.auth.signInWithPopup(window.firestore.provider);
      const user = result.user;
      localStorage.setItem("uid", user.uid);
      localStorage.setItem("email", user.email);
      // dacă e admin
      if (user.email === "ruxanda.cujba07@gmail.com") {
        localStorage.setItem("isAdmin", "true");
        location.href = "/Deliciu/pagini/admin.html";
      }
    } catch (err) {
      console.error("Eroare la autentificare Google", err);
    }
  }
}

// afișare link user/admin
if (window.firebase && window.firebase.auth && link) {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      if (user.email === "ruxanda.cujba07@gmail.com") {
        link.href = "../pagini/admin.html";
      } else {
        link.href = "../pagini/user.html";
      }
      link.style.display = "inline";
    } else {
      link.style.display = "none";
    }
  });
}
