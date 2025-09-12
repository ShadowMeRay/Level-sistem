// script.js — логика с localStorage, миссии, ачивки, магазин, кастомизация

// ---------- Helpers ----------
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const randInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

// ---------- Default data ----------
const DEFAULT = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  points: 0,
  missions: [],
  achievements: [],
  shop: [],
  settings: {
    bgUrl: '',
    mainColor: '#00f7ff'
  }
};

const STORAGE_KEY = 'level_system_v1';

// ---------- Load / Save ----------
function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { return JSON.parse(JSON.stringify(DEFAULT)); }
    const parsed = JSON.parse(raw);
    // ensure fields exist
    return Object.assign(JSON.parse(JSON.stringify(DEFAULT)), parsed);
  } catch(e){
    console.error('loadData error', e);
    return JSON.parse(JSON.stringify(DEFAULT));
  }
}

function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------- State ----------
let state = loadData();

// ---------- UI refs ----------
const el = id => document.getElementById(id);

const levelEl = el('level');
const xpEl = el('xp');
const xpNextEl = el('xpNext');
const xpFillEl = el('xpFill');
const pointsEl = el('points');

const recentEl = el('recentAchievements');
const allAchEl = el('allAchievements');

const missionsListEl = el('missionsList');

const shopListEl = el('shopList');

// Custom inputs
const bgUrlInput = el('bgUrl');
const mainColorInput = el('mainColor');

// form inputs
const missionForm = el('missionForm');
const missionTitle = el('missionTitle');
const missionReward = el('missionReward');
const missionDesc = el('missionDesc');

const addAchievementBtn = el('addAchievementBtn');
const achTitleInput = el('achTitle');
const achDescInput = el('achDesc');

const addShopBtn = el('addShopBtn');
const shopNameInput = el('shopName');
const shopCostInput = el('shopCost');

const toggleAllBtn = el('toggleAllAchievements');
const allAchievementsEl = allAchEl;

// ---------- Render ----------
function applyStyleFromState(){
  const s = state.settings;
  document.documentElement.style.setProperty('--accent', s.mainColor || DEFAULT.settings.mainColor);
  if (s.bgUrl && s.bgUrl.trim()){
    document.documentElement.style.setProperty('--bg', `url("${s.bgUrl}") center/cover fixed, linear-gradient(180deg,#0d0d0d,#121212)`);
  } else {
    document.documentElement.style.setProperty('--bg', DEFAULT.settings.bgUrl ? `url("${DEFAULT.settings.bgUrl}") center/cover` : 'linear-gradient(180deg,#0d0d0d,#121212)');
  }
  // update inputs
  bgUrlInput.value = s.bgUrl || '';
  mainColorInput.value = s.mainColor || DEFAULT.settings.mainColor;
}

function renderStats(){
  levelEl.textContent = state.level;
  xpEl.textContent = state.xp;
  xpNextEl.textContent = state.xpToNext;
  pointsEl.textContent = state.points;
  const pct = Math.min(100, state.xp / state.xpToNext * 100);
  xpFillEl.style.width = pct + '%';
}

function renderAchievements(){
  // recent (last 3)
  recentEl.innerHTML = '';
  const arr = state.achievements.slice().reverse();
  arr.slice(0,3).forEach(a => {
    const li = document.createElement('li');
    li.textContent = a.title + (a.desc ? ' — ' + a.desc : '');
    // add delete button
    const del = document.createElement('button');
    del.className = 'btn ghost small';
    del.textContent = 'Удалить';
    del.onclick = () => { removeAchievement(a.id); };
    li.appendChild(del);
    recentEl.appendChild(li);
  });
  // all
  allAchEl.innerHTML = '';
  arr.forEach(a => {
    const li = document.createElement('li');
    li.textContent = a.title + (a.desc ? ' — ' + a.desc : '');
    const del = document.createElement('button');
    del.className = 'btn ghost small';
    del.textContent = 'Удалить';
    del.onclick = () => { removeAchievement(a.id); };
    const edit = document.createElement('button');
    edit.className = 'btn ghost small';
    edit.textContent = 'Редактировать';
    edit.onclick = () => editAchievementPrompt(a.id);
    li.appendChild(edit);
    li.appendChild(del);
    allAchEl.appendChild(li);
  });
}

function renderMissions(){
  missionsListEl.innerHTML = '';
  if (state.missions.length === 0){
    const info = document.createElement('p');
    info.style.opacity = '0.8';
    info.textContent = 'Пока нет миссий — добавь первую.';
    missionsListEl.appendChild(info);
    return;
  }
  state.missions.forEach(m => {
    const li = document.createElement('li');
    const titleRow = document.createElement('div');
    titleRow.className = 'mission-row';
    const left = document.createElement('div');
    left.innerHTML = `<div class="mission-title">${m.title}</div><div class="mission-desc">${m.desc || ''}</div>`;
    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.flexDirection = 'column';
    right.style.alignItems = 'flex-end';
    const reward = document.createElement('div');
    reward.textContent = `${m.reward} XP`;
    const actions = document.createElement('div');
    actions.style.marginTop = '8px';
    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn small';
    doneBtn.textContent = 'Выполнить';
    doneBtn.onclick = () => completeMission(m.id);
    const editBtn = document.createElement('button');
    editBtn.className = 'btn ghost small';
    editBtn.textContent = 'Ред.';
    editBtn.onclick = () => editMissionPrompt(m.id);
    const delBtn = document.createElement('button');
    delBtn.className = 'btn ghost small';
    delBtn.textContent = 'Удалить';
    delBtn.onclick = () => { removeMission(m.id); };
    actions.appendChild(doneBtn); actions.appendChild(editBtn); actions.appendChild(delBtn);
    right.appendChild(reward); right.appendChild(actions);
    titleRow.appendChild(left); titleRow.appendChild(right);
    li.appendChild(titleRow);
    missionsListEl.appendChild(li);
  });
}

function renderShop(){
  shopListEl.innerHTML = '';
  if (state.shop.length === 0){
    const info = document.createElement('p'); info.style.opacity = '.7'; info.textContent='Магазин пуст.';
    shopListEl.appendChild(info); return;
  }
  state.shop.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `<div style="display:flex;flex-direction:column"><strong>${s.name}</strong><small>${s.cost} очков</small></div>`;
    const buyBtn = document.createElement('button');
    buyBtn.className = 'btn small';
    buyBtn.textContent = 'Купить';
    buyBtn.onclick = () => buyItem(s.id);
    const edit = document.createElement('button');
    edit.className = 'btn ghost small';
    edit.textContent = 'Ред.';
    edit.onclick = () => editShopPrompt(s.id);
    const del = document.createElement('button');
    del.className = 'btn ghost small';
    del.textContent = 'Удалить';
    del.onclick = () => removeShopItem(s.id);
    li.appendChild(edit); li.appendChild(del); li.appendChild(buyBtn);
    shopListEl.appendChild(li);
  });
}

function renderAll(){
  applyStyleFromState();
  renderStats();
  renderAchievements();
  renderMissions();
  renderShop();
}

// ---------- CRUD operations ----------

// Achievements
function addAchievement(title, desc){
  const a = { id: uid(), title, desc: desc||'', createdAt: Date.now() };
  state.achievements.push(a);
  saveData(); renderAll();
}
function removeAchievement(id){
  state.achievements = state.achievements.filter(x=>x.id!==id);
  saveData(); renderAll();
}
function editAchievementPrompt(id){
  const it = state.achievements.find(x=>x.id===id);
  if(!it) return;
  const newTitle = prompt('Новое название:', it.title);
  if (newTitle === null) return;
  const newDesc = prompt('Новое описание:', it.desc||'');
  it.title = newTitle.trim();
  it.desc = newDesc === null ? it.desc : newDesc.trim();
  saveData(); renderAll();
}

// Missions
function addMissionObj(title, reward, desc){
  const m = { id: uid(), title, reward: Number(reward)||0, desc: desc||'', createdAt: Date.now() };
  state.missions.push(m);
  saveData(); renderAll();
}
function removeMission(id){
  state.missions = state.missions.filter(m=>m.id!==id);
  saveData(); renderAll();
}
function editMissionPrompt(id){
  const m = state.missions.find(x=>x.id===id);
  if(!m) return;
  const t = prompt('Название миссии:', m.title);
  if (t===null) return;
  const r = prompt('XP за миссию:', String(m.reward));
  if (r===null) return;
  const d = prompt('Описание:', m.desc||'');
  m.title = t.trim(); m.reward = Number(r)||0; m.desc = d===null ? m.desc : d.trim();
  saveData(); renderAll();
}
function completeMission(id){
  const m = state.missions.find(x=>x.id===id);
  if (!m) return;
  // add xp
  state.xp += Number(m.reward || 0);
  // create achievement
  state.achievements.push({ id: uid(), title: `Выполнил: ${m.title}`, desc: '', createdAt: Date.now() });
  // remove mission
  removeMission(id);
  // level up loop
  while (state.xp >= state.xpToNext){
    state.xp -= state.xpToNext;
    state.level += 1;
    const gained = randInt(1,10);
    state.points += gained;
    // record level achievement
    state.achievements.push({ id: uid(), title: `Повышение до уровня ${state.level} (+${gained} очков)`, desc:'', createdAt: Date.now() });
    // double required xp
    state.xpToNext = state.xpToNext * 2;
  }
  saveData(); renderAll();
}

// Shop
function addShopItemObj(name, cost){
  state.shop.push({ id: uid(), name, cost: Number(cost)||0, createdAt: Date.now() });
  saveData(); renderAll();
}
function removeShopItem(id){
  state.shop = state.shop.filter(x=>x.id!==id);
  saveData(); renderAll();
}
function editShopPrompt(id){
  const s = state.shop.find(x=>x.id===id);
  if(!s) return;
  const n = prompt('Название предмета:', s.name);
  if (n===null) return;
  const c = prompt('Цена (очки):', String(s.cost));
  if (c===null) return;
  s.name = n.trim(); s.cost = Number(c)||0;
  saveData(); renderAll();
}
function buyItem(id){
  const s = state.shop.find(x=>x.id===id);
  if(!s) return;
  if (state.points < s.cost) { alert('Недостаточно очков'); return; }
  state.points -= s.cost;
  state.achievements.push({ id: uid(), title: `Куплен: ${s.name}`, desc: '', createdAt: Date.now() });
  saveData(); renderAll();
}

// ---------- UI prompts & handlers ----------
missionForm.addEventListener('submit', e=>{
  e.preventDefault();
  const title = missionTitle.value.trim();
  const reward = Number(missionReward.value);
  const desc = missionDesc.value.trim();
  if(!title || isNaN(reward)) { alert('Введите корректные название и XP'); return; }
  addMissionObj(title, reward, desc);
  missionForm.reset();
});

el('clearMissions').addEventListener('click', ()=> {
  if (!confirm('Удалить все миссии?')) return;
  state.missions = []; saveData(); renderAll();
});

addAchievementBtn.addEventListener('click', ()=> {
  const t = achTitleInput.value.trim();
  const d = achDescInput.value.trim();
  if (!t) { alert('Введите название'); return; }
  addAchievement(t,d);
  achTitleInput.value=''; achDescInput.value='';
});

el('saveStyle').addEventListener('click', ()=> {
  state.settings.bgUrl = bgUrlInput.value.trim();
  state.settings.mainColor = mainColorInput.value;
  saveData(); applyStyleFromState(); alert('Стиль сохранён');
});
el('resetStyle').addEventListener('click', ()=> {
  state.settings = JSON.parse(JSON.stringify(DEFAULT.settings));
  saveData(); applyStyleFromState(); renderAll();
});

el('addShopBtn').addEventListener('click', ()=> {
  const n = shopNameInput.value.trim(); const c = Number(shopCostInput.value);
  if(!n || isNaN(c)){ alert('Введите название и цену'); return; }
  addShopItemObj(n,c);
  shopNameInput.value=''; shopCostInput.value='';
});

toggleAllBtn.addEventListener('click', ()=> {
  allAchievementsEl.classList.toggle('hidden');
});

// ---------- init ----------
renderAll();
