
fetch('../data/noutati.json')
  .then(r => r.json())
  .then(noutati => {
    const container = document.getElementById('noutatiContainer');
    if (!Array.isArray(noutati) || noutati.length === 0) {
      container.innerHTML = '<p>Nu există noutăți disponibile.</p>';
      return;
    }
    container.innerHTML = noutati.map(n => `
      <article class="noutate">
        <h3>${n.denumire || ''}</h3>
        <div class="data">${n.data_publicarii || ''}</div>
        <div class="text">${n.text || ''}</div>
        ${n.fotografii && n.fotografii.length ? `<div class="foto">${n.fotografii.map(f => `<img src="../imagini/noutati/${f}" alt="foto noutate">`).join('')}</div>` : ''}
      </article>
    `).join('');
  })
  .catch(() => {
    document.getElementById('noutatiContainer').innerHTML = '<p>Eroare la încărcarea noutăților.</p>';
  });
