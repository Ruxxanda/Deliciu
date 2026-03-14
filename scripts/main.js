const BASE = location.hostname.includes("github.io") ? "/Deliciu" : "";
function go(path){
  window.location.href = BASE + path;
}

const firebaseConfig = {
  apiKey: "AIzaSyBQtcHQ3ZO524Q7Ce0PX5jrRFMMHoMNfTE",
  authDomain: "deliciu1.firebaseapp.com",
  projectId: "deliciu1",
  storageBucket: "deliciu1.firebasestorage.app",
  messagingSenderId: "280654887359",
  appId: "1:280654887359:web:ef7dd2cb3ccdbe7e7d890a",
  measurementId: "G-PYS5CQ9ZNH",
};

firebase.initializeApp(firebaseConfig);

const loginBtn = document.getElementById("loginGoogle");
const link = document.getElementById("linkUser");

const ADMIN_EMAILS = ["ruxanda.cujba07@gmail.com", "ursumarina@gmail.com"];

async function loadComentariiPublice() {
  try {
    if (window.firestore && window.firestore.fetchAllComments) {
      const coms = await window.firestore.fetchAllComments();

      const div = document.getElementById("comentariiPublice");

      if (!div) return;

      div.innerHTML = coms
        .map(
          (c) => `
<div class="comentariu">
<img src="${c.poza || "/Deliciu/imagini/poza.png"}" width="40" style="border-radius:50%">
<b>${c.nume}</b>: ${c.text}
</div>
`,
        )
        .join("");
    }
  } catch (err) {
    console.error("Eroare comentarii:", err);
  }
}

loadComentariiPublice();

if (loginBtn) {
  loginBtn.onclick = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();

      await firebase
        .auth()
        .setPersistence(firebase.auth.Auth.Persistence.LOCAL);

      const result = await firebase.auth().signInWithPopup(provider);

      const user = result.user;

      localStorage.setItem("uid", user.uid);
      localStorage.setItem("email", user.email);

      const userData = {
        uid: user.uid,
        email: user.email,
        nume: user.displayName,
        poza: user.photoURL || "/Deliciu/imagini/poza.png",
      };

      localStorage.setItem(`user_${user.uid}`, JSON.stringify(userData));

      if (ADMIN_EMAILS.includes(user.email)) {
        localStorage.setItem("isAdmin", "true");

        location.href = "/Deliciu/pagini/admin.html";
      } else {
        localStorage.setItem("isAdmin", "false");

        location.href = "/Deliciu/pagini/user.html";
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };
}

firebase.auth().onAuthStateChanged((user) => {
  if (!link) return;

  if (user) {
    localStorage.setItem("uid", user.uid);
    localStorage.setItem("email", user.email);

    if (ADMIN_EMAILS.includes(user.email)) {
      link.href = "/Deliciu/pagini/admin.html";
    } else {
      link.href = "/Deliciu/pagini/user.html";
    }

    link.style.display = "inline";
  } else {
    link.style.display = "none";
  }
});
