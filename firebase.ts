import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD7nWF3q7wh4Zy33qGlJHVcHTyO-5C6OOc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "break-loop-eafcb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "break-loop-eafcb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "break-loop-eafcb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "657887970700",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:657887970700:web:90eff9061fa1c26aa582a9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
