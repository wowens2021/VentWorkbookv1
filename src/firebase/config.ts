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

// Whether the VITE_FIREBASE_* env vars were present at BUILD time. On a
// static host (Vercel) these are inlined by Vite when the site is built —
// so if they weren't set for that build, they're empty here. When missing,
// we deliberately do NOT call initializeApp (which would throw at import and
// crash the whole app to a blank page); App.tsx checks this flag and shows a
// readable configuration-error screen instead.
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

/** Names of any required Firebase env vars that are missing — for the
 *  config-error screen's diagnostics. */
export const missingFirebaseKeys: string[] = [
  ['VITE_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['VITE_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['VITE_FIREBASE_APP_ID', firebaseConfig.appId],
  ['VITE_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['VITE_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
  ['VITE_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
].filter(([, v]) => !v).map(([k]) => k as string);

export const firebaseApp = firebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = firebaseConfigured ? getAuth(firebaseApp!) : (null as any);
// ProgressRecord has many optional fields; a partial update naturally
// produces objects with `undefined` values for absent ones. Firestore
// rejects those by default — ignoreUndefinedProperties strips them instead
// of throwing, so the progress-sync layer doesn't need to hand-filter
// every write.
export const db = firebaseConfigured
  ? initializeFirestore(firebaseApp!, { ignoreUndefinedProperties: true })
  : (null as any);
export const googleProvider = firebaseConfigured ? new GoogleAuthProvider() : (null as any);
