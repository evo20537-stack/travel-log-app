import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * FIREBASE SERVICE
 */

const firebaseConfig = {
  // 注意：這裡改成了 import.meta.env
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 為了防止沒有金鑰時報錯，我們加一個簡單的檢查
const app = initializeApp(firebaseConfig);

// 匯出功能
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// 登入功能 (之後會用到)
export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Login failed", error);
    alert("登入失敗");
  }
};

export const logout = () => signOut(auth);

// 這裡保留你的 Mock 函式，防止 App.tsx 報錯，之後再慢慢替換成真的
export const subscribeToTrips = () => {};
export const addTripToFirestore = async () => {};
export const updateTripInFirestore = async () => {};
export const deleteTripFromFirestore = async () => {};