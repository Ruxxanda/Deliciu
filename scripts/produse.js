let produse = [];
let cos = {};
let salvari = [];
let originalProduse = [];

async function afiseazaProduse(itemsToShow = null) {
    try {
        const res = await fetch('../data/products.json');
        if (!res.ok) throw new Error(await res.text());
        let data = await res.json();
        produse = Array.isArray(data) ? data : [];
        originalProduse = [...produse];
        
        if (typeof applyActiveReductions === 'function') {
          produse = await applyActiveReductions(produse);
          originalProduse = [...produse];
        }
        
        const toDisplay = itemsToShow || produse;
        
        const formatPrice = (price) => parseFloat(price || 0).toFixed(2);
        
        const searchName = document.getElementById('searchName').value.toLowerCase();
        const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
        const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
        const filterReduction = document.getElementById('filterReduction').value;
        const filterType = document.getElementById('filterType').value;
        
        const hasActiveFilters = searchName || minPrice !== 0 || maxPrice !== Infinity || filterReduction || filterType;
        
        const createProductCard = (p) => {
            const lang = (typeof getLang === 'function') ? getLang() : (document.documentElement.lang || 'ro');
            const name = p[`nume_${lang}`] || p.nume || p[`nume_ro`] || p.nume;
            const descr = '';
            const detailsArr = p[`detalii_${lang}`] || p.detalii || p[`detalii_ro`] || [];
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
            const isSaved = salvari.includes(p.nume);
            const heartColor = isSaved ? 'red' : 'white';
            const safeKey = (p.nume || name).replace(/\s/g, '-');
            const qtyId = `qty-${safeKey}`;
            const detailsId = `details-${safeKey}`;
            const buttonId = `btn-${safeKey}-details`;
            const detailsHTML = detailsArr ? `
                <button class="detalii" onclick="toggleDetails('${detailsId}', '${buttonId}')" id="${buttonId}">` + (lang === 'ru' ? 'Детали ▶' : (lang === 'en' ? 'Details ▶' : 'Detalii ▶')) + `</button>
                <div id="${detailsId}" style="display: none; margin-top: 10px; list-style: disc; padding-left: 20px;">${Array.isArray(detailsArr) ? detailsArr.map(detail => `<li>${detail}</li>`).join('') : detailsArr.split('\n').map(line => line.trim()).filter(line => line).map(line => `<li>${line}</li>`).join('')}</div>
            ` : '';
                const card = document.createElement("div");
                card.classList.add("produs");
                card.innerHTML = `
                        <div class="img-wrapper">
                            <img src="../${(p.imagine || p.linkImagine || '').replace(/^\./,'').replace(/^\//,'')}" alt="produs">
                            ${areReducere ? `<div class="badge-reducere">-${p.reducere}%</div>` : ''}
                            <i class="fa fa-heart heart-icon"
                                style="color: ${heartColor}"
                                onclick="toggleSalvare('${p.nume}', event)">
                            </i>
                        </div>
                        <h3>${name}</h3>
                        <!-- descriere eliminată -->
                        <p>${pretHTML}</p>
                        <div class="cantitate-info" style="color:#888;font-size:0.95em; margin-bottom:8px;">${p.cantitate ? p.cantitate : ''}</div>
                        <div class="canti">
                              <div class="derul">
                                    <button class="minus" onclick="changeQty('${p.nume}', -1)">
                                        <i class="fa-solid fa-minus"></i>
                                    </button>
                                      <span id="${qtyId}">${cos[p.nume] || 0}</span>
                                    <button class="plus" onclick="changeQty('${p.nume}', 1)">
                                        <i class="fa-solid fa-plus"></i>
                                    </button>
                              </div>
                              <button onclick="adaugaInCos('${p.nume}')">` + (lang === 'ru' ? 'Добавить в корзину' : (lang === 'en' ? 'Add to cart' : 'Adauga in cos')) + `</button>
                        </div>`;
                // navigate to tort.html when clicking the produit card (but ignore clicks on img-wrapper and interactive elements)
                card.addEventListener('click', function(e) {
                    if (e.target.closest('.img-wrapper') || e.target.closest('.canti') || e.target.closest('.detalii') || e.target.closest('.heart-icon') || e.target.closest('button')) return;
                    window.location.href = `tort.html?nume=${encodeURIComponent(p.nume)}`;
                });
            return card;
        };
        
        const div = document.getElementById('produseDisplay');
        if (div) {
            div.innerHTML = '';
            
            if (toDisplay.length === 0) {
                div.innerHTML = '<p style="text-align:center;padding:30px;color:#999;">Nu s-au gasit produse.</p>';
            } else {
                toDisplay.forEach(p => {
                    div.appendChild(createProductCard(p));
                });
            }
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function changeQty(nume, delta) {
    const qtyEl = document.getElementById(`qty-${nume.replace(/\s/g, '-')}`);
    let currentQty = parseInt(qtyEl.textContent);
    currentQty = Math.max(0, currentQty + delta);
    qtyEl.textContent = currentQty;
    cos[nume] = currentQty;
}

function toggleDetails(detailsId, buttonId) {
    const detailsDiv = document.getElementById(detailsId);
    const btn = document.getElementById(buttonId);

    if (!detailsDiv || !btn) {
        console.error('Could not find details or button element', detailsId, buttonId);
        return;
    }

    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        btn.innerHTML = 'Detalii ▼';
    } else {
        detailsDiv.style.display = 'none';
        btn.innerHTML = 'Detalii ▶';
    }
}

async function adaugaInCos(nume) {
    function getStorageUid() { return localStorage.getItem('uid') || 'guest'; }
    const uid = getStorageUid();
    const qtyEl = document.getElementById(`qty-${nume.replace(/\s/g, '-')}`);
    const cantitate = parseInt(qtyEl.textContent);
    const product = produse.find(p => p.nume === nume);
    const pret = product ? (product.pretRedus || product.pret) : 0;
    const descriere = product ? product.descriere : '';
    const cartKey = `cart_${uid}`;
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const existing = cart.find(i => i.nume === nume);
    if (existing) existing.cantitate = cantitate;
    else cart.push({ nume, cantitate, pret, descriere });
    localStorage.setItem(cartKey, JSON.stringify(cart));
    cos[nume] = cantitate;
    try {
      if (typeof loadStats === 'function') loadStats();
      else if (window && window.loadStats) window.loadStats();
      else setTimeout(()=>{ if (typeof loadStats === 'function') loadStats(); }, 200);
    } catch(e){ console.warn('Could not update cart badge', e); }
}

async function toggleSalvare(nume, ev) {
    function getStorageUid() { return localStorage.getItem('uid') || 'guest'; }
    const uid = getStorageUid();
    const isSaved = salvari.includes(nume);
    const heartIcon = ev && ev.target;
    const salvKey = `salvari_${uid}`;
    let saved = JSON.parse(localStorage.getItem(salvKey) || '[]');
    if (!Array.isArray(saved)) saved = [];
    if (isSaved) {
        saved = saved.filter(s => s !== nume);
        salvari = salvari.filter(id => id !== nume);
        if (heartIcon) heartIcon.style.color = 'white';
    } else {
        saved.push(nume);
        salvari.push(nume);
        if (heartIcon) heartIcon.style.color = 'red';
    }
    localStorage.setItem(salvKey, JSON.stringify(saved));
    if (typeof loadStats === 'function') loadStats();
}

async function loadUserData() {
    function getStorageUid() { return localStorage.getItem('uid') || 'guest'; }
    const uid = getStorageUid();

    try {
        salvari = JSON.parse(localStorage.getItem(`salvari_${uid}`) || '[]');
        const cartArr = JSON.parse(localStorage.getItem(`cart_${uid}`) || '[]');
        cos = {};
        cartArr.forEach(item => { cos[item.nume] = item.cantitate; });
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function initProducts() {
    await loadUserData();
    await afiseazaProduse();
    setupFilterListeners();
}

function applyFilters() {
    const searchName = document.getElementById('searchName').value.toLowerCase();
    const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
    const filterReduction = document.getElementById('filterReduction').value;
    const filterType = document.getElementById('filterType').value;

    const filtered = originalProduse.filter(p => {
        const priceTouse = p.pretRedus || p.pret;
        const nameMatch = p.nume.toLowerCase().includes(searchName);
        const priceMatch = priceTouse >= minPrice && priceTouse <= maxPrice;
        const typeMatch = !filterType || p.categoria === filterType;
        
        let reductionMatch = true;
        if (filterReduction === 'with') {
            reductionMatch = p.reducere != null && p.reducere !== "";
        } else if (filterReduction === 'without') {
            reductionMatch = !p.reducere || p.reducere === "";
        }
        
        return nameMatch && priceMatch && reductionMatch && typeMatch;
    });

    afiseazaProduse(filtered);
}

function resetFilters() {
    document.getElementById('searchName').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('filterReduction').value = '';
    document.getElementById('filterType').value = '';
    afiseazaProduse();
}

function setupFilterListeners() {
    const searchInput = document.getElementById('searchName');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const reductionFilter = document.getElementById('filterReduction');
    const typeFilter = document.getElementById('filterType');
    const resetBtn = document.getElementById('resetFiltersBtn');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (minPriceInput) minPriceInput.addEventListener('input', applyFilters);
    if (maxPriceInput) maxPriceInput.addEventListener('input', applyFilters);
    if (reductionFilter) reductionFilter.addEventListener('change', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
}

document.addEventListener("DOMContentLoaded", initProducts);

const originalLog = console.log;
console.log = function (...args) {
    if (args[0] === 'sterge produsele') {
        document.getElementById('produseDisplay').innerHTML = '<p style="color: red; text-align: center;">Produse șterse din afișare</p>';
        originalLog('Toate produsele au fost șterse din afișarea paginii produse');
        return;
    }
    originalLog.apply(console, args);
};
