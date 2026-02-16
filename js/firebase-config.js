// ================================================================
//  Firebase 설정
//  Firebase Console에서 프로젝트 생성 후 아래 값을 교체하세요.
//  https://console.firebase.google.com/
// ================================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA7xtSAUCjZrVM2bRlacqy42h8cAKNsA2I",
  authDomain: "lightningcare-a38c4.firebaseapp.com",
  projectId: "lightningcare-a38c4",
  storageBucket: "lightningcare-a38c4.firebasestorage.app",
  messagingSenderId: "141324111155",
  appId: "1:141324111155:web:896765e38a5254f7cf4246"
};

// Firebase 초기화
let _db = null;
let _firebaseReady = false;

function initFirebase() {
  try {
    if (typeof firebase === 'undefined') { _firebaseReady = false; return; }
    firebase.initializeApp(FIREBASE_CONFIG);
    _db = firebase.firestore();
    _firebaseReady = true;
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
    _firebaseReady = false;
  }
}

function isFirebaseReady() {
  return _firebaseReady && _db !== null;
}

initFirebase();
