import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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
const db = getFirestore(app);

window.firestore = {
  db,
  async saveComment(comment) {
    try {
      const payload = Object.assign({}, comment, { createdAt: serverTimestamp() });
      const ref = await addDoc(collection(db, 'comentarii'), payload);
      return { id: ref.id };
    } catch (err) {
      console.error('Eroare la salvare comentariu Firestore', err);
      throw err;
    }
  },
  async fetchCommentsByUser(uid) {
    try {
      const q = query(collection(db, 'comentarii'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Eroare la citire comentarii Firestore', err);
      throw err;
    }
  },
  async fetchAllComments() {
    try {
      const q = query(collection(db, 'comentarii'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Eroare la citire toate comentariile Firestore', err);
      throw err;
    }
  },
  async deleteComment(id) {
    try {
      await deleteDoc(doc(db, 'comentarii', id));
      return true;
    } catch (err) {
      console.error('Eroare la stergere comentariu Firestore', err);
      throw err;
    }
  },
  async updateComment(id, data) {
    try {
      await updateDoc(doc(db, 'comentarii', id), data);
      return true;
    } catch (err) {
      console.error('Eroare la update comentariu Firestore', err);
      throw err;
    }
  },
  async saveReduction(reduction) {
    try {
      const payload = Object.assign({}, reduction, { createdAt: serverTimestamp() });
      const ref = await addDoc(collection(db, 'reductions'), payload);
      return { id: ref.id };
    } catch (err) {
      console.error('Eroare la salvare reducere Firestore', err);
      throw err;
    }
  },
  // Orders helpers
  async saveOrder(order) {
    try {
      const payload = Object.assign({}, order, { createdAt: serverTimestamp() });
      const ref = await addDoc(collection(db, 'orders'), payload);
      return { id: ref.id };
    } catch (err) {
      console.error('Eroare la salvare comanda Firestore', err);
      throw err;
    }
  },
  async fetchOrdersByUser(uid) {
    try {
      const q = query(collection(db, 'orders'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Eroare la citire comenzi user Firestore', err);
      throw err;
    }
  },
  async fetchAllOrders() {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Eroare la citire comenzi Firestore', err);
      throw err;
    }
  },
  async updateOrder(docId, data) {
    try {
      await updateDoc(doc(db, 'orders', docId), data);
      return true;
    } catch (err) {
      console.error('Eroare la update comanda Firestore', err);
      throw err;
    }
  },
  async deleteOrder(docId) {
    try {
      await deleteDoc(doc(db, 'orders', docId));
      return true;
    } catch (err) {
      console.error('Eroare la stergere comanda Firestore', err);
      throw err;
    }
  },
  async fetchAllReductions() {
    try {
      const q = query(collection(db, 'reductions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Eroare la citire reduceri Firestore', err);
      throw err;
    }
  },
  async deleteReduction(id) {
    try {
      await deleteDoc(doc(db, 'reductions', id));
      return true;
    } catch (err) {
      console.error('Eroare la stergere reducere Firestore', err);
      throw err;
    }
  }
};

const loginBtn = document.getElementById("googleLogin");
const userLink = document.getElementById("userLink");

if (loginBtn) {
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
    try {
      localStorage.setItem(`user_${user.uid}`, JSON.stringify(userData));
      localStorage.setItem("uid", user.uid);
      localStorage.setItem("email", user.email);
      localStorage.setItem(`profile_${user.uid}`, JSON.stringify({ nume: user.displayName, poza: user.photoURL }));
    } catch (err) {
      console.warn('Could not persist user to localStorage', err);
    }

    if (user.email === "ruxanda.cujba07@gmail.com") {
      if (userLink) userLink.href = "../pagini/admin.html";
      window.location.href = "../pagini/admin.html";
    } else {
      if (userLink) userLink.href = "../pagini/user.html";
      window.location.href = "../pagini/user.html";
    }

  } catch(err) {
    console.error("Eroare la logare!", err);
  }
  });
}

onAuthStateChanged(auth, (user) => {
  const ul = document.getElementById("userLink");
  if(user){
    const userData = {
      uid: user.uid,
      nume: user.displayName,
      email: user.email,
      poza: user.photoURL || "../imagini/poza.png"
    };
    try {
      localStorage.setItem(`user_${user.uid}`, JSON.stringify(userData));
      localStorage.setItem("uid", user.uid);
      localStorage.setItem("email", user.email);
    } catch (err) {
      console.warn('Could not persist auth user to localStorage', err);
    }
    if (ul) ul.style.display = "inline";
    if(user.email === "ruxanda.cujba07@gmail.com") { if (ul) ul.href="../pagini/admin.html"; }
    else { if (ul) ul.href="../pagini/user.html"; }
  } else {
    localStorage.removeItem("uid");
    localStorage.removeItem("email");
    if (ul) ul.style.display = "none";
  }
});

window.logout = async () => {
  await signOut(auth);
  localStorage.removeItem("uid");
  localStorage.removeItem("email");
  const ul = document.getElementById("userLink");
  if (ul) ul.style.display = "none";
};
