// === Firebase ===
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
  update
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// === Config ===
const firebaseConfig = {
  apiKey: "AIzaSyDW4SQaVKDmU8kgQ1xO1IlCwKfMoACCLVY",
  authDomain: "level-sistem.firebaseapp.com",
  databaseURL: "https://level-sistem-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "level-sistem",
  storageBucket: "level-sistem.firebasestorage.app",
  messagingSenderId: "417407528186",
  appId: "1:417407528186:web:4e8d3f55fe3cf8871ced43"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// === UI Elements ===
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");
const googleBtn = document.getElementById("google-login");
const logoutBtn = document.getElementById("logout");

// === Игровые данные ===
let userData = {
  xp: 0,
  level: 1,
  missions: [],
  achievements: [],
  shopItems: [],
  points: 0
};

// === Auth ===
registerBtn.onclick = () => {
  createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(user => {
      saveData(user.user.uid, userData);
    })
    .catch(console.error);
};

loginBtn.onclick = () => {
  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .catch(console.error);
};

googleBtn.onclick = () => {
  signInWithPopup(auth, provider)
    .then(result => {
      const user = result.user;
      loadData(user.uid);
    })
    .catch(console.error);
};

logoutBtn.onclick = () => {
  signOut(auth);
};

// === Слежка за входом ===
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadData(user.uid);
    document.body.classList.add("logged");
  } else {
    document.body.classList.remove("logged");
  }
});

// === Работа с данными ===
function saveData(uid, data) {
  set(ref(db, "users/" + uid), data);
}

function loadData(uid) {
  get(ref(db, "users/" + uid)).then(snapshot => {
    if (snapshot.exists()) {
      userData = snapshot.val();
      updateUI();
    } else {
      saveData(uid, userData);
    }
  });
}

// === Пример обновления опыта ===
function addXP(amount) {
  userData.xp += amount;

  let nextLevelXP = 100 * Math.pow(2, userData.level - 1);
  if (userData.xp >= nextLevelXP) {
    userData.xp -= nextLevelXP;
    userData.level++;
    userData.points += Math.floor(Math.random() * 10) + 1;
  }

  if (auth.currentUser) saveData(auth.currentUser.uid, userData);
  updateUI();
}

// === Пример обновления интерфейса ===
function updateUI() {
  document.getElementById("level").textContent = `Уровень: ${userData.level}`;
  document.getElementById("xp").textContent = `Опыт: ${userData.xp}`;
  document.getElementById("points").textContent = `Очки: ${userData.points}`;
}
