// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTYzI4VIIegvvkosB_vIHKmZABq-EfkBk",
  authDomain: "studybro-mobile-project.firebaseapp.com",
  projectId: "studybro-mobile-project",
  storageBucket: "studybro-mobile-project.firebasestorage.app",
  messagingSenderId: "659667223336",
  appId: "1:659667223336:web:ba25c4788cc0b27d4bc61d",
  measurementId: "G-YX12N8CHDP",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
if (getApps().length > 0) {
  try {
    auth = getAuth(app);
  } catch (e) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  }
}

export { auth };
export const db = getFirestore(app);
