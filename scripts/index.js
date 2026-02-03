async function incarcaComentarii() {
  const data = JSON.parse(localStorage.getItem('comentarii') || '[]');
  const cont = document.getElementById("comentarii");
  if (!cont) return;
  cont.innerHTML = data.map(c => {
    const imgSrc = c.poza && c.poza.startsWith('http') ? c.poza : (c.poza && c.poza.startsWith('data:') ? c.poza : (c.poza ? c.poza : 'imagini/poza.png'));
    return `
  <div class="com">
    <img src="${imgSrc}">
    <b class="user">${c.nume}</b>
    <b class="text">${c.text}</b>
  </div>`;
  }).join("");
}
incarcaComentarii();

async function incarcaReducereActiva() {
  try {
    // Wait for firebase to be ready
    if (!window.firestore || !window.firestore.fetchAllReductions) {
      setTimeout(incarcaReducereActiva, 500);
      return;
    }

    // Fetch reductions from Firestore
    const reductions = await window.firestore.fetchAllReductions();
    console.log('Reductions from Firestore:', reductions);

    // Filter by date and choose first active reduction
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    function parseDateField(v) {
      if (!v) return null;
      // Firestore Timestamp
      if (v.toDate && typeof v.toDate === 'function') return v.toDate();
      // object with seconds
      if (v.seconds) return new Date(v.seconds * 1000);
      // string or number
      return new Date(v);
    }

    const activeReductions = reductions.filter(r => {
      const startDate = parseDateField(r.dataStart);
      const endDate = parseDateField(r.dataEnd);
      if (!startDate || !endDate) return false;
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      console.log('Reduction dates:', r.id, startDate, endDate, 'today', today);
      return today >= startDate && today <= endDate;
    });

    const activeReduction = activeReductions.length ? activeReductions[0] : null;
    console.log('Active reduction:', activeReduction);

    if (activeReduction) {
      // Fetch products from local JSON (try multiple possible relative paths)
      const allProducts = await (async () => {
        const candidates = [
          'data/products.json',
          '../data/products.json',
          '/Deliciu/data/products.json',
          window.location.origin + '/Deliciu/data/products.json'
        ];
        for (const url of candidates) {
          try {
            const r = await fetch(url);
            if (!r.ok) continue;
            const j = await r.json();
            return Array.isArray(j) ? j : [];
          } catch (e) {
            // try next
          }
        }
        // final fallback: empty list
        return [];
      })();

      // Get affected products
      const affectedNames = Array.isArray(activeReduction.produse) ? activeReduction.produse.slice(0, 3) : [];
      const affectedProducts = affectedNames.map(name => allProducts.find(p => p.nume === name)).filter(p => p);

      const formatPrice = (price) => parseFloat(price || 0).toFixed(2);
      const productsHTML = affectedProducts.map(p => {
        const pretRedus = Math.round(p.pret * (1 - activeReduction.reducere / 100));
        let pretHTML = `
          <div class="preturi">
            <div class="badge-reducere">-${activeReduction.reducere}%</div>
            <div class="preturi">
              <div class="pret-vechi">${formatPrice(p.pret)} Lei</div>
              <div class="pret-redus">${formatPrice(pretRedus)} Lei</div>
            </div>
          </div>
        `;
        return `
          <div class="produs">
            <img src="${p.imagine || p.linkImagine}" width="100" alt="${p.nume}">
            <p class="nume"><strong>${p.nume}</strong></p>
            <p class="pret">${pretHTML}</p>
          </div>
        `;
      }).join('');

      const ar = document.getElementById("activeReduction");
      if (ar) ar.innerHTML = `
      <div class="reduc">
        <div class="text-top">
          Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!
          Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!
          Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!
          Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!
          Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!
        </div>
        <div class="continut">
          <div class="text">
            <h2>${activeReduction.denumire} ${activeReduction.reducere}%</h2>
            <p class="det">${activeReduction.descriere}</p>
            <div class="produse">${productsHTML}</div>
            <button onclick="location.href='pagini/produse.html'">Comandă acum!</button>
          </div>
          <div class="timer">
            <p>Promoția expiră în:</p>
            <p id="daysDisplay"></p>
            <span class="time" id="countdownTimer"></span>
          </div>
        </div>
        <div class="text-bottom">
          Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!
          Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!
          Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!
          Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!
          Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!Ofertă specială! Cumpără chiar acum!
        </div>
      </div>
      `;
      startCountdown(activeReduction.dataEnd, activeReduction.id);
      if (ar) ar.style.display = 'block';
    } else {
      const ar2 = document.getElementById('activeReduction'); if (ar2) ar2.style.display = 'none';
    }
  } catch (error) {
    console.error('Eroare la incarcare reducere activa:', error);
    const arCatch = document.getElementById('activeReduction'); if (arCatch) arCatch.style.display = 'none';
  }
  // miscarea textului la reducere
    const textTop = document.querySelector('.text-top');
    const textBottom = document.querySelector('.text-bottom');

    window.addEventListener('scroll', () => {
      const scrollPosition = window.scrollY;
      const moveAmount = scrollPosition * 0.2;
      if (textTop) textTop.style.transform = `translateX(-${moveAmount}px)`;
      if (textBottom) textBottom.style.transform = `translateX(-${moveAmount}px)`;
    });
}
incarcaReducereActiva();

function startCountdown(endDateStr, reductionId) {
  const endDate = new Date(endDateStr);
  endDate.setHours(0, 0, 0, 0); // Set to midnight
  const timerElement = document.getElementById('countdownTimer');
  const daysDisplay = document.getElementById('daysDisplay');
  if (!timerElement) return;
  let interval = null;

  function updateTimer() {
    const now = new Date();
    const timeLeft = endDate - now;

    if (timeLeft <= 0) {
      if (daysDisplay) daysDisplay.textContent = '';
      timerElement.textContent = 'Expirată';
      if (interval) clearInterval(interval);

      // Șterge reducerea din Firestore și reîncarcă pagina
      if (reductionId && window.firestore && window.firestore.deleteReduction) {
        window.firestore.deleteReduction(reductionId).then(() => {
          console.log('Reducere ștearsă - ID:', reductionId);
          // Reîncarcă pagina pentru a actualiza afișarea
          setTimeout(() => {
            location.reload();
          }, 500);
        }).catch(err => {
          console.error('Eroare la ștergerea reducerii:', err);
        });
      }
      return;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const pad = (n) => n.toString().padStart(2, '0');
    if (daysDisplay) daysDisplay.textContent = `${days} zile și`;
    timerElement.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  updateTimer();
  interval = setInterval(updateTimer, 1000);
}

// Încarcă 3 torturi populare
async function incarcaTorturiPopulare() {
  try {
    // Try several relative paths to support being served from subfolders (GitHub Pages)
    const candidates = ['data/products.json', '../data/products.json', '/Deliciu/data/products.json', window.location.origin + '/Deliciu/data/products.json'];
    let produse = [];
    for (const url of candidates) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const j = await r.json();
        if (Array.isArray(j)) { produse = j; break; }
      } catch (e) { /* try next */ }
    }

    // Aplică reduceri active din Firestore
    if (typeof applyActiveReductions === 'function') {
      produse = await applyActiveReductions(produse);
    }

    // Alege primele 3 produse
    const topThree = produse.slice(0, 3);

    const div = document.querySelector('.trei');
    if (!div) return;

    div.innerHTML = '';
    const formatPrice = (price) => parseFloat(price || 0).toFixed(2);

    topThree.forEach(p => {
      const areReducere = p.reducere != null && p.reducere !== "" && p.pretRedus != null && p.pretRedus !== "";
      let pretHTML = "";
      if (!areReducere) {
        pretHTML = `<span>${formatPrice(p.pret)} Lei</span>`;
      } else {
        pretHTML = `
          <div class="reducer">
            <div class="red">
              <div class="pret-vechi">${formatPrice(p.pret)}</div>
              <div class="pret-redus">${formatPrice(p.pretRedus)} Lei</div>
            </div>
          </div>
        `;
      }

      const card = document.createElement("div");
      card.classList.add("produs");
      card.innerHTML = `
        <div class="img-wrapper">
          <img src="${(p.imagine || p.linkImagine || '').replace(/^\.\//,'').replace(/^\//,'')}" alt="${p.nume}">
          ${areReducere ? `<div class="badge-reducere">-${p.reducere}%</div>` : ''}
        </div>
        <h3>${p.nume}</h3>
        <p>${p.descriere}</p>${pretHTML}
        <div style="text-align: center;">
          <a href="pagini/produse.html" class="btn-detalii" style="padding: 8px 16px; background: #d4007e; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">Vezi în catalog</a>
        </div>
      `;
      div.appendChild(card);
    });
  } catch (error) {
    console.error('Eroare la încărcarea torturilor populare:', error);
  }
}

document.addEventListener('DOMContentLoaded', incarcaTorturiPopulare);