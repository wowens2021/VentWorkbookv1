import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Values come from .env (gitignored) / the hosting platform's env vars —
// see .env.example for the required keys. Never hardcode real project
// values here even though a Firebase web config isn't a secret; keeping it
// in env vars means dev/staging/prod can point at different projects.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
// ProgressRecord has many optional fields; a partial update naturally
// produces objects with `undefined` values for absent ones. Firestore
// rejects those by default — ignoreUndefinedProperties strips them instead
// of throwing, so the progress-sync layer doesn't need to hand-filter
// every write.
export const db = initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
export const googleProvider = new GoogleAuthProvider();
