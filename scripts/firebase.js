import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* CONFIG */
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "AUTH_DOMAIN",
  projectId: "PROJECT_ID",
  storageBucket: "STORAGE",
  messagingSenderId: "MSG_ID",
  appId: "APP_ID"
};


/* INIT */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();


window.firestore = db;
window.auth = auth;


/* BASE PATH PENTRU GITHUB */
const BASE = location.hostname.includes("github.io")
  ? "/Deliciu"
  : "";


/* LOGIN */
window.login = async function () {

  try {

    const result = await signInWithPopup(auth, provider);

    const user = result.user;

    localStorage.setItem("uid", user.uid);
    localStorage.setItem("email", user.email);

  } catch (err) {

    console.error(err);

  }

};


/* LOGOUT */
window.logout = async function () {

  await signOut(auth);

  localStorage.clear();

  window.location.href = BASE + "/index.html";

};


/* USER STATE */
onAuthStateChanged(auth, user => {

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userLink = document.getElementById("userLink");

  if (!user) {

    if (loginBtn) loginBtn.style.display = "inline";
    if (logoutBtn) logoutBtn.style.display = "none";

    return;

  }

  const adminEmails = [
    "admin@email.com"
  ];

  if (loginBtn) loginBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "inline";

  if (userLink) {

    if (adminEmails.includes(user.email)) {

      userLink.href = BASE + "/pagini/admin.html";

    } else {

      userLink.href = BASE + "/pagini/user.html";

    }

  }

});


/* SALVARE COMANDA */
window.saveOrder = async function (order) {

  try {

    const payload = {
      ...order,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "orders"), payload);

    alert("Comanda a fost trimisă!");

  } catch (err) {

    console.error(err);

  }

};


/* ADAUGARE COMENTARIU */
window.addComment = async function (data) {

  try {

    await addDoc(collection(db, "comentarii"), {
      ...data,
      createdAt: serverTimestamp()
    });

  } catch (err) {

    console.error(err);

  }

};


/* STERGERE COMENTARIU */
window.deleteComment = async function (id) {

  try {

    await deleteDoc(doc(db, "comentarii", id));

  } catch (err) {

    console.error(err);

  }

};