import { auth, loginWithGoogle, logout, onAuthChange, saveUserData, loadUserData } from "./firebase.js";

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const app = document.getElementById('app');
const usernameSpan = document.getElementById('username');
const levelSpan = document.getElementById('level');
const pointsSpan = document.getElementById('points');
const addPointsBtn = document.getElementById('addPoints');

let currentUser = null;
let userData = { level: 1, points: 0 };

loginBtn.onclick = () => loginWithGoogle().catch(console.error);
logoutBtn.onclick = () => logout();

addPointsBtn.onclick = async () => {
  userData.points += 10;
  if (userData.points >= userData.level * 100) {
    userData.level++;
    userData.points = 0;
  }
  await saveUserData(currentUser.uid, userData);
  updateUI();
};

onAuthChange(async (user) => {
  if (user) {
    currentUser = user;
    usernameSpan.textContent = user.displayName;
    const loaded = await loadUserData(user.uid);
    if (loaded) userData = loaded;
    updateUI();
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    app.style.display = "block";
  } else {
    currentUser = null;
    app.style.display = "none";
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
  }
});

function updateUI() {
  levelSpan.textContent = userData.level;
  pointsSpan.textContent = userData.points;
  // script.js — логика UI + синхронизация с firebase.js
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout,
  onAuthChange,
  saveUserData,
  loadUserDataOnce,
  subscribeUserData
} from './firebase.js';

// ---------- helpers ----------
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const randInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

// ---------- DOM refs ----------
const signedOut = document.getElementById('signed-out');
const signedIn = document.getElementById('signed-in');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const googleBtn = document.getElementById('googleBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userNameEl = document.getElementById('user-name');
const userPhoto = document.getElementById('user-photo');

const levelEl = document.getElementById('level');
const xpEl = document.getElementById('xp');
const xpNextEl = document.getElementById('xpNext');
const xpFillEl = document.getElementById('xpFill');
const pointsEl = document.getElementById('points');

const recentEl = document.getElementById('recentAchievements');
const allAchEl = document.getElementById('allAchievements');
const toggleAllBtn = document.getElementById('toggleAllAchievements');

const missionForm = document.getElementById('missionForm');
const missionTitle = document.getElementById('missionTitle');
const missionReward = document.getElementById('missionReward');
const missionDesc = document.getElementById('missionDesc');
const missionsListEl = document.getElementById('missionsList');
const clearMissionsBtn = document.getElementById('clearMissions');

const achTitleInput = document.getElementById('achTitle');
const achDescInput = document.getElementById('achDesc');
const addAchievementBtn = document.getElementById('addAchievementBtn');

const shopNameInput = document.getElementById('shopName');
const shopCostInput = document.getElementById('shopCost');
const addShopBtn = document.getElementById('addShopBtn');
const shopListEl = document.getElementById('shopList');

const bgUrlInput = document.getElementById('bgUrl');
const mainColorInput = document.getElementById('mainColor');
const saveStyleBtn = document.getElementById('saveStyle');
const resetStyleBtn = document.getElementById('resetStyle');

// ---------- default user data ----------
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
  },
  profile: {}
};

let currentUid = null;
let unsubUser = null; // функция отписки от subscribeUserData
let userData = JSON.parse(JSON.stringify(DEFAULT));

// ---------- UI renderers ----------
function applyStyleFromState(){
  const s = userData.settings || DEFAULT.settings;
  document.documentElement.style.setProperty('--accent', s.mainColor || DEFAULT.settings.mainColor);
  if (s.bgUrl && s.bgUrl.trim()){
    document.documentElement.style.setProperty('--bg', `url("${s.bgUrl}") center/cover fixed, linear-gradient(180deg,#0d0d0d,#121212)`);
  } else {
    document.documentElement.style.setProperty('--bg', DEFAULT.settings.bgUrl ? `url("${DEFAULT.settings.bgUrl}") center/cover` : 'linear-gradient(180deg,#0d0d0d,#121212)');
  }
  bgUrlInput.value = s.bgUrl || '';
  mainColorInput.value = s.mainColor || DEFAULT.settings.mainColor;
}

function renderStats(){
  levelEl.textContent = userData.level;
  xpEl.textContent = userData.xp;
  xpNextEl.textContent = userData.xpToNext;
  pointsEl.textContent = userData.points;
  const pct = Math.min(100, userData.xp / userData.xpToNext * 100);
  xpFillEl.style.width = pct + '%';
}

function renderAchievements(){
  recentEl.innerHTML = '';
  allAchEl.innerHTML = '';
  const arr = (userData.achievements || []).slice().reverse();
  arr.slice(0,3).forEach(a => {
    const li = document.createElement('li');
    li.textContent = a.title + (a.desc ? ' — ' + a.desc : '');
    const del = document.createElement('button'); del.className='btn ghost small'; del.textContent='Удалить';
    del.onclick = () => { removeAchievement(a.id); };
    li.appendChild(del);
    recentEl.appendChild(li);
  });
  arr.forEach(a => {
    const li = document.createElement('li');
    li.textContent = a.title + (a.desc ? ' — ' + a.desc : '');
    const edit = document.createElement('button'); edit.className='btn ghost small'; edit.textContent='Ред.';
    edit.onclick = ()=> editAchievementPrompt(a.id);
    const del = document.createElement('button'); del.className='btn ghost small'; del.textContent='Удалить';
    del.onclick = ()=> removeAchievement(a.id);
    li.appendChild(edit); li.appendChild(del);
    allAchEl.appendChild(li);
  });
}

function renderMissions(){
  missionsListEl.innerHTML = '';
  if (!userData.missions || userData.missions.length === 0){
    const p = document.createElement('p'); p.style.opacity='.8'; p.textContent='Пока нет миссий — добавь первую.';
    missionsListEl.appendChild(p); return;
  }
  userData.missions.forEach(m => {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.innerHTML = `<div class="mission-title">${m.title}</div><div class="mission-desc">${m.desc || ''}</div>`;
    const right = document.createElement('div');
    right.style.display='flex'; right.style.flexDirection='column'; right.style.alignItems='flex-end';
    const reward = document.createElement('div'); reward.textContent = `${m.reward} XP`;
    const actions = document.createElement('div'); actions.style.marginTop='8px';
    const done = document.createElement('button'); done.className='btn small'; done.textContent='Выполнить';
    done.onclick = ()=> completeMission(m.id);
    const edit = document.createElement('button'); edit.className='btn ghost small'; edit.textContent='Ред.';
    edit.onclick = ()=> editMissionPrompt(m.id);
    const del = document.createElement('button'); del.className='btn ghost small'; del.textContent='Удалить';
    del.onclick = ()=> removeMission(m.id);
    actions.appendChild(done); actions.appendChild(edit); actions.appendChild(del);
    right.appendChild(reward); right.appendChild(actions);
    li.appendChild(left); li.appendChild(right);
    missionsListEl.appendChild(li);
  });
}

function renderShop(){
  shopListEl.innerHTML = '';
  if (!userData.shop || userData.shop.length === 0){
    const p = document.createElement('p'); p.style.opacity='.7'; p.textContent='Магазин пуст.'; shopListEl.appendChild(p); return;
  }
  userData.shop.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `<div style="display:flex;flex-direction:column"><strong>${s.name}</strong><small>${s.cost} очков</small></div>`;
    const edit = document.createElement('button'); edit.className='btn ghost small'; edit.textContent='Ред.';
    edit.onclick = ()=> editShopPrompt(s.id);
    const del = document.createElement('button'); del.className='btn ghost small'; del.textContent='Удалить';
    del.onclick = ()=> removeShopItem(s.id);
    const buy = document.createElement('button'); buy.className='btn small'; buy.textContent='Купить';
    buy.onclick = ()=> buyItem(s.id);
    li.appendChild(edit); li.appendChild(del); li.appendChild(buy);
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

// ---------- CRUD ----------
// Achievements
function addAchievementObj(title, desc){
  const a = { id: uid(), title, desc: desc||'', createdAt: Date.now() };
  userData.achievements.push(a);
  pushSave();
}
function removeAchievement(id){
  userData.achievements = userData.achievements.filter(x=>x.id!==id);
  pushSave();
}
function editAchievementPrompt(id){
  const it = userData.achievements.find(x=>x.id===id);
  if(!it) return;
  const newTitle = prompt('Новое название:', it.title);
  if (newTitle === null) return;
  const newDesc = prompt('Новое описание:', it.desc||'');
  it.title = newTitle.trim();
  it.desc = newDesc===null?it.desc:newDesc.trim();
  pushSave();
}

// Missions
function addMissionObj(title, reward, desc){
  const m = { id: uid(), title, reward: Number(reward)||0, desc: desc||'', createdAt: Date.now() };
  userData.missions.push(m);
  pushSave();
}
function removeMission(id){
  userData.missions = userData.missions.filter(x=>x.id!==id);
  pushSave();
}
function editMissionPrompt(id){
  const m = userData.missions.find(x=>x.id===id);
  if(!m) return;
  const t = prompt('Название миссии:', m.title);
  if (t===null) return;
  const r = prompt('XP за миссию:', String(m.reward));
  if (r===null) return;
  const d = prompt('Описание:', m.desc||'');
  m.title = t.trim(); m.reward = Number(r)||0; m.desc = d===null?m.desc:d.trim();
  pushSave();
}
function completeMission(id){
  const m = userData.missions.find(x=>x.id===id);
  if(!m) return;
  userData.xp += Number(m.reward || 0);
  // add achievement
  userData.achievements.push({ id: uid(), title: `Выполнил: ${m.title}`, desc:'', createdAt: Date.now() });
  // remove mission
  userData.missions = userData.missions.filter(x=>x.id!==id);
  // level up loop
  while (userData.xp >= userData.xpToNext){
    userData.xp -= userData.xpToNext;
    userData.level += 1;
    const got = randInt(1,10);
    userData.points += got;
    userData.achievements.push({ id: uid(), title: `Повышен до ${userData.level} (+${got} очков)`, desc:'', createdAt: Date.now() });
    userData.xpToNext = Math.floor(userData.xpToNext * 2);
  }
  pushSave();
}

// Shop
function addShopItemObj(name, cost){
  userData.shop.push({ id: uid(), name, cost: Number(cost)||0, createdAt: Date.now() });
  pushSave();
}
function removeShopItem(id){
  userData.shop = userData.shop.filter(x=>x.id!==id);
  pushSave();
}
function editShopPrompt(id){
  const s = userData.shop.find(x=>x.id===id);
  if(!s) return;
  const n = prompt('Название:', s.name);
  if (n===null) return;
  const c = prompt('Цена (очки):', String(s.cost));
  if (c===null) return;
  s.name = n.trim(); s.cost = Number(c)||0;
  pushSave();
}
function buyItem(id){
  const s = userData.shop.find(x=>x.id===id);
  if(!s) return;
  if (userData.points < s.cost) { alert('Недостаточно очков'); return; }
  userData.points -= s.cost;
  userData.achievements.push({ id: uid(), title: `Куплен: ${s.name}`, desc:'', createdAt: Date.now() });
  pushSave();
}

// ---------- save / sync ----------
function pushSave(){
  // push local state to Firebase (if logged in)
  if (currentUid){
    // save profile fields we might update
    saveUserDataToServer();
  } else {
    // if not logged in, just keep in memory/local storage
    renderAll();
  }
}

let saving = false;
async function saveUserDataToServer(){
  if (!currentUid) return;
  try{
    saving = true;
    await saveToServer(currentUid, userData);
  } catch(e){
    console.error('save error', e);
  } finally {
    saving = false;
  }
}

import { saveUserData as _saveUserData } from './firebase.js';
async function saveToServer(uid, data){
  await _saveUserData(uid, data);
}

// ---------- UI prompts & events ----------
missionForm.addEventListener('submit', e=>{
  e.preventDefault();
  const title = missionTitle.value.trim();
  const reward = Number(missionReward.value);
  const desc = missionDesc.value.trim();
  if(!title || isNaN(reward)){ alert('Введите название и количество XP'); return; }
  addMissionObj(title, reward, desc);
  missionForm.reset();
});

clearMissionsBtn.addEventListener('click', ()=>{
  if (!confirm('Удалить все миссии?')) return;
  userData.missions = []; pushSave();
});

addAchievementBtn.addEventListener('click', ()=>{
  const t = achTitleInput.value.trim(); const d = achDescInput.value.trim();
  if (!t){ alert('Введите название'); return; }
  addAchievementObj(t,d); achTitleInput.value=''; achDescInput.value='';
});

addShopBtn.addEventListener('click', ()=>{
  const n = shopNameInput.value.trim(); const c = Number(shopCostInput.value);
  if (!n || isNaN(c)){ alert('Введите название и цену'); return; }
  addShopItemObj(n,c); shopNameInput.value=''; shopCostInput.value='';
});

toggleAllBtn.addEventListener('click', ()=> allAchEl.classList.toggle('hidden'));

saveStyleBtn.addEventListener('click', ()=>{
  userData.settings.bgUrl = bgUrlInput.value.trim();
  userData.settings.mainColor = mainColorInput.value;
  pushSave();
  alert('Стиль сохранён');
});
resetStyleBtn.addEventListener('click', ()=>{
  userData.settings = JSON.parse(JSON.stringify(DEFAULT.settings));
  pushSave();
});

// ---------- Auth UI handlers ----------
registerBtn.addEventListener('click', async ()=>{
  try{
    await registerWithEmail(emailInput.value.trim(), passwordInput.value);
    alert('Зарегистрировано — теперь войдите');
  } catch(e){
    console.error(e); alert('Ошибка регистрации: ' + (e.message || e));
  }
});

loginBtn.addEventListener('click', async ()=>{
  try{
    await loginWithEmail(emailInput.value.trim(), passwordInput.value);
  } catch(e){
    console.error(e); alert('Ошибка входа: ' + (e.message || e));
  }
});

googleBtn.addEventListener('click', async ()=>{
  try{
    await loginWithGoogle();
  } catch(e){
    console.error(e); alert('Ошибка Google входа: ' + (e.message || e));
  }
});

logoutBtn.addEventListener('click', async ()=>{
  try{
    await logout();
  } catch(e){ console.error(e); }
});

// ---------- onAuthChange: load/subscribe user data ----------
onAuthChange(async (user)=>{
  if (user){
    currentUid = user.uid;
    // UI: signed in
    signedOut.style.display = 'none';
    signedIn.style.display = 'flex';
    userNameEl.textContent = user.displayName || user.email;
    if (user.photoURL) { userPhoto.src = user.photoURL; userPhoto.style.display='inline-block'; } else userPhoto.style.display='none';

    // load once
    const remote = await loadUserDataOnce(user.uid);
    if (remote){
      // merge remote over defaults
      userData = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), remote);
    } else {
      // new account: set defaults plus profile
      userData = JSON.parse(JSON.stringify(DEFAULT));
      userData.profile = { name: user.displayName || user.email, email: user.email };
      await saveToServer(user.uid, userData);
    }

    // subscribe for real-time updates (so other device edits show here)
    if (unsubUser) { unsubUser(); unsubUser = null; }
    unsubUser = subscribeUserData(user.uid, (data)=>{
      if (!data) return;
      // if a save is in progress locally skip override? we'll just accept remote — it's source of truth
      userData = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), data);
      renderAll();
    });

    renderAll();
  } else {
    // signed out
    currentUid = null;
    if (unsubUser){ unsubUser(); unsubUser = null; }
    signedOut.style.display = 'flex';
    signedIn.style.display = 'none';
    userNameEl.textContent = '';
    userPhoto.src = '';
    // reset to defaults (but keep UI)
    userData = JSON.parse(JSON.stringify(DEFAULT));
    renderAll();
  }
});

// initial render
renderAll();

}

