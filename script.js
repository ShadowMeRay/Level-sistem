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
}

