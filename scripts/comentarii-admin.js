// Script pentru admin.html - afisare si stergere comentarii
const adminEmail = 'ruxanda.cujba07@gmail.com';
let allComments = [];
let displayLimit = 5;

async function incarcaComentariiAdmin() {
  try {
    if (!window.firestore || !window.firestore.fetchAllComments) {
      console.warn('Firestore nu e disponibil');
      return;
    }
    
    allComments = await window.firestore.fetchAllComments();
    afisareComentariiAdmin();
  } catch (err) {
    console.error('Eroare la încărcare comentarii admin', err);
    const container = document.getElementById('coms');
    if (container) container.innerHTML = '<p style="color:#999;">Eroare la încărcare comentarii.</p>';
  }
}

function afisareComentariiAdmin() {
  const container = document.getElementById('coms');
  if (!container) return;
  
  const displayed = allComments.slice(0, displayLimit);
  
  container.innerHTML = displayed.length > 0 
    ? displayed.map(c => `
        <div class="comentariu">
          <img src="${(c.poza || '../imagini/poza.png').replace(/"/g, '&quot;')}" alt="avatar">
          <b>${(c.nume || 'Anonim').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</b>
          <p>${(c.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <button onclick="stergeComentariuAdmin('${c.id}')">Șterge</button>
        </div>
      `).join('')
    : '<p style="text-align:center;color:#999;">Nu sunt comentarii.</p>';
  
  // Buton "Mai multe"
  const toggleBtn = document.getElementById('toggleComments');
  if (toggleBtn) {
    if (displayLimit >= allComments.length) {
      toggleBtn.style.display = 'none';
    } else {
      toggleBtn.style.display = 'block';
      toggleBtn.onclick = () => {
        displayLimit += 5;
        afisareComentariiAdmin();
      };
    }
  }
}

window.stergeComentariuAdmin = async (id) => {
  if (confirm('Ștergi acest comentariu?')) {
    try {
      if (window.firestore && window.firestore.deleteComment) {
        await window.firestore.deleteComment(id);
        incarcaComentariiAdmin();
      } else {
        alert('Firestore nu e disponibil');
      }
    } catch (err) {
      console.error('Eroare la stergere comentariu', err);
      alert('Eroare la stergere');
    }
  }
};

// Încarcă comentariile când pagina se încarcă (cu delay pentru a se asigura că firebase.js s-a încărcat)
setTimeout(() => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', incarcaComentariiAdmin);
  } else {
    incarcaComentariiAdmin();
  }
}, 500);
