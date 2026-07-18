  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getAuth, signInAnonymously, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateDoc, onSnapshot, runTransaction, deleteField }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
  const firebaseConfig = {
    apiKey: "AIzaSyAjKGFK8pAuO5ughXRAZXKbpriSQ-bcLKA",
    authDomain: "fwf1-3b522.firebaseapp.com",
    projectId: "fwf1-3b522",
    storageBucket: "fwf1-3b522.firebasestorage.app",
    messagingSenderId: "67996577619",
    appId: "1:67996577619:web:7395c5cf151585a1353ba6"
  };
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  window._fb = { auth, db, signInAnonymously, signOut, onAuthStateChanged, 
    doc, getDoc, setDoc, collection, getDocs, updateDoc, onSnapshot, runTransaction, deleteField };
  window.dispatchEvent(new Event("firebase-ready"));
