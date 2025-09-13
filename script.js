// script.js (modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

/* ========== INSERT YOUR FIREBASE CONFIG BELOW ========== */
const firebaseConfig = {
  apiKey: "AIzaSyDW4SQaVKDmU8kgQ1xO1IlCwKfMoACCLVY",
  authDomain: "level-sistem.firebaseapp.com",
  databaseURL: "https://level-sistem-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "level-sistem",
  storageBucket: "level-sistem.firebasestorage.app",
  messagingSenderId: "417407528186",
  appId: "1:417407528186:web:4e8d3f55fe3cf8871ced43"
};
/* ======================================================= */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// DOM refs
const signedOutDiv = document.getElementById('signed-out');
const signedInDiv = document.getElementById('signed-in');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const googleBtn = document.getElementById('googleBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userNameEl = document.getElementById('userName');
const userPhotoEl = document.getElementById('userPhoto');
const logoImg = document.getElementById('logoImg');

const levelEl = document.getElementById('level');
const xpEl = document.getElementById('xp');
const xpNextEl = document.getElementById('xpNext');
const xpFillEl = document.getElementById('xpFill');
const coinsEl = document.getElementById('coins');

const missionForm = document.getElementById('missionForm');
const missionTitle = document.getElementById('missionTitle');
const missionXP = document.getElementById('missionXP');
const missionImg = document.getElementById('missionImg');
const missionDesc = document.getElementById('missionDesc');
const missionsList = document.getElementById('missionsList');
const clearMissionsBtn = document.getElementById('clearMissions');

const addShopBtn = document.getElementById('addShopBtn');
const shopName = document.getElementById('shopName');
const shopCost = document.getElementById('shopCost');
const shopImg = document.getElementById('shopImg');
const shopList = document.getElementById('shopList');

const achTitle = document.getElementById('achTitle');
const achDesc = document.getElementById('achDesc');
const addAchievementBtn = document.getElementById('addAchievementBtn');
const recentAchEl = document.getElementById('recentAchievements');
const allAchEl = document.getElementById('allAchievements');
const toggleAllAchievementsBtn = document.getElementById('toggleAllAchievements');

const gearBtn = document.getElementById('gearBtn');
const settingsDrawer = document.getElementById('settingsDrawer');
const bgUrlInput = document.getElementById('bgUrl');
const logoUrlInput = document.getElementById('logoUrl');
const saveStyleBtn = document.getElementById('saveStyle');
const resetStyleBtn = document.getElementById('resetStyle');
const resetProgressBtn = document.getElementById('resetProgress');

let currentUid = null;
let dbUnsub = null;

// Default state template
const DEFAULT = {
  level: 1,
  xp: 0,
  xpToNext: 100,
  coins: 0,
  missions: [],
  achievements: [],
  shop: [],
  settings: {
    bgUrl: '',
    logoUrl: ''
  },
  profile: {}
};

// Local copy of user data (will be synced with DB)
let state = JSON.parse(JSON.stringify(DEFAULT));

// Helpers
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const randInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

function xpNeededForLevel(level) {
  // 100 for level1, then *2 each level
  return 100 * (2 ** (level - 1));
}

// UI render
function renderAll(){
  // stats
  levelEl.textContent = state.level;
  xpEl.textContent = state.xp;
  xpNextEl.textContent = state.xpToNext;
  coinsEl.textContent = state.coins;
  xpFillEl.style.width = Math.min(100, Math.round(state.xp / state.xpToNext * 100)) + '%';

  // logo / background
  if (state.settings && state.settings.logoUrl) {
    logoImg.src = state.settings.logoUrl;
    logoImg.style.display = 'block';
  } else {
    logoImg.style.display = 'none';
  }
  if (state.settings && state.settings.bgUrl) {
    document.documentElement.style.setProperty('--bg', `url("${state.settings.bgUrl}") center/cover`);
    document.body.style.background = `url("${state.settings.bgUrl}") center/cover`;
  } else {
    document.body.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  }

  // recent achievements
  recentAchEl.innerHTML = '';
  const achArr = (state.achievements || []).slice().reverse();
  achArr.slice(0,3).forEach(a => {
    const li = document.createElement('li');
    li.textContent = a.title + (a.desc ? ' — ' + a.desc : '');
    recentAchEl.appendChild(li);
  });
  // all achievements
  allAchEl.innerHTML = '';
  achArr.forEach(a => {
    const li = document.createElement('li');
    li.textContent = a.title + (a.desc ? ' — ' + a.desc : '');
    const del = document.createElement('button'); del.className='btn ghost small'; del.textContent='Удалить';
    del.onclick = () => { removeAchievement(a.id); };
    const edit = document.createElement('button'); edit.className='btn ghost small'; edit.textContent='Ред.'; 
    edit.onclick = () => editAchievementPrompt(a.id);
    li.appendChild(edit); li.appendChild(del);
    allAchEl.appendChild(li);
  });

  // missions
  missionsList.innerHTML = '';
  (state.missions || []).forEach((m, idx) => {
    if (m.completed) return; // skip already completed/failed
    const li = document.createElement('li');
    const thumb = (m.img) ? `<img src="${m.img}" class="mission-thumb" alt="thumb">` : '';
    li.innerHTML = `
      <div class="mission-row">
        <div>
          <div class="mission-title">${m.title}</div>
          <div class="mission-desc">${m.desc||''}</div>
          ${thumb}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <div>${m.reward} XP</div>
          <div style="display:flex;gap:6px">
            <button class="btn small" data-act="complete" data-id="${m.id}">✅</button>
            <button class="btn small ghost" data-act="fail" data-id="${m.id}">❌</button>
          </div>
        </div>
      </div>
    `;
    missionsList.appendChild(li);
  });

  // shop
  shopList.innerHTML = '';
  (state.shop || []).forEach(s => {
    const li = document.createElement('li');
    const thumb = (s.img) ? `<img src="${s.img}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;margin-right:8px">` : '';
    li.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        ${thumb}
        <div><strong>${s.name}</strong><div style="font-size:13px;color:rgba(255,255,255,0.7)">${s.cost} монет</div></div>
      </div>
    `;
    const buy = document.createElement('button'); buy.className='btn small'; buy.textContent='Купить';
    buy.onclick = () => buyItem(s.id);
    const edit = document.createElement('button'); edit.className='btn ghost small'; edit.textContent='Ред.'; edit.onclick = ()=> editShopPrompt(s.id);
    const del = document.createElement('button'); del.className='btn ghost small'; del.textContent='Удалить'; del.onclick = ()=> removeShopItem(s.id);
    li.appendChild(edit); li.appendChild(del); li.appendChild(buy);
    shopList.appendChild(li);
  });
}

// =========== CRUD actions ===========

// Achievements
function addAchievementObj(title, desc){
  const obj = { id: uid(), title, desc: desc||'', createdAt: Date.now() };
  state.achievements.push(obj);
  pushSave();
}
function removeAchievement(id){
  state.achievements = state.achievements.filter(x=>x.id!==id);
  pushSave();
}
function editAchievementPrompt(id){
  const it = state.achievements.find(x=>x.id===id); if(!it) return;
  const t = prompt('Новое название:', it.title); if (t===null) return;
  const d = prompt('Новое описание:', it.desc||''); if (d===null) return;
  it.title = t.trim(); it.desc = d.trim();
  pushSave();
}

// Missions
function addMissionObj(title, reward, desc, img){
  const m = { id: uid(), title, reward: Number(reward)||0, desc: desc||'', img: img||'', createdAt: Date.now(), completed: false, completedAt: null };
  state.missions.push(m);
  pushSave();
}
function markMissionCompleted(id){
  const m = state.missions.find(x=>x.id===id); if(!m) return;
  m.completed = true; m.completedAt = Date.now();
  // reward xp & coins
  state.xp += Number(m.reward || 0);
  state.coins += 10; // +10 монет за каждую миссию
  // achievements
  state.achievements.push({ id: uid(), title: `Выполнил: ${m.title}`, desc: '', createdAt: Date.now() });
  // level up loop
  while (state.xp >= state.xpToNext){
    state.xp -= state.xpToNext;
    state.level += 1;
    const gained = randInt(1,10);
    state.coins += gained;
    state.achievements.push({ id: uid(), title: `Повышение до уровня ${state.level} (+${gained} монет)`, desc: '', createdAt: Date.now() });
    state.xpToNext = state.xpToNext * 2;
  }
  pushSave();
}
function failMission(id){
  const m = state.missions.find(x=>x.id===id); if(!m) return;
  m.completed = true; m.completedAt = Date.now();
  state.achievements.push({ id: uid(), title: `Провалил: ${m.title}`, desc:'', createdAt: Date.now() });
  pushSave();
}
function removeMission(id){
  state.missions = state.missions.filter(x=>x.id!==id);
  pushSave();
}
function editMissionPrompt(id){
  const m = state.missions.find(x=>x.id===id); if(!m) return;
  const t = prompt('Название:', m.title); if (t===null) return;
  const r = prompt('XP:', String(m.reward)); if (r===null) return;
  const d = prompt('Описание:', m.desc||''); if (d===null) return;
  const img = prompt('URL картинки (оставь пустым для удаления):', m.img||'');
  m.title = t.trim(); m.reward = Number(r)||0; m.desc = d.trim(); m.img = img ? img.trim() : '';
  pushSave();
}

// Shop
function addShopItemObj(name, cost, img){
  const s = { id: uid(), name, cost: Number(cost)||0, img: img||'', createdAt: Date.now() };
  state.shop.push(s);
  pushSave();
}
function removeShopItem(id){
  state.shop = state.shop.filter(x=>x.id!==id);
  pushSave();
}
function editShopPrompt(id){
  const s = state.shop.find(x=>x.id===id); if(!s) return;
  const n = prompt('Название:', s.name); if (n===null) return;
  const c = prompt('Цена (монеты):', String(s.cost)); if (c===null) return;
  const img = prompt('URL картинки (оставь пустым для удаления):', s.img||'');
  s.name = n.trim(); s.cost = Number(c)||0; s.img = img ? img.trim() : '';
  pushSave();
}
function buyItem(id){
  const s = state.shop.find(x=>x.id===id); if(!s) return;
  if (state.coins < s.cost){ alert('Недостаточно монет'); return; }
  state.coins -= s.cost;
  state.achievements.push({ id: uid(), title: `Куплен: ${s.name}`, desc:'', createdAt: Date.now() });
  pushSave();
}

// =========== Save / Sync with Firebase ===========

function userDataPath(uid){ return `users/${uid}/data`; }

async function pushSave(){
  // push local state to server
  if (!currentUid) {
    renderAll(); // still update UI
    return;
  }
  try {
    await set(ref(db, userDataPath(currentUid)), state);
  } catch (e) {
    console.error('Save failed', e);
  }
}

function subscribeToUser(uid){
  // unsubscribe previous
  if (dbUnsub) dbUnsub();
  const r = ref(db, userDataPath(uid));
  const handler = onValue(r, snap => {
    if (snap.exists()) {
      const remote = snap.val();
      // merge remote into local state (remote is source of truth)
      state = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), remote);
      renderAll();
    } else {
      // no data yet — push defaults
      set(r, state).catch(e=>console.error(e));
    }
  });
  // return unsubscribe function
  dbUnsub = () => handler(); // onValue returns unsubscribe in new SDK? handler is callback; to keep simple, not used
}

// =========== UI handlers binding ===========

document.addEventListener('click', (e) => {
  const act = e.target.dataset.act;
  const id = e.target.dataset.id;
  if (act === 'complete' && id) markMissionCompleted(id);
  if (act === 'fail' && id) failMission(id);
});

missionForm.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const title = missionTitle.value.trim();
  const reward = Number(missionXP.value);
  const desc = missionDesc.value.trim();
  const img = missionImg.value.trim();
  if (!title || isNaN(reward)){ alert('Введите название и число XP'); return; }
  addMissionObj(title, reward, desc, img);
  missionForm.reset();
});

clearMissionsBtn.addEventListener('click', ()=> {
  if (!confirm('Удалить все активные миссии?')) return;
  state.missions = state.missions.filter(m => m.completed);
  pushSave();
});

addShopBtn.addEventListener('click', ()=>{
  const n = shopName.value.trim(); const c = Number(shopCost.value); const img = shopImg.value.trim();
  if (!n || isNaN(c)) { alert('Введите название и цену'); return; }
  addShopItemObj(n, c, img);
  shopName.value=''; shopCost.value=''; shopImg.value='';
});

addAchievementBtn.addEventListener('click', ()=>{
  const t = achTitle.value.trim(); const d = achDesc.value.trim();
  if (!t) { alert('Введите название'); return; }
  addAchievementObj(t,d); achTitle.value=''; achDesc.value='';
});

toggleAllAchievementsBtn.addEventListener('click', ()=>{
  allAchEl.classList.toggle('hidden');
});

// Settings drawer
gearBtn.addEventListener('click', ()=> settingsDrawer.classList.toggle('open'));
saveStyleBtn.addEventListener('click', ()=>{
  state.settings.bgUrl = bgUrlInput.value.trim();
  state.settings.logoUrl = logoUrlInput.value.trim();
  pushSave();
  alert('Сохранено');
});
resetStyleBtn.addEventListener('click', ()=>{
  state.settings = Object.assign({}, DEFAULT.settings);
  pushSave();
  alert('Сброшено');
});

// reset progress with double confirmation + code
resetProgressBtn.addEventListener('click', ()=>{
  if (!confirm('Вы уверены? Это удалит уровень и монеты.')) return;
  const code = prompt('Введите RESET чтобы подтвердить:');
  if (code === 'RESET'){
    state.level = 1; state.xp = 0; state.xpToNext = 100; state.coins = 0;
    // keep achievements? we will keep them; if you want to clear achievements, do additional reset
    pushSave();
    alert('Прогресс сброшен');
  } else {
    alert('Код неверен, отмена');
  }
});

// =========== Auth handlers ===========

registerBtn.addEventListener('click', async ()=>{
  try {
    const email = emailInput.value.trim();
    const pass = passwordInput.value;
    if (!email || !pass) { alert('Введите email и пароль'); return; }
    await createUserWithEmailAndPassword(auth, email, pass);
    alert('Зарегистрировано — войдите');
  } catch(e){ console.error(e); alert('Ошибка регистрации: ' + (e.message || e)); }
});

loginBtn.addEventListener('click', async ()=>{
  try {
    const email = emailInput.value.trim();
    const pass = passwordInput.value;
    if (!email || !pass) { alert('Введите email и пароль'); return; }
    await signInWithEmailAndPassword(auth, email, pass);
  } catch(e){ console.error(e); alert('Ошибка входа: ' + (e.message || e)); }
});

googleBtn.addEventListener('click', async ()=>{
  try {
    await signInWithPopup(auth, googleProvider);
  } catch(e){ console.error(e); alert('Google вход: ' + (e.message || e)); }
});

logoutBtn.addEventListener('click', async ()=>{
  try { await signOut(auth); } catch(e){ console.error(e); }
});

// observe auth state
onAuthStateChanged(auth, async (u) => {
  if (u) {
    // set UI
    signedOutDiv.style.display = 'none';
    signedInDiv.style.display = 'flex';
    userNameEl.textContent = u.displayName || u.email;
    if (u.photoURL) { userPhotoEl.src = u.photoURL; userPhotoEl.style.display='inline-block'; } else userPhotoEl.style.display='none';

    currentUid = u.uid;
    // subscribe to user data in DB
    subscribeToUser(currentUid);
  } else {
    // signed out
    signedOutDiv.style.display = 'flex';
    signedInDiv.style.display = 'none';
    userNameEl.textContent = '';
    userPhotoEl.src = '';
    currentUid = null;
    // reset local state (keep UI)
    state = JSON.parse(JSON.stringify(DEFAULT));
    renderAll();
    if (dbUnsub){ dbUnsub(); dbUnsub = null; }
  }
});

// initial render
renderAll();



