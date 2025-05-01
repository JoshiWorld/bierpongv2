import { initializeApp } from "firebase/app";
import { getMessaging, getToken, type Messaging, onMessage } from "firebase/messaging";
import { type Analytics, getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics: Analytics | undefined;
let messaging: Messaging | undefined;

if(typeof window !== "undefined") {
  messaging = getMessaging(app);
  analytics = getAnalytics(app);
}

export { 
  messaging, 
  analytics, 
  getToken, 
  onMessage };
