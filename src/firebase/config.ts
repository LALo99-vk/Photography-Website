import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyBKtpTtUoyggUVbqwfp-q1uzdlC9sh-Ls8",
  authDomain: "photography-web-1f156.firebaseapp.com",
  projectId: "photography-web-1f156",
  storageBucket: "photography-web-1f156.firebasestorage.app",
  messagingSenderId: "555188726893",
  appId: "1:555188726893:web:f041ce0557f66ff51da364",
  measurementId: "G-N1C33DYFLP"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;