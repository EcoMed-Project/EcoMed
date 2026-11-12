/**
 * EcoMed Farmácia Solidária — UI Component Renderers
 * window.medsUi — vanilla JS, sem dependências
 */
(function () {
  'use strict';

  /* ── Tariff config ──────────────────────────────────── */
  const TARIFF = {
    'isento':         { label: 'Isento',        color: '#16a34a', bg: '#dcfce7' },
    'tarja-amarela':  { label: 'Tarja Amarela',  color: '#854d0e', bg: '#fef9c3' },
    'tarja-vermelha': { label: 'Tarja Vermelha', color: '#991b1b', bg: '#fee2e2' },
    'tarja-preta':    { label: 'Tarja Preta',    color: '#1c1917', bg: '#e7e5e4' }
  };

  const TARIFF_ALERT = {
    'isento':         '✓ Medicamento sem tarja — disponível sem receita',
    'tarja-amarela':  '⚠ Tarja Amarela — requer receita simples',
    'tarja-vermelha': '🔴 Tarja Vermelha — requer receita médica',
    'tarja-preta':    '🚫 Tarja Preta — receita especial de retenção obrigatória'
  };

  /* ── Helper: escape HTML ─────────────────────────────── */
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Public API ─────────────────────────────────────── */
  const medsUi = {

    /**
     * renderTariffBadge(tariff) → <span> pill
     */
    renderTariffBadge(tariff) {
      const t = TARIFF[tariff] || TARIFF['isento'];
      return `<span style="display:inline-block;background:${t.bg};color:${t.color};border-radius:100px;padding:2px 10px;font-size:0.75rem;font-weight:700;">${esc(t.label)}</span>`;
    },

    /**
     * renderMedicineCard(medicine, postName) → card HTML
     */
    renderMedicineCard(medicine, postName) {
      const inStock = medicine.stock > 0;
      return `
<article class="medicine-card">
  <div class="medicine-card-title">
    <h3>${esc(medicine.name)}</h3>
    ${this.renderTariffBadge(medicine.tariff)}
  </div>
  <span class="dosage-pill">${esc(medicine.dosage)}</span>
  <p class="category">${esc(medicine.category)}</p>
  ${inStock
    ? `<p class="stock-ok">✓ Disponível (${medicine.stock} unidades)</p>`
    : `<p class="stock-out">✗ Sem estoque no momento</p>`}
  <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px">
    <span class="ecocoins-pill">🌱 ${medicine.eco_coins} EcoCoins</span>
    ${postName ? `<span style="font-size:0.82rem;color:var(--muted)">📍 ${esc(postName)}</span>` : ''}
  </div>
  <div class="card-actions">
    <a href="/medicamento?id=${esc(medicine.id)}" class="btn-outline-teal" style="font-size:0.84rem;padding:8px 18px">Ver detalhes</a>
    <a href="/solicitar?id=${esc(medicine.id)}" class="btn-teal${inStock ? '' : ' disabled'}" style="font-size:0.84rem;padding:8px 18px${inStock ? '' : ';opacity:.55;pointer-events:none'}"${inStock ? '' : ' aria-disabled="true"'}>Reservar</a>
  </div>
</article>`.trim();
    },

    /**
     * renderMedicineInfo(medicine) → full info panel
     */
    renderMedicineInfo(medicine) {
      const t = TARIFF[medicine.tariff] || TARIFF['isento'];
      const alertText = TARIFF_ALERT[medicine.tariff] || TARIFF_ALERT['isento'];
      return `
<div class="medicine-info">
  <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
    <h2 style="margin:0">${esc(medicine.name)} <small style="font-size:0.65em;font-weight:500;color:var(--muted)">${esc(medicine.dosage)}</small></h2>
    ${this.renderTariffBadge(medicine.tariff)}
  </div>
  <div class="tariff-alert" style="background:${t.bg};color:${t.color};border-radius:12px;padding:14px 18px;font-weight:600;font-size:0.9rem;margin:0 0 20px">
    ${alertText}
  </div>
  <div class="info-section">
    <h4>Descrição</h4>
    <p>${esc(medicine.description)}</p>
  </div>
  <div class="info-section">
    <h4>Categoria</h4>
    <p>${esc(medicine.category)}</p>
  </div>
  <div class="info-section">
    <h4>Contraindicações</h4>
    <p>${esc(medicine.contraindications)}</p>
  </div>
  <div class="info-section">
    <h4>Instruções de uso</h4>
    <p>${esc(medicine.instructions)}</p>
  </div>
  <div style="margin-top:20px">
    <span class="ecocoins-pill" style="font-size:0.9rem;padding:6px 16px">🌱 Vale ${medicine.eco_coins} EcoCoins ao doar</span>
  </div>
</div>`.trim();
    },

    /**
     * renderPostCard(post, distanceKm) → card HTML
     */
    renderPostCard(post, distanceKm) {
      return `
<div class="post-card">
  ${distanceKm !== null && distanceKm !== undefined
    ? `<span class="distance-badge">${Number(distanceKm).toFixed(1)} km</span>`
    : ''}
  <h4>${esc(post.name)}</h4>
  <div class="post-meta">
    📍 ${esc(post.address)}<br>
    🕐 ${esc(post.hours)}<br>
    📞 ${esc(post.phone)}
  </div>
</div>`.trim();
    },

    /**
     * renderPostCardSelectable(post, distanceKm, selectedId) → selectable card for PostPicker
     */
    renderPostCardSelectable(post, distanceKm, selectedId) {
      const isSelected = post.id === selectedId;
      return `
<div class="post-card${isSelected ? ' selected' : ''}" data-post-id="${esc(post.id)}" style="cursor:pointer" onclick="document.getElementById('selected-post-id').value='${esc(post.id)}';document.querySelectorAll('.post-card').forEach(el=>el.classList.remove('selected'));this.classList.add('selected');document.getElementById('post-error').style.display='none'">
  ${distanceKm !== null && distanceKm !== undefined
    ? `<span class="distance-badge">${Number(distanceKm).toFixed(1)} km</span>`
    : ''}
  <h4>${esc(post.name)}</h4>
  <div class="post-meta">
    📍 ${esc(post.address)}<br>
    🕐 ${esc(post.hours)}<br>
    📞 ${esc(post.phone)}
  </div>
  ${isSelected ? '<p style="color:var(--eco-teal);font-size:0.82rem;font-weight:700;margin:6px 0 0">✓ Selecionado</p>' : ''}
</div>`.trim();
    }
  };

  window.medsUi = medsUi;
})();

