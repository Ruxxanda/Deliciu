async function loadStats() {
  try {
    const uid = localStorage.getItem("uid") || 'guest';

    const salvari = JSON.parse(localStorage.getItem(`salvari_${uid}`) || '[]');
    const savedCount = Array.isArray(salvari) ? salvari.length : 0;
    const cartArr = JSON.parse(localStorage.getItem(`cart_${uid}`) || '[]');
    const cartCount = Array.isArray(cartArr) ? cartArr.reduce((sum, item) => sum + (item.cantitate || 0), 0) : 0;

    const savedCountEl = document.getElementById("savedCount");
    const cartCountEl = document.getElementById("cartCount");
    
    if (savedCountEl) savedCountEl.textContent = savedCount;
    if (cartCountEl) cartCountEl.textContent = cartCount;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadStats);