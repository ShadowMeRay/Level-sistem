// --- Импорт Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// --- Настройки твоего проекта Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyDW4SQaVKDmU8kgQ1xO1IlCwKfMoACCLVY",
  authDomain: "level-sistem.firebaseapp.com",
  databaseURL: "https://level-sistem-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "level-sistem",
  storageBucket: "level-sistem.firebasestorage.app",
  messagingSenderId: "417407528186",
  appId: "1:417407528186:web:4e8d3f55fe3cf8871ced43"
};

// --- Инициализация Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- Элементы интерфейса ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const userPhoto = document.getElementById('user-photo');

// --- Авторизация ---
loginBtn.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
  }
});

// --- Выход ---
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
  }
});

// --- Отслеживание состояния пользователя ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    userName.textContent = user.displayName;
    userPhoto.src = user.photoURL;
    userInfo.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    loginBtn.style.display = 'none';
  } else {
    userInfo.style.display = 'none';
    logoutBtn.style.display = 'none';
    loginBtn.style.display = 'inline-block';
  }
});
