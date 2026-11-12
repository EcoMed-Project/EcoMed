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
    'isento':         'Medicamento Isento de Prescrição (MIP) — disponível para orientação comunitária.',
    'tarja-amarela':  'Medicamento Genérico / Tarja Amarela — requer apresentação de receita simples.',
    'tarja-vermelha': 'Medicamento sob Prescrição Médica — retenção ou apresentação de receita médica.',
    'tarja-preta':    'Medicamento Controlado Especial — receita de controle especial em duas vias obrigatória.'
  };

  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';

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
      return `<span class="tariff-badge-pill" style="background:${t.bg};color:${t.color};border:1px solid ${t.color}33;">${esc(t.label)}</span>`;
    },

    /**
     * renderMedicineCard(medicine, postName) → modern visual card with image
     */
    renderMedicineCard(medicine, postName) {
      const inStock = (medicine.stock || 0) > 0;
      const imgUrl = medicine.image || FALLBACK_IMG;

      return `
<article class="medicine-card">
  <div class="medicine-card-media">
    <img src="${esc(imgUrl)}" alt="${esc(medicine.name)}" class="medicine-card-img" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
    <div class="medicine-floating-badge">
      ${this.renderTariffBadge(medicine.tariff)}
    </div>
  </div>
  <div class="medicine-card-body">
    <div class="medicine-card-title-row">
      <h3 class="medicine-name">${esc(medicine.name)}</h3>
      <span class="dosage-pill">${esc(medicine.dosage)}</span>
    </div>
    <p class="category">${esc(medicine.category)}</p>
    
    <div class="stock-status-wrap">
      ${inStock
        ? `<span class="stock-ok">Disponível (${medicine.stock} un.)</span>`
        : `<span class="stock-out">Indisponível no momento</span>`}
    </div>

    <div class="medicine-card-meta">
      <span class="ecocoins-pill">${medicine.eco_coins} EcoCoins</span>
      ${postName ? `<span class="post-pill" title="${esc(postName)}">${esc(postName)}</span>` : ''}
    </div>

    <div class="medicine-card-actions">
      <a href="/medicamento?id=${esc(medicine.id)}" class="btn-outline-teal card-btn">Detalhes</a>
      <a href="/solicitar?id=${esc(medicine.id)}" class="btn-teal card-btn${inStock ? '' : ' disabled'}" ${inStock ? '' : 'aria-disabled="true"'}>Reservar</a>
    </div>
  </div>
</article>`.trim();
    },

    /**
     * renderMedicineInfo(medicine) → full info panel with image and clinical metadata
     */
    renderMedicineInfo(medicine) {
      const t = TARIFF[medicine.tariff] || TARIFF['isento'];
      const alertText = TARIFF_ALERT[medicine.tariff] || TARIFF_ALERT['isento'];
      const imgUrl = medicine.image || FALLBACK_IMG;

      return `
<div class="medicine-detail-wrapper">
  <div class="medicine-detail-hero">
    <div class="medicine-detail-media">
      <img src="${esc(imgUrl)}" alt="${esc(medicine.name)}" class="medicine-detail-img" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
      <div style="margin-top:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        ${this.renderTariffBadge(medicine.tariff)}
        <span class="ecocoins-pill" style="font-size:0.95rem;padding:6px 16px">Vale ${medicine.eco_coins} EcoCoins ao doar</span>
      </div>
    </div>

    <div class="medicine-detail-info">
      <div style="margin-bottom:12px">
        <h2 style="font-size:clamp(1.8rem,3vw,2.4rem);margin:0 0 6px">${esc(medicine.name)} <span style="font-size:0.65em;font-weight:600;color:var(--muted)">${esc(medicine.dosage)}</span></h2>
        <span class="dosage-pill" style="font-size:0.85rem">${esc(medicine.category)}</span>
      </div>

      <div class="tariff-alert" style="background:${t.bg};color:${t.color};border-radius:12px;padding:14px 18px;font-weight:600;font-size:0.92rem;margin:18px 0;line-height:1.5">
        ${alertText}
      </div>

      <div class="info-section">
        <h4>Descrição Terapêutica</h4>
        <p>${esc(medicine.description)}</p>
      </div>

      <div class="info-section">
        <h4>Contraindicações e Cuidados</h4>
        <p>${esc(medicine.contraindications)}</p>
      </div>

      <div class="info-section">
        <h4>Instruções Gerais de Uso</h4>
        <p>${esc(medicine.instructions)}</p>
      </div>

      <div class="info-section">
        <h4>Validade Típica</h4>
        <p>${medicine.validity_months ? medicine.validity_months + ' meses a partir da data de fabricação' : 'Consulte na embalagem'}</p>
      </div>
    </div>
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
    Endereço: ${esc(post.address)}<br>
    Horário: ${esc(post.hours)}<br>
    Telefone: ${esc(post.phone)}
  </div>
</div>`.trim();
    },

    /**
     * renderPostCardSelectable(post, distanceKm, selectedId) → selectable card for PostPicker
     */
    renderPostCardSelectable(post, distanceKm, selectedId) {
      const isSelected = post.id === selectedId;
      return `
<div class="post-card${isSelected ? ' selected' : ''}" data-post-id="${esc(post.id)}" style="cursor:pointer" onclick="document.getElementById('selected-post-id').value='${esc(post.id)}';document.querySelectorAll('.post-card').forEach(el=>el.classList.remove('selected'));this.classList.add('selected');var err=document.getElementById('post-error');if(err)err.style.display='none'">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
    ${distanceKm !== null && distanceKm !== undefined
      ? `<span class="distance-badge">${Number(distanceKm).toFixed(1)} km</span>`
      : '<span></span>'}
    ${isSelected ? '<span style="color:var(--eco-teal);font-size:0.8rem;font-weight:700">Selecionado</span>' : '<span style="color:var(--muted);font-size:0.8rem">Toque para selecionar</span>'}
  </div>
  <h4>${esc(post.name)}</h4>
  <div class="post-meta">
    Endereço: ${esc(post.address)}<br>
    Horário: ${esc(post.hours)}<br>
    Telefone: ${esc(post.phone)}
  </div>
</div>`.trim();
    }
  };

  window.medsUi = medsUi;
})();
