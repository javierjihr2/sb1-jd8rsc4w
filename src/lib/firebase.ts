// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "teamup-pubg-mobile",
  appId: "1:196165116166:web:d4e2579ee4d48ac3d7be87",
  storageBucket: "teamup-pubg-mobile.firebasestorage.app",
  apiKey: "AIzaSyDE07kbLcbk0He5LA84_qLcCxqeQGseI6w",
  authDomain: "teamup-pubg-mobile.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "196165116166"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
