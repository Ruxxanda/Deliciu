let produse = [];
let cos = {};
let salvari = [];
let originalProduse = []; // Store original unfiltered list

async function afiseazaProduse(itemsToShow = null) {
    try {
        const res = await fetch('../data/products.json');
        if (!res.ok) throw new Error(await res.text());
        let data = await res.json();
        produse = Array.isArray(data) ? data : [];
        originalProduse = [...produse]; // Keep original copy
        
        // Apply active reductions from Firestore
        if (typeof applyActiveReductions === 'function') {
          produse = await applyActiveReductions(produse);
          originalProduse = [...produse];
        }
        
        // Use filtered items if provided, otherwise show all
        const toDisplay = itemsToShow || produse;
        
        const formatPrice = (price) => parseFloat(price || 0).toFixed(2);
        
        // Check if any filters are applied
        const searchName = document.getElementById('searchName').value.toLowerCase();
        const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
        const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
        const filterReduction = document.getElementById('filterReduction').value;
        const filterType = document.getElementById('filterType').value;
        
        const hasActiveFilters = searchName || minPrice !== 0 || maxPrice !== Infinity || filterReduction || filterType;
        
        // Organize by category
        const categories = {
            'tort': [],
            'chec': [],
            'tarte': []
        };
        
        toDisplay.forEach(p => {
            const cat = p.categoria || 'tort';
            if (categories[cat]) categories[cat].push(p);
        });
        
        // Function to create product card HTML
        const createProductCard = (p) => {
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
            const qtyId = `qty-${p.nume.replace(/\s/g, '-')}`;
            const detailsId = `details-${p.nume.replace(/\s/g, '-')}`;
            const buttonId = `btn-${p.nume.replace(/\s/g, '-')}-details`;
            const detailsHTML = p.detalii ? `
                <button class="detalii" onclick="toggleDetails('${detailsId}', '${buttonId}')" id="${buttonId}">Detalii ▶</button>
                <div id="${detailsId}" style="display: none; margin-top: 10px; list-style: disc; padding-left: 20px;">${Array.isArray(p.detalii) ? p.detalii.map(detail => `<li>${detail}</li>`).join('') : p.detalii.split('\n').map(line => line.trim()).filter(line => line).map(line => `<li>${line}</li>`).join('')}</div>
            ` : '';
            const card = document.createElement("div");
            card.classList.add("produs");
            card.innerHTML = `
                <div class="img-wrapper">
                   <img src="../${(p.imagine || p.linkImagine || '').replace(/^\.\//,'').replace(/^\//,'')}" alt="produs">
                   ${areReducere ? `<div class="badge-reducere">-${p.reducere}%</div>` : ''}
                   <i class="fa fa-heart heart-icon"
                      style="color: ${heartColor}"
                      onclick="toggleSalvare('${p.nume}', event)">
                   </i>
                </div>
                <h3>${p.nume}</h3>
                <p>${p.descriere}</p>
                <p>${pretHTML}</p>
                ${detailsHTML}
                <div class="canti">
                    <div class="derul">
                       <button class="minus" onclick="changeQty('${p.nume}', -1)">-</button>
                       <span id="${qtyId}">${cos[p.nume] || 0}</span>
                       <button class="plus" onclick="changeQty('${p.nume}', 1)">+</button>
                    </div>
                    <button onclick="adaugaInCos('${p.nume}')">Adauga in cos</button>
                </div>`;
            return card;
        };
        
        if (hasActiveFilters) {
            // Show all results in a single list without categories
            const div = document.getElementById('produseDisplayNoCategory');
            if (div) {
                div.innerHTML = '';
                // Hide category titles
                document.getElementById('titleTort').style.display = 'none';
                document.getElementById('titleChec').style.display = 'none';
                document.getElementById('titleTarte').style.display = 'none';
                // Clear category containers
                document.getElementById('produseDisplayTort').innerHTML = '';
                document.getElementById('produseDisplayChec').innerHTML = '';
                document.getElementById('produseDisplayTarte').innerHTML = '';
                
                if (toDisplay.length === 0) {
                    div.innerHTML = '<p style="text-align:center;padding:30px;color:#999;">Nu s-au gasit produse.</p>';
                } else {
                    toDisplay.forEach(p => {
                        div.appendChild(createProductCard(p));
                    });
                }
            }
        } else {
            // Show categories normally
            document.getElementById('titleTort').style.display = 'block';
            document.getElementById('titleChec').style.display = 'block';
            document.getElementById('titleTarte').style.display = 'block';
            document.getElementById('produseDisplayNoCategory').innerHTML = '';
            
            // Display each category
            const displayCategory = (catKey, containerId) => {
                const div = document.getElementById(containerId);
                if (!div) return;
                
                const items = categories[catKey];
                div.innerHTML = '';
                
                if (items.length === 0) {
                    div.innerHTML = '<p style="text-align:center;padding:30px;color:#999;">Nu s-au gasit produse.</p>';
                    return;
                }
                
                items.forEach(p => {
                    div.appendChild(createProductCard(p));
                });
            };
            
            displayCategory('tort', 'produseDisplayTort');
            displayCategory('chec', 'produseDisplayChec');
            displayCategory('tarte', 'produseDisplayTarte');
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
    const uid = localStorage.getItem("uid");
    if (!uid) {
        document.getElementById("error").innerText = "Trebuie să fiți logat pentru a adăuga în coș.";
        return;
    }
    const qtyEl = document.getElementById(`qty-${nume.replace(/\s/g, '-')}`);
    const cantitate = parseInt(qtyEl.textContent);
    const product = produse.find(p => p.nume === nume);
    const pret = product ? (product.pretRedus || product.pret) : 0;
    const descriere = product ? product.descriere : '';
    // Save cart to localStorage under key cart_<uid>
    const cartKey = `cart_${uid}`;
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const existing = cart.find(i => i.nume === nume);
    if (existing) existing.cantitate = cantitate;
    else cart.push({ nume, cantitate, pret, descriere });
    localStorage.setItem(cartKey, JSON.stringify(cart));
    // Update local state
    cos[nume] = cantitate;
    // Ensure global stats/cart badge is updated
    try {
      if (typeof loadStats === 'function') loadStats();
      else if (window && window.loadStats) window.loadStats();
      else setTimeout(()=>{ if (typeof loadStats === 'function') loadStats(); }, 200);
    } catch(e){ console.warn('Could not update cart badge', e); }
}

async function toggleSalvare(nume, ev) {
    const uid = localStorage.getItem("uid");
    if (!uid) {
        document.getElementById("error").innerText = "Trebuie să fiți logat pentru a salva produse.";
        return;
    }
    const isSaved = salvari.includes(nume);
    const heartIcon = ev && ev.target;
    const salvKey = `salvari_${uid}`;
    let saved = JSON.parse(localStorage.getItem(salvKey) || '[]');
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
}

async function loadUserData() {
    const uid = localStorage.getItem("uid");
    if (!uid) return;

    try {
        // load saves and cart from localStorage
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

// Filter and search functionality
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

// Console command listener
const originalLog = console.log;
console.log = function (...args) {
    if (args[0] === 'sterge produsele') {
        // Clear products from products page
        document.getElementById('produseDisplay').innerHTML = '<p style="color: red; text-align: center;">Produse șterse din afișare</p>';
        originalLog('Toate produsele au fost șterse din afișarea paginii produse');
        return;
    }
    originalLog.apply(console, args);
};
