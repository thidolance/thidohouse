import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

// Firebase web keys são públicas por design — segurança vem das Firestore Rules
const firebaseConfig = {
  apiKey: "AIzaSyAaaVEw45S5C1w_ozj5dUNsh0jpd8JOtiw",
  authDomain: "thidohouse.firebaseapp.com",
  projectId: "thidohouse",
  storageBucket: "thidohouse.firebasestorage.app",
  messagingSenderId: "142881278385",
  appId: "1:142881278385:web:5d7f3974ccfaec54ca9590",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// No navegador usa cache persistente (IndexedDB) com suporte a múltiplas abas:
// leituras repetidas são servidas do disco local e só o delta vai à rede — o que
// deixa troca de aba e refoco instantâneos. No server (SSR/prerender) não existe
// IndexedDB, então cai no getFirestore padrão (cache em memória).
function initDb(): Firestore {
  if (typeof window === 'undefined') return getFirestore(app);
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // initializeFirestore só pode rodar uma vez por app; em HMR/reimport cai aqui.
    return getFirestore(app);
  }
}

export const db = initDb();
