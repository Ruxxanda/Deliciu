const layerData = {
    base: [
        {name: 'Vanilie', price: 120, qty: '700g', image: '../imagini/craft/blat vanilie.png'},
        {name: 'Ciocolată', price: 130, qty: '700g', image: '../imagini/craft/blat ciocolata.png'},
        {name: 'Red velvet', price: 140, qty: '700g', image: '../imagini/craft/blat red velvet.png'},
        {name: 'Lămâie', price: 110, qty: '700g', image: '../imagini/craft/blat lamaie.png'},
        {name: 'Morcov', price: 105, qty: '700g', image: '../imagini/craft/blat morcov.png'},
        {name: 'Fistic', price: 160, qty: '700g', image: '../imagini/craft/blat fistic.png'},
        {name: 'Nucă', price: 150, qty: '700g', image: '../imagini/craft/blat nuca.png'},
        {name: 'Oreo', price: 170, qty: '700g', image: '../imagini/craft/blat oreo.png'}
    ],
    cream: [
        {name: 'Cremă de vanilie', price: 70, qty: '300g', image: '../imagini/craft/crema vanilie.png'},
        {name: 'Cremă de ciocolată', price: 75, qty: '300g', image: '../imagini/craft/crema ciocolata.png'},
        {name: 'Cremă mascarpone', price: 80, qty: '300g', image: '../imagini/craft/crema mascarpone.png'},
        {name: 'Cremă de brânză (cream cheese)', price: 78, qty: '300g', image: '../imagini/craft/crema branza.png'},
        {name: 'Cremă de fructe (căpșuni, zmeură, mango, fructe de pădure)', price: 85, qty: '300g', image: '../imagini/craft/crema fructe.png'},
        {name: 'Ganache de ciocolată', price: 90, qty: '300g', image: '../imagini/craft/ganache ciocolata.png'},
        {name: 'Cremă de caramel sărat', price: 82, qty: '300g', image: '../imagini/craft/crema caramel.png'}
    ],
    filling: [
        {name: 'Căpșuni proaspete', price: 55, qty: '200g', image: '../imagini/craft/capsuni.png'},
        {name: 'Zmeură', price: 58, qty: '200g', image: '../imagini/craft/zmeura.png'},
        {name: 'Afine', price: 60, qty: '200g', image: '../imagini/craft/afine.png'},
        {name: 'Vișine', price: 56, qty: '200g', image: '../imagini/craft/visine.png'},
        {name: 'Mango', price: 62, qty: '200g', image: '../imagini/craft/mango.png'},
        {name: 'Banane', price: 50, qty: '200g', image: '../imagini/craft/banane.png'},
        {name: 'Gem de fructe', price: 45, qty: '200g', image: '../imagini/craft/gem fructe.png'},
        {name: 'Caramel', price: 52, qty: '200g', image: '../imagini/craft/caramel.png'},
        {name: 'Sos de ciocolată', price: 48, qty: '200g', image: '../imagini/craft/sos.png'}
    ],
    exterior: [
        {name: 'Cremă de unt', price: 60, qty: '400g'},
        {name: 'Cremă mascarpone', price: 65, qty: '400g'},
        {name: 'Ciocolată oglindă', price: 80, qty: '400g'},
        {name: 'Glazură simplă', price: 55, qty: '400g'},
        {name: 'Fondant', price: 75, qty: '400g'}
    ],
    color: [
        {name: 'Alb', price: 0, qty: '0g'},
        {name: 'Pastel (roz, bleu, lila etc.)', price: 20, qty: '0g'},
        {name: 'Culori personalizate', price: 25, qty: '0g'}
    ],
    texture: [
        {name: 'Neted', price: 0, qty: '0g'},
        {name: 'Rustic', price: 15, qty: '0g'},
        {name: 'Drip cake (ciocolată curgătoare)', price: 25, qty: '0g'},
        {name: 'Ombre', price: 30, qty: '0g'},
        {name: 'Semi-naked', price: 20, qty: '0g'}
    ],
    decor: [
        {name: 'Fructe proaspete', price: 35, qty: '150g'},
        {name: 'Flori comestibile', price: 40, qty: '100g'},
        {name: 'Macarons', price: 50, qty: '150g'},
        {name: 'Bomboane', price: 32, qty: '150g'},
        {name: 'Ciocolată', price: 38, qty: '150g'},
        {name: 'Nuci / alune', price: 30, qty: '150g'},
        {name: 'Sprinkles', price: 28, qty: '100g'}
    ]
};

let selected = [];

function getImagePath(item) {
    return item.image || 'imagini/craft/craft.png';
}

function updatePreview() {
    const rightPanel = document.querySelector('.right');
    rightPanel.innerHTML = '';
    selected.forEach((item, index) => {
        if (['base', 'cream', 'filling'].includes(item.type)) {
            const imagePath = getImagePath(item);
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = item.name;
            img.classList.add(item.type);
            if (index === 0) {
                img.style.marginBottom = '0';
            } else {
                img.style.marginTop = '-80px';
                img.style.marginBottom = '0';
            }
            img.style.zIndex = selected.length - index;
            img.onerror = function() {
                if (!this.dataset.fallback) {
                    this.dataset.fallback = '1';
                    this.src = 'imagini/craft/craft.png';
                    this.alt = `Imagine implicită: ${item.name}`;
                    return;
                }
                console.error(`Imagine not found: ${this.src}`);
                this.style.border = '2px solid #ff6666';
                this.style.padding = '10px';
                this.style.background = '#ffe6e6';
                this.alt = `Imagine indisponibilă: ${item.name}`;
            };
            img.onload = function() {
                console.log(`Imagine loaded successfully: ${this.src}`);
            };
            rightPanel.appendChild(img);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    for (const type in layerData) {
        if (type === 'decor') continue;
        const select = document.getElementById(`select-${type}`);
        layerData[type].forEach(item => {
            const option = document.createElement('option');
            option.text = item.name;
            select.appendChild(option);
        });
    }
    const decorDiv = document.getElementById('decorOptions');
    layerData.decor.forEach(item => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${item.name}"> ${item.name}`;
        decorDiv.appendChild(label);
    });
    document.getElementById('select-color').onchange = function() {
        const picker = document.getElementById('colorPicker');
        if (this.value === 'Culori personalizate') {
            picker.style.display = 'block';
        } else {
            picker.style.display = 'none';
        }
    };
    updateSummary();
});

function addLayer(type) {
    const select = document.getElementById(`select-${type}`);
    const selectedValue = select.value;
    let item;
    if (type === 'color' && selectedValue === 'Culori personalizate') {
        const color = document.getElementById('colorPicker').value;
        item = {name: 'Culoare personalizată: ' + color, price: 15, qty: '0g'};
    } else {
        item = layerData[type].find(i => i.name === selectedValue);
    }
    if (item) {
        selected.push({...item, type});
        updateSummary();
        updatePreview();
    }
}

function addDecor() {
    const checkboxes = document.querySelectorAll('#decorOptions input:checked');
    checkboxes.forEach(cb => {
        const item = layerData.decor.find(i => i.name === cb.value);
        selected.push({...item, type: 'decor'});
        cb.checked = false;
    });
    updateSummary();
    updatePreview();
}

function updateSummary() {
    const div = document.getElementById('summary');
    div.innerHTML = '<h3>Sloiuri alese:</h3>';
    if (selected.length === 0) {
        div.innerHTML += '<p>Nimic selectat.</p>';
        return;
    }
    let totalPrice = 0;
    let totalQty = 0;
    selected.forEach((item, index) => {
        const qtyNum = parseInt(item.qty) || 0;
        totalPrice += item.price;
        totalQty += qtyNum;
        div.innerHTML += `<div>${item.name} - ${item.price} Lei - ${item.qty} <button onclick="removeLayer(${index})">Șterge</button></div>`;
    });
    div.innerHTML += `<p><strong>Preț total: ${totalPrice} Lei</strong></p>`;
    div.innerHTML += `<p><strong>Cantitate totală: ${totalQty / 1000} kg</strong></p>`;
    div.innerHTML += `<label>Denumire tort: <br> <input id="cakeName" type="text" placeholder="Ex: Tortul meu fantastic"></label><br>`;
    div.innerHTML += `<button class="adauga" onclick="addToCart()">Adauga in cos</button> <button class="incepe" onclick="reset()">Începe de la zero</button>`;
}

function removeLayer(index) {
    selected.splice(index, 1);
    updateSummary();
    updatePreview();
}

function reset() {
    selected = [];
    updateSummary();
    updatePreview();
}

async function addToCart() {
    const nume = document.getElementById('cakeName').value.trim() || 'Tort personalizat';
    const pret = selected.reduce((sum, item) => sum + item.price, 0);
    const descriere = '<ul>' + selected.map(s => `<li>${s.name}: ${s.price} Lei, ${s.qty}</li>`).join('') + '</ul>';
    let totalQty = 0;
    selected.forEach(item => {
        const qtyNum = parseInt(item.qty) || 0;
        totalQty += qtyNum;
    });
    function getStorageUid() { return localStorage.getItem('uid') || 'guest'; }
    const uid = getStorageUid();
    if (selected.length === 0) {
        console.error("Selectați măcar un sloi.");
        return;
    }
    const cartKey = `cart_${uid}`;
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    cart.push({ nume, cantitate: 1, pret, descriere, isCraft: true, totalQty });
    localStorage.setItem(cartKey, JSON.stringify(cart));
    console.log("Tort adăugat în coș (localStorage)!");
    try { if (typeof loadStats === 'function') loadStats(); else if (window && window.loadStats) window.loadStats(); else setTimeout(()=>{ if (typeof loadStats === 'function') loadStats(); }, 200); } catch(e){}
    reset();
}