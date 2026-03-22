const EMOJIS = [
  '🍣','🍱','🐟','🐠','🦐','🦑','🐙','🦀',
  '🍙','🍘','🥢','🥟','🍥','🌊','🐡','🦞',
  '🍚','🥑','🥒','🔥','⭐','💎','🏆','🎯',
  '🐳','🦈','🍃','🌸','🎌','🗾','🍶','🥠'
];

const STORAGE_TYPES = 'sfondometro_types';
const STORAGE_COUNTS = 'sfondometro_counts';

const DEFAULT_TYPES = [
  { id: 'nigiri', name: 'Nigiri', emoji: '🍣' },
  { id: 'sashimi', name: 'Sashimi', emoji: '🐟' },
  { id: 'uramaki', name: 'Uramaki', emoji: '🍘' },
  { id: 'temaki', name: 'Temaki', emoji: '🥢' },
  { id: 'gunkan', name: 'Gunkan', emoji: '🦐' },
];

let types = [];
let counts = {};
let selectedDate = todayStr();
let selectedEmoji = null;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDate(str) {
  const [y,m,d] = str.split('-');
  const months = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  const days = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
  const date = new Date(+y, +m-1, +d);
  const dayName = days[date.getDay()];
  return `${dayName} ${+d} ${months[+m-1]}`;
}

function load() {
  const savedTypes = localStorage.getItem(STORAGE_TYPES);
  types = savedTypes ? JSON.parse(savedTypes) : [...DEFAULT_TYPES];
  if (!savedTypes) saveTypes();

  const savedCounts = localStorage.getItem(STORAGE_COUNTS);
  counts = savedCounts ? JSON.parse(savedCounts) : {};
}

function saveTypes() { localStorage.setItem(STORAGE_TYPES, JSON.stringify(types)); }
function saveCounts() { localStorage.setItem(STORAGE_COUNTS, JSON.stringify(counts)); }

function getCount(date, typeId) {
  return (counts[date] && counts[date][typeId]) || 0;
}

function setCount(date, typeId, val) {
  if (!counts[date]) counts[date] = {};
  counts[date][typeId] = Math.max(0, val);
  if (counts[date][typeId] === 0) delete counts[date][typeId];
  if (Object.keys(counts[date]).length === 0) delete counts[date];
  saveCounts();
}

function getDayTotal(date) {
  if (!counts[date]) return 0;
  return Object.values(counts[date]).reduce((a,b) => a+b, 0);
}

function changeDate(dir) {
  const [y,m,d] = selectedDate.split('-').map(Number);
  const date = new Date(y, m-1, d + dir);
  const newStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  if (newStr > todayStr()) return;
  selectedDate = newStr;
  render();
}

function render() {
  document.getElementById('current-date').textContent =
    selectedDate === todayStr() ? '📅 Oggi' : formatDate(selectedDate);

  const total = getDayTotal(selectedDate);
  const totalEl = document.getElementById('today-total');
  totalEl.textContent = total;

  const grid = document.getElementById('sushi-grid');
  grid.innerHTML = '';

  types.forEach(t => {
    const c = getCount(selectedDate, t.id);
    const card = document.createElement('div');
    card.className = 'sushi-card';
    card.innerHTML = `
      <button class="minus-btn ${c > 0 ? 'visible' : ''}" onclick="event.stopPropagation();modCount('${t.id}',-1)">−</button>
      <button class="delete-type ${c === 0 ? 'visible' : ''}" onclick="event.stopPropagation();deleteType('${t.id}')">✕</button>
      <div class="tap-flash"></div>
      <span class="emoji">${t.emoji}</span>
      <div class="name">${t.name}</div>
      <div class="card-count" id="count-${t.id}">${c}</div>
    `;
    card.addEventListener('click', () => {
      modCount(t.id, 1);
      const flash = card.querySelector('.tap-flash');
      flash.classList.remove('active');
      void flash.offsetWidth;
      flash.classList.add('active');
    });
    grid.appendChild(card);
  });

  // Add button
  const add = document.createElement('div');
  add.className = 'add-card';
  add.onclick = openModal;
  add.innerHTML = '<div class="plus-icon">＋</div><span>Aggiungi</span>';
  grid.appendChild(add);
}

function modCount(typeId, delta) {
  const current = getCount(selectedDate, typeId);
  setCount(selectedDate, typeId, current + delta);

  const newVal = getCount(selectedDate, typeId);
  const el = document.getElementById(`count-${typeId}`);
  el.textContent = newVal;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');

  // Update minus btn and delete btn visibility
  const card = el.closest('.sushi-card');
  const minusBtn = card.querySelector('.minus-btn');
  const deleteBtn = card.querySelector('.delete-type');
  if (newVal > 0) {
    minusBtn.classList.add('visible');
    deleteBtn.classList.remove('visible');
  } else {
    minusBtn.classList.remove('visible');
    deleteBtn.classList.add('visible');
  }

  document.getElementById('today-total').textContent = getDayTotal(selectedDate);
}

function deleteType(id) {
  if (!confirm('Vuoi rimuovere questo tipo di sushi?')) return;
  types = types.filter(t => t.id !== id);
  saveTypes();
  render();
}

// MODAL
function openModal() {
  selectedEmoji = null;
  document.getElementById('input-name').value = '';
  document.getElementById('btn-add').disabled = true;
  renderEmojiGrid();
  document.getElementById('modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('input-name').focus(), 300);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function renderEmojiGrid() {
  const grid = document.getElementById('emoji-grid');
  grid.innerHTML = '';
  EMOJIS.forEach(em => {
    const btn = document.createElement('button');
    btn.className = 'emoji-option';
    btn.textContent = em;
    btn.onclick = () => selectEmoji(em, btn);
    grid.appendChild(btn);
  });
}

function selectEmoji(em, btn) {
  document.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedEmoji = em;
  checkAddBtn();
}

document.getElementById('input-name').addEventListener('input', checkAddBtn);

function checkAddBtn() {
  const name = document.getElementById('input-name').value.trim();
  document.getElementById('btn-add').disabled = !(name && selectedEmoji);
}

function addType() {
  const name = document.getElementById('input-name').value.trim();
  if (!name || !selectedEmoji) return;
  const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
  types.push({ id, name, emoji: selectedEmoji });
  saveTypes();
  closeModal();
  render();
}

// TABS
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${tab}`).classList.add('active');
  if (tab === 'history') renderHistory();
}

function renderHistory() {
  const list = document.getElementById('history-list');
  const dates = Object.keys(counts).sort().reverse();

  if (dates.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-emoji">🍽️</div><p>Nessun dato ancora.<br>Inizia a contare i tuoi sushi!</p></div>';
    return;
  }

  list.innerHTML = '';
  dates.forEach(date => {
    const dayData = counts[date];
    const total = Object.values(dayData).reduce((a,b) => a+b, 0);
    const div = document.createElement('div');
    div.className = 'history-day';

    let items = '';
    Object.entries(dayData).forEach(([typeId, count]) => {
      const type = types.find(t => t.id === typeId);
      const emoji = type ? type.emoji : '🍣';
      const name = type ? type.name : typeId;
      items += `<div class="day-item">${emoji} ${name} <span class="item-count">×${count}</span></div>`;
    });

    div.innerHTML = `
      <div class="day-header">
        <div class="day-date">${formatDate(date)}</div>
        <div class="day-total">${total} pezzi</div>
      </div>
      <div class="day-items">${items}</div>
    `;
    list.appendChild(div);
  });

  const resetBtn = document.createElement('button');
  resetBtn.className = 'reset-btn';
  resetBtn.textContent = 'Cancella tutto lo storico';
  resetBtn.onclick = () => {
    if (confirm('Sei sicuro di voler cancellare tutto lo storico?')) {
      counts = {};
      saveCounts();
      renderHistory();
      render();
    }
  };
  list.appendChild(resetBtn);
}

// INIT
load();
render();