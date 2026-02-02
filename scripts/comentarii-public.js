// Script pentru index.html - afisare comentarii cu carousel
let comentariiData = [];
let currentIndex = 0;
const commentsPerPage = 3;

async function incarcaComentariiPublice() {
  try {
    if (!window.firestore || !window.firestore.fetchAllComments) {
      console.warn('Firestore nu e disponibil');
      return;
    }
    
    comentariiData = await window.firestore.fetchAllComments();
    
    const track = document.getElementById('comentarii');
    if (!track) return;
    
    if (comentariiData.length === 0) {
      track.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Nu sunt comentarii încă.</p>';
      document.getElementById('prevBtn').style.display = 'none';
      document.getElementById('nextBtn').style.display = 'none';
      return;
    }
    
    // Ascunde butoanele doar dacă sunt mai puțin de 4 comentarii
    if (comentariiData.length <= commentsPerPage) {
      document.getElementById('prevBtn').style.display = 'none';
      document.getElementById('nextBtn').style.display = 'none';
    } else {
      // Butoanele sunt mereu active pentru circulare
      document.getElementById('prevBtn').style.display = 'flex';
      document.getElementById('nextBtn').style.display = 'flex';
    }
    
    renderCarousel();
    addCarouselListeners();
  } catch (err) {
    console.error('Eroare la încărcare comentarii publice', err);
    const track = document.getElementById('comentarii');
    if (track) track.innerHTML = '<p style="color:#999;">Eroare la încărcare comentarii.</p>';
  }
}

let internalIndex = 0; // index în track (include clone-urile)
let visibleCount = commentsPerPage;
let carouselAutoPlayInterval = null;
let carouselInitialized = false;
let isTransitioning = false;
let resizeTimeout = null;

function calculateVisibleCount() {
  // Sincronizat cu media queries din CSS: 1 (<=600), 2 (<=1024), else 3
  const w = window.innerWidth;
  if (w <= 600) return 1;
  if (w <= 1024) return 2;
  return commentsPerPage;
}

function buildItemHTML(c) {
  return `
    <div class="carousel-item">
      <div class="com">
        <img src="${(c.poza || '/imagini/poza.png').replace(/"/g, '&quot;')}" alt="avatar">
        <div>
          <div class="user">${(c.nume || 'Anonim').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <div class="text">${(c.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      </div>
    </div>
  `;
}

function renderCarousel() {
  const track = document.getElementById('comentarii');
  const wrapper = document.querySelector('.carousel-wrapper');
  if (!track || !wrapper) return;

  if (comentariiData.length === 0) return;

  visibleCount = calculateVisibleCount();

  // Dacă sunt puține comentarii, afișăm simplu și oprim mecanismele de looping
  if (comentariiData.length <= visibleCount) {
    track.innerHTML = comentariiData.map(buildItemHTML).join('');
    track.style.transform = 'translateX(0)';
    stopAutoplay();
    document.getElementById('prevBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    return;
  }

  // Construim clone-urile: ultimele visibleCount la început și primele visibleCount la sfârșit
  const itemsHTML = comentariiData.map(buildItemHTML).join('');
  const preClones = comentariiData.slice(-visibleCount).map(buildItemHTML).join('');
  const postClones = comentariiData.slice(0, visibleCount).map(buildItemHTML).join('');

  track.innerHTML = preClones + itemsHTML + postClones;

  // Setăm indexul intern astfel încât să fim pe elementul curent real
  internalIndex = visibleCount + currentIndex;

  // poziționăm fără animație
  updateCarouselPosition(false);

  // Ascund/emitem butoane
  document.getElementById('prevBtn').style.display = 'flex';
  document.getElementById('nextBtn').style.display = 'flex';

  // Render pagination dots și actualizează starea
  renderDots();
  updateActiveDot();

  // Asigurăm un singur listener pentru 'transitionend'
  if (!carouselInitialized) {
    track.addEventListener('transitionend', onTrackTransitionEnd);
    carouselInitialized = true;
  }
} 

function updateCarouselPosition(animate = true) {
  const track = document.getElementById('comentarii');
  const wrapper = document.querySelector('.carousel-wrapper');
  const item = track.querySelector('.carousel-item');
  if (!track || !item || !wrapper) return;

  const gap = parseFloat(getComputedStyle(track).gap) || 0;
  const itemWidth = item.getBoundingClientRect().width;
  const wrapperWidth = wrapper.getBoundingClientRect().width;

  // lățimea totală a elementelor vizibile (include gap-urile dintre ele)
  const totalVisibleWidth = visibleCount * itemWidth + Math.max(0, visibleCount - 1) * gap;
  // offset pentru a centra setul vizibil în wrapper
  const centerOffset = (wrapperWidth - totalVisibleWidth) / 2;

  const translateX = -internalIndex * (itemWidth + gap) + centerOffset;

  if (!animate) {
    track.style.transition = 'none';
    track.style.transform = `translateX(${translateX}px)`;
    // forțăm reflow
    track.getBoundingClientRect();
    track.style.transition = '';
  } else {
    track.style.transform = `translateX(${translateX}px)`;
  }
} 

function nextComment() {
  if (!comentariiData || comentariiData.length === 0) return;
  if (comentariiData.length <= visibleCount) return;
  if (isTransitioning) return;

  isTransitioning = true;
  internalIndex += 1;
  updateCarouselPosition(true);
}

function prevComment() {
  if (!comentariiData || comentariiData.length === 0) return;
  if (comentariiData.length <= visibleCount) return;
  if (isTransitioning) return;

  isTransitioning = true;
  internalIndex -= 1;
  updateCarouselPosition(true);
}

function onTrackTransitionEnd() {
  const n = comentariiData.length;

  // Dacă ne-am deplasat în afara secțiunii reale, resetăm indexul intern fără animație
  if (internalIndex >= visibleCount + n) {
    internalIndex -= n;
    updateCarouselPosition(false);
  } else if (internalIndex < visibleCount) {
    internalIndex += n;
    updateCarouselPosition(false);
  }

  // Sincronizăm currentIndex cu poziția internă (valorile reale 0..n-1)
  currentIndex = (internalIndex - visibleCount + n) % n;
  // Actualizăm dot-ul activ pentru a reflecta elementul central
  updateActiveDot();
  isTransitioning = false;
} 

function renderDots() {
  const dots = document.getElementById('carouselDots');
  if (!dots) return;
  const n = comentariiData.length;
  if (n <= visibleCount) { dots.innerHTML = ''; dots.style.display = 'none'; return; }
  dots.style.display = 'flex';
  dots.innerHTML = Array.from({ length: n }).map((_, i) => `
    <button class="dot" data-index="${i}" aria-label="Slide ${i+1}"></button>
  `).join('');

  // atașăm click-urile
  dots.querySelectorAll('.dot').forEach(d => d.addEventListener('click', (e) => {
    const idx = Number(e.currentTarget.dataset.index);
    goToIndex(idx);
    stopAutoplay();
    setTimeout(startAutoplay, 3000);
  }));

  updateActiveDot();
}

function updateActiveDot() {
  const dots = document.getElementById('carouselDots');
  if (!dots) return;
  const n = comentariiData.length;
  if (n === 0) return;
  // Vrem să evidențiem elementul din mijloc al ferestrei vizibile
  const centerOffset = Math.floor(visibleCount / 2);
  const centerIndex = (currentIndex + centerOffset) % n;
  dots.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === centerIndex));
} 

function goToIndex(idx) {
  if (isTransitioning) return;
  const n = comentariiData.length;
  if (n === 0) return;
  const centerOffset = Math.floor(visibleCount / 2);
  // Calculăm indexul leftmost astfel încât idx să fie în centru
  currentIndex = (idx - centerOffset + n) % n;
  internalIndex = visibleCount + currentIndex;
  // actualizare vizuală imediată a dot-ului (feedback instant)
  updateActiveDot();
  isTransitioning = true;
  updateCarouselPosition(true);
}

function startAutoplay() {
  // Nu porni autoplay dacă nu sunt suficient comentarii
  if (comentariiData.length <= visibleCount) return;
  stopAutoplay();
  carouselAutoPlayInterval = setInterval(nextComment, 5000);
} 

function stopAutoplay() {
  if (carouselAutoPlayInterval) {
    clearInterval(carouselAutoPlayInterval);
    carouselAutoPlayInterval = null;
  }
}

function addCarouselListeners() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const container = document.querySelector('.carousel-container');
  const wrapper = document.querySelector('.carousel-wrapper');
  const track = document.getElementById('comentarii');

  // Click butoane
  if (prevBtn) prevBtn.addEventListener('click', () => { prevComment(); stopAutoplay(); setTimeout(startAutoplay, 3000); });
  if (nextBtn) nextBtn.addEventListener('click', () => { nextComment(); stopAutoplay(); setTimeout(startAutoplay, 3000); });

  // Autoplay la hover
  if (container) {
    container.addEventListener('mouseenter', stopAutoplay);
    container.addEventListener('mouseleave', startAutoplay);
  }

  // Swipe / drag (pointer events)
  let startX = 0;
  let dx = 0;
  let dragging = false;
  const threshold = 50; // px pentru a decide swipe

  function onPointerDown(e) {
    // doar buton stânga pentru mouse
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const item = track.querySelector('.carousel-item');
    if (!item) return;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const itemWidth = item.getBoundingClientRect().width;

    dragging = true;
    startX = e.clientX;
    dx = 0;
    // blocăm tranziția pentru mișcare lină
    track.style.transition = 'none';
    track.classList.add('dragging');
    wrapper.setPointerCapture(e.pointerId);
    stopAutoplay();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    dx = e.clientX - startX;
    const item = track.querySelector('.carousel-item');
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const itemWidth = item.getBoundingClientRect().width;
    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const totalVisibleWidth = visibleCount * itemWidth + Math.max(0, visibleCount - 1) * gap;
    const centerOffset = (wrapperWidth - totalVisibleWidth) / 2;
    const baseTranslate = -internalIndex * (itemWidth + gap) + centerOffset;
    track.style.transform = `translateX(${baseTranslate + dx}px)`;
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('dragging');
    try { wrapper.releasePointerCapture(e.pointerId); } catch (err) {}
    track.style.transition = '';

    if (Math.abs(dx) > threshold) {
      if (dx < 0) nextComment(); else prevComment();
    } else {
      // Snap înapoi
      updateCarouselPosition(true);
    }

    // restart autoplay
    setTimeout(startAutoplay, 3000);
  }

  // Listeneri pointer
  if (wrapper) {
    wrapper.addEventListener('pointerdown', onPointerDown);
    wrapper.addEventListener('pointermove', onPointerMove);
    wrapper.addEventListener('pointerup', onPointerUp);
    wrapper.addEventListener('pointercancel', onPointerUp);
  }

  // Reconstruim caruselul la resize (mențin poziția) și repoziționăm
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newVisible = calculateVisibleCount();
      if (newVisible !== visibleCount) {
        currentIndex = (internalIndex - visibleCount + comentariiData.length) % comentariiData.length;
        renderCarousel();
        startAutoplay();
      } else {
        updateCarouselPosition(false);
      }
    }, 150);
  });

  startAutoplay();
}

// Încarcă comentariile când pagina se încarcă
setTimeout(() => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', incarcaComentariiPublice);
  } else {
    incarcaComentariiPublice();
  }
}, 500);

