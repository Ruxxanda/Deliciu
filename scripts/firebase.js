import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQtcHQ3ZO524Q7Ce0PX5jrRFMMHoMNfTE",
  authDomain: "deliciu1.firebaseapp.com",
  projectId: "deliciu1",
  storageBucket: "deliciu1.firebasestorage.app",
  messagingSenderId: "280654887359",
  appId: "1:280654887359:web:ef7dd2cb3ccdbe7e7d890a",
  measurementId: "G-PYS5CQ9ZNH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById("googleLogin");
const userLink = document.getElementById("userLink");

loginBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userData = {
      uid: user.uid,
      nume: user.displayName,
      email: user.email,
      poza: user.photoURL || "../imagini/poza.png"
    };

    await fetch("http://localhost:3000/salveazaUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    localStorage.setItem("uid", user.uid);
    localStorage.setItem("email", user.email);

    if(user.email === "ruxanda.cujba07@gmail.com") userLink.href="../pagini/admin.html";
    else userLink.href="../pagini/user.html";
    userLink.style.display = "inline";

    if(user.email === "ruxanda.cujba07@gmail.com") window.location.href = "../pagini/admin.html";
    else window.location.href = "../pagini/user.html";

  } catch(err) {
    alert("Eroare la logare!");
    console.log(err);
  }
});

// Starea autentificării se folosește doar pentru linkul profil/admin
onAuthStateChanged(auth, (user) => {
  if(user){
    localStorage.setItem("uid", user.uid);
    localStorage.setItem("email", user.email);
    userLink.style.display = "inline";
    if(user.email === "ruxanda.cujba07@gmail.com") userLink.href="../pagini/admin.html";
    else userLink.href="../pagini/user.html";
  } else {
    localStorage.removeItem("uid");
    localStorage.removeItem("email");
    userLink.style.display = "none";
  }
});

// deconectare
window.logout = async () => {
  await signOut(auth);
  localStorage.removeItem("uid");
  localStorage.removeItem("email");
  userLink.style.display = "none";
  // BUTONUL GOOGLE RAMANE VIZIBIL
};
