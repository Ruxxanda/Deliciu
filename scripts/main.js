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

// afișare comentarii publice
async function loadComentariiPublice() {
  const res = await fetch("http://localhost:3000/comentarii");
  const coms = await res.json();
  const div = document.getElementById("comentariiPublice");
  div.innerHTML = coms.map(c => `
    <div>
      <img src="${c.poza}" width="40" style="border-radius:50%">
      <b>${c.nume}</b>: ${c.text}
    </div>
  `).join("");
}
loadComentariiPublice();

// logare cu Google
loginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      localStorage.setItem("uid", user.uid);
      localStorage.setItem("email", user.email);
      // dacă e admin
      if (user.email === "ruxanda.cujba07@gmail.com") {
        localStorage.setItem("isAdmin", "true");
        location.href = "../pagini/admin.html";
      } else {
        localStorage.setItem("isAdmin", "false");
        location.href = "../pagini/user.html";
      }
    }).catch(err => console.log(err));
}

// afișare link user/admin
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
