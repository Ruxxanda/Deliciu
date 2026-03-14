let comentariiData = [];
let currentIndex = 0;

const commentsPerPage = 3;



/* =========================
   Așteaptă Firestore
========================= */

function waitForFirestore(timeout = 4000, interval = 200) {

  return new Promise(resolve => {

    if (window.firestore?.fetchAllComments)
      return resolve(true);

    const start = Date.now();

    const t = setInterval(() => {

      if (window.firestore?.fetchAllComments) {
        clearInterval(t);
        resolve(true);
      }

      if (Date.now() - start > timeout) {
        clearInterval(t);
        resolve(false);
      }

    }, interval);

  });

}



/* =========================
   Încarcă comentarii
========================= */

async function incarcaComentariiPublice() {

  const track = document.getElementById("comentarii");
  if (!track) return;

  try {

    const ok = await waitForFirestore();

    if (ok) {

      comentariiData =
        await window.firestore.fetchAllComments();

    } else {

      console.warn("Firestore indisponibil");

      comentariiData =
        JSON.parse(localStorage.getItem("comentarii") || "[]");

    }

  } catch (err) {

    console.error("Eroare Firebase:", err);

    comentariiData =
      JSON.parse(localStorage.getItem("comentarii") || "[]");

  }

  if (!comentariiData || comentariiData.length === 0) {

    track.innerHTML =
      `<p style="text-align:center;color:#999;padding:40px;">
        Nu sunt comentarii încă.
      </p>`;

    hideArrows();
    return;

  }

  renderCarousel();
  addCarouselListeners();

}



/* =========================
   UI helpers
========================= */

function hideArrows() {

  const prev = document.getElementById("prevBtn");
  const next = document.getElementById("nextBtn");

  if (prev) prev.style.display = "none";
  if (next) next.style.display = "none";

}



/* =========================
   Carousel config
========================= */

let internalIndex = 0;
let visibleCount = commentsPerPage;
let autoPlay = null;



function calculateVisibleCount() {

  const w = window.innerWidth;

  if (w <= 600) return 1;
  if (w <= 1024) return 2;

  return commentsPerPage;

}



/* =========================
   HTML comentariu
========================= */

function buildItemHTML(c) {

  const avatar =
    c.poza ||
    "../imagini/poza.png";

  const name =
    c.nume ||
    c.email ||
    "Anonim";

  const text =
    (c.text || "")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return `
    <div class="carousel-item">

      <div class="com">

        <img src="${avatar}" alt="avatar">

        <div>

          <div class="user">${name}</div>

          <div class="text">${text}</div>

        </div>

      </div>

    </div>
  `;

}



/* =========================
   Render carousel
========================= */

function renderCarousel() {

  const track =
    document.getElementById("comentarii");

  const wrapper =
    document.querySelector(".carousel-wrapper");

  if (!track || !wrapper) return;

  visibleCount = calculateVisibleCount();

  if (comentariiData.length <= visibleCount) {

    track.innerHTML =
      comentariiData.map(buildItemHTML).join("");

    hideArrows();
    return;

  }

  const items =
    comentariiData.map(buildItemHTML).join("");

  const pre =
    comentariiData
      .slice(-visibleCount)
      .map(buildItemHTML)
      .join("");

  const post =
    comentariiData
      .slice(0, visibleCount)
      .map(buildItemHTML)
      .join("");

  track.innerHTML = pre + items + post;

  internalIndex = visibleCount;

  updateCarouselPosition(false);

}



/* =========================
   Move carousel
========================= */

function updateCarouselPosition(animate = true) {

  const track =
    document.getElementById("comentarii");

  const wrapper =
    document.querySelector(".carousel-wrapper");

  const item =
    track.querySelector(".carousel-item");

  if (!track || !item || !wrapper) return;

  const gap =
    parseFloat(getComputedStyle(track).gap) || 0;

  const itemWidth =
    item.getBoundingClientRect().width;

  const wrapperWidth =
    wrapper.getBoundingClientRect().width;

  const totalWidth =
    visibleCount * itemWidth +
    (visibleCount - 1) * gap;

  const center =
    (wrapperWidth - totalWidth) / 2;

  const translate =
    -internalIndex * (itemWidth + gap) + center;

  if (!animate) {

    track.style.transition = "none";

    track.style.transform =
      `translateX(${translate}px)`;

    track.offsetHeight;

    track.style.transition = "";

  } else {

    track.style.transform =
      `translateX(${translate}px)`;

  }

}



/* =========================
   Navigation
========================= */

function nextComment() {

  internalIndex++;

  updateCarouselPosition(true);

}



function prevComment() {

  internalIndex--;

  updateCarouselPosition(true);

}



/* =========================
   Autoplay
========================= */

function startAutoplay() {

  stopAutoplay();

  autoPlay = setInterval(nextComment, 5000);

}



function stopAutoplay() {

  if (autoPlay) {

    clearInterval(autoPlay);

    autoPlay = null;

  }

}



/* =========================
   Event listeners
========================= */

function addCarouselListeners() {

  const prev =
    document.getElementById("prevBtn");

  const next =
    document.getElementById("nextBtn");

  if (prev)
    prev.addEventListener("click", () => {

      prevComment();
      stopAutoplay();
      setTimeout(startAutoplay, 3000);

    });

  if (next)
    next.addEventListener("click", () => {

      nextComment();
      stopAutoplay();
      setTimeout(startAutoplay, 3000);

    });

  const container =
    document.querySelector(".carousel-container");

  if (container) {

    container.addEventListener("mouseenter", stopAutoplay);
    container.addEventListener("mouseleave", startAutoplay);

  }

  window.addEventListener("resize", () => {

    renderCarousel();

  });

  startAutoplay();

}



/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {

  incarcaComentariiPublice();

});
