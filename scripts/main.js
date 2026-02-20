const firebaseConfig = {
  apiKey: "AIzaSyBQtcHQ3ZO524Q7Ce0PX5jrRFMMHoMNfTE",
  authDomain: "deliciu1.firebaseapp.com",
  projectId: "deliciu1",
  storageBucket: "deliciu1.firebasestorage.app",
  messagingSenderId: "280654887359",
  appId: "1:280654887359:web:ef7dd2cb3ccdbe7e7d890a",
  measurementId: "G-PYS5CQ9ZNH"
};

firebase.initializeApp(firebaseConfig);

const loginBtn = document.getElementById("loginGoogle");
const link = document.getElementById("linkUser");

async function loadComentariiPublice() {
  const coms = JSON.parse(localStorage.getItem('comentarii') || '[]');
  const div = document.getElementById("comentariiPublice");
  div.innerHTML = coms.map(c => `
    <div>
      <img src="${c.poza && c.poza.startsWith('data:') ? c.poza : (c.poza || '/imagini/poza.png')}" width="40" style="border-radius:50%">
      <b>${c.nume}</b>: ${c.text}
    </div>
  `).join("");
}
loadComentariiPublice();

loginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      localStorage.setItem("uid", user.uid);
      localStorage.setItem("email", user.email);
      if (user.email === "ruxanda.cujba07@gmail.com") {
        localStorage.setItem("isAdmin", "true");
        location.href = "/Deliciu/pagini/admin.html";
      } else {
        localStorage.setItem("isAdmin", "false");
        location.href = "/Deliciu/pagini/user.html";
      }
    }).catch(err => console.log(err));
}

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    if (user.email === "ruxanda.cujba07@gmail.com") {
      link.href = "/Deliciu/pagini/admin.html";
    } else {
      link.href = "/Deliciu/pagini/user.html";
    }
    link.style.display = "inline";
  } else {
    link.style.display = "none";
  }
});
