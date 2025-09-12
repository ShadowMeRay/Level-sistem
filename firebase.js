// Инициализация Firebase и авторизация
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app);

export function loginWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  onAuthStateChanged(auth, callback);
}

export async function saveUserData(uid, data) {
  await set(ref(db, 'users/' + uid), data);
}

export async function loadUserData(uid) {
  const snapshot = await get(child(ref(db), 'users/' + uid));
  if (snapshot.exists()) return snapshot.val();
  else return null;
  // firebase.js
// Инициализация Firebase + обёртки для auth и realtime DB
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
  off
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ====== Вставь сюда свой firebaseConfig (я уже использовал твой) ======
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
const googleProvider = new GoogleAuthProvider();

// === Auth functions ===
export function registerWithEmail(email, password){
  return createUserWithEmailAndPassword(auth, email, password);
}

export function loginWithEmail(email, password){
  return signInWithEmailAndPassword(auth, email, password);
}

export function loginWithGoogle(){
  return signInWithPopup(auth, googleProvider);
}

export function logout(){
  return signOut(auth);
}

export function onAuthChange(callback){
  return onAuthStateChanged(auth, callback);
}

// === DB functions ===
// whole user data stored at /users/{uid}/data
export async function saveUserData(uid, data){
  await set(ref(db, `users/${uid}/data`), data);
}

export async function loadUserDataOnce(uid){
  const snap = await get(ref(db, `users/${uid}/data`));
  return snap.exists() ? snap.val() : null;
}

export function subscribeUserData(uid, onUpdate){
  const r = ref(db, `users/${uid}/data`);
  const handler = (snap) => {
    onUpdate(snap.exists() ? snap.val() : null);
  };
  onValue(r, handler);
  return () => off(r); // отписка от всех слушателей на этом ref
}

}
