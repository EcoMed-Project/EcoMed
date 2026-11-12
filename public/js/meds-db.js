/**
 * EcoMed Farmácia Solidária — Local Database (localStorage)
 * window.medsDb — versão vanilla JS, sem dependências
 */
(function () {
  'use strict';

  /* ── Dados iniciais ─────────────────────────────────── */

  const SEED_MEDICINES = [
    { id: 'med-001', name: 'Paracetamol', dosage: '500mg', category: 'Analgésico/Antipirético', tariff: 'isento', description: 'Alívio de dor e febre.', contraindications: 'Hepatopatia severa, hipersensibilidade.', instructions: 'Adultos: 500–1000 mg a cada 4–6 h (máx 4 g/dia).', validity_months: 36, stock: 45, eco_coins: 15, posts: ['post-001', 'post-002', 'post-003'] },
    { id: 'med-002', name: 'Ibuprofeno', dosage: '600mg', category: 'Anti-inflamatório', tariff: 'isento', description: 'Anti-inflamatório, analgésico e antipirético.', contraindications: 'Úlcera péptica, insuficiência renal, gestantes.', instructions: 'Adultos: 400–800 mg a cada 6–8 h com alimento.', validity_months: 36, stock: 28, eco_coins: 20, posts: ['post-001', 'post-004'] },
    { id: 'med-003', name: 'Amoxicilina + Clavulanato', dosage: '500/125mg', category: 'Antibiótico', tariff: 'tarja-amarela', description: 'Antibiótico de amplo espectro.', contraindications: 'Alergia a penicilinas, mononucleose infecciosa.', instructions: 'Adultos: 1 comprimido a cada 8 h por 7–14 dias (prescrição médica).', validity_months: 24, stock: 12, eco_coins: 35, posts: ['post-002', 'post-005'] },
    { id: 'med-004', name: 'Losartana Potássica', dosage: '50mg', category: 'Anti-hipertensivo', tariff: 'tarja-vermelha', description: 'Controle da pressão arterial.', contraindications: 'Gravidez, hipotensão severa.', instructions: 'Adultos: 50 mg 1×/dia (pode ser ajustado pelo médico).', validity_months: 36, stock: 33, eco_coins: 25, posts: ['post-001', 'post-003', 'post-005'] },
    { id: 'med-005', name: 'Metformina', dosage: '850mg', category: 'Antidiabético', tariff: 'tarja-vermelha', description: 'Controle da glicemia no diabetes tipo 2.', contraindications: 'Insuficiência renal/hepática grave, alcoolismo.', instructions: 'Adultos: 850 mg 2–3×/dia com refeições.', validity_months: 36, stock: 21, eco_coins: 20, posts: ['post-002', 'post-004'] },
    { id: 'med-006', name: 'Omeprazol', dosage: '20mg', category: 'Protetor Gástrico', tariff: 'isento', description: 'Tratamento de gastrite e refluxo.', contraindications: 'Hipersensibilidade a benzimidazóis.', instructions: 'Adultos: 20 mg 1×/dia em jejum por 4–8 semanas.', validity_months: 36, stock: 52, eco_coins: 15, posts: ['post-001', 'post-002', 'post-003', 'post-004', 'post-005'] },
    { id: 'med-007', name: 'Clonazepam', dosage: '2mg', category: 'Ansiolítico/Anticonvulsivante', tariff: 'tarja-preta', description: 'Tratamento de ansiedade e convulsões.', contraindications: 'Glaucoma, insuficiência hepática grave, gestantes.', instructions: 'Adultos: dose individualizada pelo médico. Uso controlado — requer receita especial.', validity_months: 24, stock: 8, eco_coins: 40, posts: ['post-003'] },
    { id: 'med-008', name: 'Dipirona Sódica', dosage: '500mg/mL', category: 'Analgésico/Antipirético', tariff: 'isento', description: 'Solução oral para dor e febre.', contraindications: 'Hipersensibilidade a dipirona, agranulocitose prévia.', instructions: 'Adultos: 20–40 gotas até 4×/dia.', validity_months: 24, stock: 38, eco_coins: 15, posts: ['post-001', 'post-004', 'post-005'] }
  ];

  const SEED_POSTS = [
    { id: 'post-001', name: 'UBS Central Dr. Paulo Freire', address: 'Rua das Acácias, 123 - Centro, Paulista-SP', lat: -23.5505, lng: -46.6333, hours: 'Seg–Sex 7h–17h', phone: '(11) 3333-1001', email: 'ubs.paulo.freire@saude.sp.gov.br' },
    { id: 'post-002', name: 'Farmácia Solidária Vila Mariana', address: 'Av. Domingos de Morais, 450 - Vila Mariana, SP', lat: -23.5890, lng: -46.6336, hours: 'Seg–Sex 7h–19h | Sáb 8h–13h', phone: '(11) 5555-2002', email: 'farm.vilamariana@prefeitura.sp.gov.br' },
    { id: 'post-003', name: 'UBS Pinheiros', address: 'Rua Teodoro Sampaio, 310 - Pinheiros, SP', lat: -23.5612, lng: -46.6933, hours: 'Seg–Sex 7h–17h', phone: '(11) 3816-3003', email: 'ubs.pinheiros@saude.sp.gov.br' },
    { id: 'post-004', name: 'Centro de Saúde da Lapa', address: 'Rua Guaicurus, 1210 - Lapa, SP', lat: -23.5235, lng: -46.7102, hours: 'Seg–Sex 7h–19h', phone: '(11) 3832-4004', email: 'cs.lapa@saude.sp.gov.br' },
    { id: 'post-005', name: 'Posto Integrado Mooca', address: 'Rua da Mooca, 2555 - Mooca, SP', lat: -23.5520, lng: -46.5952, hours: 'Seg–Sex 7h–17h | Sáb 7h–12h', phone: '(11) 2607-5005', email: 'pi.mooca@saude.sp.gov.br' }
  ];

  const SEED_DONATIONS = [
    { id: 'don-001', medicine: 'Ibuprofeno 400mg', quantity: 10, expiry: '2027-06', lot: 'IBP2024A', donor_name: 'Maria Santos', donor_phone: '(11) 91234-5678', donor_email: 'maria@email.com', post_id: 'post-001', status: 'pending', created_at: new Date().toISOString(), photos: [] },
    { id: 'don-002', medicine: 'Omeprazol 20mg', quantity: 20, expiry: '2026-12', lot: 'OMP2023B', donor_name: 'João Oliveira', donor_phone: '(11) 98765-4321', donor_email: 'joao@email.com', post_id: 'post-002', status: 'approved', approved_by: 'farmaceutico', approved_at: new Date().toISOString(), created_at: new Date().toISOString(), photos: [] }
  ];

  const SEED_REQUESTS = [
    { id: 'req-001', medicine_id: 'med-006', medicine_name: 'Omeprazol 20mg', quantity: 1, requester_name: 'Ana Lima', requester_cpf: '123.456.789-00', requester_email: 'ana@email.com', post_id: 'post-001', method: 'presencial', status: 'active', reservation_code: 'ECO-001-2026', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 48 * 3600000).toISOString() }
  ];

  const SEED_PROFILE = { name: 'Usuário EcoMed', email: 'usuario@ecomed.com', eco_coins: 125, cadunico: false, cpf: '' };

  const SEED_TXS = [
    { id: 'tx-001', type: 'credit', amount: 25, description: 'Doação aprovada: Ibuprofeno', created_at: new Date().toISOString() },
    { id: 'tx-002', type: 'credit', amount: 40, description: 'Doação aprovada: Clonazepam 2mg', created_at: new Date().toISOString() },
    { id: 'tx-003', type: 'debit', amount: 20, description: 'Reserva: Ibuprofeno 600mg', created_at: new Date().toISOString() }
  ];

  /* ── Storage keys ─────────────────────────────────────── */
  const K = {
    medicines: 'ecomed_medicines',
    posts: 'ecomed_health_posts',
    donations: 'ecomed_donations',
    requests: 'ecomed_requests',
    profile: 'ecomed_user_profile',
    txs: 'ecomed_ecocoin_txs'
  };

  /* ── Helpers ──────────────────────────────────────────── */
  function _load(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  function _save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    try { window.dispatchEvent(new CustomEvent('ecomed:sync', { detail: { key } })); } catch {}
  }

  /* ── Public API ─────────────────────────────────────── */
  const medsDb = {

    init() {
      if (!_load(K.medicines)) _save(K.medicines, SEED_MEDICINES);
      if (!_load(K.posts))     _save(K.posts, SEED_POSTS);
      if (!_load(K.donations)) _save(K.donations, SEED_DONATIONS);
      if (!_load(K.requests))  _save(K.requests, SEED_REQUESTS);
      if (!_load(K.profile))   _save(K.profile, SEED_PROFILE);
      if (!_load(K.txs))       _save(K.txs, SEED_TXS);
    },

    /* Medicines */
    getMedicines() { return _load(K.medicines) || []; },
    getMedicineById(id) { return this.getMedicines().find(m => m.id === id) || null; },
    updateMedicineStock(id, delta) {
      const meds = this.getMedicines();
      const idx = meds.findIndex(m => m.id === id);
      if (idx < 0) return;
      meds[idx].stock = Math.max(0, (meds[idx].stock || 0) + delta);
      _save(K.medicines, meds);
    },

    /* Health posts */
    getHealthPosts() { return _load(K.posts) || []; },
    getHealthPostById(id) { return this.getHealthPosts().find(p => p.id === id) || null; },

    /* Donations */
    getDonations() { return _load(K.donations) || []; },
    createDonation(data) {
      const donations = this.getDonations();
      const item = Object.assign({ id: 'don-' + Date.now(), status: 'pending', created_at: new Date().toISOString(), photos: [] }, data);
      donations.push(item);
      _save(K.donations, donations);
      return item;
    },
    updateDonationStatus(id, status, reason) {
      const donations = this.getDonations();
      const idx = donations.findIndex(d => d.id === id);
      if (idx < 0) return;
      donations[idx].status = status;
      if (reason) donations[idx].reason = reason;
      if (status === 'approved') {
        donations[idx].approved_at = new Date().toISOString();
        // Update stock
        if (donations[idx].medicine_id) {
          this.updateMedicineStock(donations[idx].medicine_id, donations[idx].quantity || 1);
        }
        // Credit EcoCoins
        this.addTransaction({ id: 'tx-' + Date.now(), type: 'credit', amount: 30, description: 'Doação aprovada: ' + donations[idx].medicine, created_at: new Date().toISOString() });
      }
      _save(K.donations, donations);
    },

    /* Requests */
    getRequests() { return _load(K.requests) || []; },
    createRequest(data) {
      const requests = this.getRequests();
      const item = Object.assign({
        id: 'req-' + Date.now(),
        reservation_code: 'ECO-' + Math.floor(Math.random() * 900 + 100) + '-' + new Date().getFullYear(),
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 3600000).toISOString()
      }, data);
      requests.push(item);
      _save(K.requests, requests);
      return item;
    },

    /* Profile */
    getProfile() { return _load(K.profile) || SEED_PROFILE; },
    updateProfile(patch) {
      const profile = Object.assign(this.getProfile(), patch);
      _save(K.profile, profile);
      return profile;
    },

    /* EcoCoins transactions */
    getTransactions() { return _load(K.txs) || []; },
    addTransaction(tx) {
      const txs = this.getTransactions();
      txs.unshift(tx); // newest first
      _save(K.txs, txs);
      // Recalculate balance
      const balance = txs.reduce((sum, t) => t.type === 'credit' ? sum + t.amount : sum - t.amount, 0);
      const profile = this.getProfile();
      profile.eco_coins = Math.max(0, balance);
      _save(K.profile, profile);
      return tx;
    }
  };

  window.medsDb = medsDb;
  medsDb.init();
})();

