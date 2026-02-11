async function loadStats() {
  try {
    const uid = localStorage.getItem("uid");
    if (!uid) {
      document.getElementById("savedCount").textContent = "0";
      document.getElementById("cartCount").textContent = "0";
      return;
    }

    const salvari = JSON.parse(localStorage.getItem(`salvari_${uid}`) || '[]');
    const savedCount = salvari.length;
    const cartArr = JSON.parse(localStorage.getItem(`cart_${uid}`) || '[]');
    const cartCount = cartArr.reduce((sum, item) => sum + (item.cantitate || 0), 0);

    const savedCountEl = document.getElementById("savedCount");
    const cartCountEl = document.getElementById("cartCount");
    
    if (savedCountEl) savedCountEl.textContent = savedCount;
    if (cartCountEl) cartCountEl.textContent = cartCount;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadStats);