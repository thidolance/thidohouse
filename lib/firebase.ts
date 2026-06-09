import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase web keys são públicas por design — segurança vem das Firestore Rules
const firebaseConfig = {
  apiKey: "AIzaSyAaaVEw45S5C1w_ozj5dUNsh0jpd8JOtiw",
  authDomain: "thidohouse.firebaseapp.com",
  projectId: "thidohouse",
  storageBucket: "thidohouse.firebasestorage.app",
  messagingSenderId: "142881278385",
  appId: "1:142881278385:web:5d7f3974ccfaec54ca9590",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
