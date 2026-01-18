import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração usando process.env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

let app;
let auth: any = null;
let googleProvider: any = null;
let db: any = null;

// Inicialização Segura
try {
  // Verifica se a API Key existe e não é vazia antes de tentar inicializar
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
  } else {
    console.warn("⚠️ Firebase: Configuração ausente ou incompleta. O login não funcionará.");
  }
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase:", error);
  console.warn("A aplicação continuará em modo offline/sem login.");
}

export { auth, googleProvider, db };