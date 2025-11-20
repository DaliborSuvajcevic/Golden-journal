// Inicijalizacija
let trades = JSON.parse(localStorage.getItem('trades')) || [];

// Sačuvaj trgovinu
function saveTrade() {
  const trade = {
    id: Date.now(),
    pair: pair.value,
    direction: direction.value,
    entryPrice: parseFloat(entryPrice.value),
    tp: parseFloat(tp.value),
    sl: parseFloat(sl.value),
    lotSize: parseFloat(lotSize.value),
    riskPercent: parseFloat(riskPercent.value),
    result: result.value,
    notes: notes.value,
    createdAt: new Date().toISOString()
  };

  // Računanje pipsa i R:R
  if (trade.entryPrice && trade.tp && trade.sl) {
    const pipFactor = 10000;
    const risk = Math.abs(trade.entryPrice - trade.sl) * pipFactor;
    const reward = Math.abs(trade.entryPrice - trade.tp) * pipFactor;
    trade.rr = risk > 0 ? reward / risk : 0;

    if (trade.direction === 'Buy') {
      trade.profitPips = trade.result === 'Win'
        ? (trade.tp - trade.entryPrice) * pipFactor
        : (trade.entryPrice - trade.sl) * pipFactor;
    } else {
      trade.profitPips = trade.result === 'Win'
        ? (trade.entryPrice - trade.tp) * pipFactor
        : (trade.sl - trade.entryPrice) * pipFactor;
    }
  }

  trades.unshift(trade);
  localStorage.setItem('trades', JSON.stringify(trades));
  renderTrades();
  resetForm();
  alert('Trgovina uspešno sačuvana!');
}

// Prikaz trgovina
function renderTrades() {
  const container = document.getElementById('tradesList');
  container.innerHTML = '';

  trades.forEach(trade => {
    const item = document.createElement('div');
    item.className = 'trade-item';
    item.onclick = () => showTradeDetails(trade.id);

    const date = new Date(trade.createdAt).toLocaleDateString();
    const resultClass = trade.result === 'Win' ? 'win' : 'loss';

    item.innerHTML = `
      <div class="trade-header">
        <div class="trade-pair">${trade.pair}</div>
        <div class="trade-result ${resultClass}">${trade.result}</div>
      </div>
      <div class="trade-details">
        <span>${date}</span>
        <span>${trade.profitPips?.toFixed(1) || 'N/A'} pips</span>
      </div>
    `;
    container.appendChild(item);
  });
}

// Detalji trgovine
function showTradeDetails(id) {
  const trade = trades.find(t => t.id === id);
  if (!trade) return;

  const content = document.getElementById('tradeDetailsContent');
  content.dataset.tradeId = trade.id;
  content.innerHTML = `
    <div class="detail-row"><span class="detail-label">Par:</span><span class="detail-value">${trade.pair}</span></div>
    <div class="detail-row"><span class="detail-label">Smer:</span><span class="detail-value">${trade.direction}</span></div>
    <div class="detail-row"><span class="detail-label">Entry:</span><span class="detail-value">${trade.entryPrice}</span></div>
    <div class="detail-row"><span class="detail-label">TP:</span><span class="detail-value">${trade.tp}</span></div>
    <div class="detail-row"><span class="detail-label">SL:</span><span class="detail-value">${trade.sl}</span></div>
    <div class="detail-row"><span class="detail-label">Lot:</span><span class="detail-value">${trade.lotSize}</span></div>
    <div class="detail-row"><span class="detail-label">Risk %:</span><span class="detail-value">${trade.riskPercent}%</span></div>
    <div class="detail-row"><span class="detail-label">Rezultat:</span><span class="detail-value ${trade.result === 'Win' ? 'win' : 'loss'}">${trade.result}</span></div>
    <div class="detail-row"><span class="detail-label">Profit/Loss:</span><span class="detail-value">${trade.profitPips?.toFixed(1) || 'N/A'} pips</span></div>
    <div class="detail-row"><span class="detail-label">R:R:</span><span class="detail-value">${trade.rr?.toFixed(2) || 'N/A'}</span></div>
    <div class="detail-row"><span class="detail-label">Datum:</span><span class="detail-value">${new Date(trade.createdAt).toLocaleString()}</span></div>
    <div class="detail-row"><span class="detail-label">Beleške:</span><span class="detail-value">${trade.notes || 'Bez beleški'}</span></div>
  `;
  document.getElementById('tradeDetailsModal').style.display = 'flex';
}

// Statistika
function showStats() {
  const total = trades.length;
  const wins = trades.filter(t => t.result === 'Win').length;
  const winRate = total ? ((wins / total) * 100).toFixed(1) : '0.0';
  const avgRR = total ? (trades.reduce((s, t) => s + (t.rr || 0), 0) / total).toFixed(2) : '0.00';
  const biggestWin = Math.max(...trades.map(t => t.profitPips || 0));

  totalTrades.textContent = total;
  winRate.textContent = winRate + '%';
  avgRR.textContent = avgRR;
  biggestWin.textContent = biggestWin.toFixed(1);
  statsModal.style.display = 'flex';
}

// Resetovanje
function confirmReset() {
  confirmModal.style.display = 'flex';
}

function resetJournal() {
  trades = [];
  localStorage.removeItem('trades');
  renderTrades();
  closeModal('confirmModal');
  alert('Dnevnik je resetovan!');
}

// Brisanje trgovine
function deleteTrade() {
  const id = parseInt(tradeDetailsContent.dataset.tradeId);
  trades = trades.filter(t => t.id !== id);
  localStorage.setItem('trades', JSON.stringify(trades));
  renderTrades();
  closeModal('tradeDetailsModal');
  alert('Trgovina obrisana!');
}

// Placeholder za izmenu
function editTrade() {
  alert('Funkcija za izmenu biće dodata u sledećoj verziji.');
  closeModal('tradeDetailsModal');
}

// Zatvaranje modala
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Povratak na početak sajta
function scrollToTop() {
  document.getElementById("top").scrollIntoView({ behavior: "smooth" });
}

function closeAndReturnHome(modalId) {
  closeModal(modalId);
  scrollToTop();
}

// Reset forme
function resetForm() {
  document.querySelectorAll('#journal input, #journal select, #journal textarea')
    .forEach(el => el.value = '');
}

// Klik van modala
window.onclick = function(event) {
  document.querySelectorAll('.modal').forEach(modal => {
    if (event.target === modal) modal.style.display = 'none';
  });
};

// Prikaz pri učitavanju
renderTrades();

// Povratak na početni ekran (npr. index.html)
function returnToHome() {
  window.location.href = 'Web.html'; // ili '/' ako koristiš root kao početni ekran
}