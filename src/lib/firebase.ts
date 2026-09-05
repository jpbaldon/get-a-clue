import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { getFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function firebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.databaseURL);
}

export function isIpHostname(hostname = ''): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

export function describeFirebaseError(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : '';
  const message = err instanceof Error ? err.message : 'Something went wrong.';
  if (code === 'auth/unauthorized-domain' || /unauthorized.domain/i.test(message)) {
    return 'Firebase Auth does not allow this address. Sign-in will not work on a 192.168.x.x URL. Use localhost on this computer, or a named host such as a Vercel URL after you add it under Authentication → Settings → Authorized domains.';
  }
  if (/permission_denied|permission denied/i.test(message)) {
    return 'Permission denied. If you are joining a room, refresh and try again. Hosts must be signed in with Google.';
  }
  return message;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let rtdb: Database | null = null;

function getApp(): FirebaseApp {
  if (!firebaseConfigured()) {
    throw new Error('Firebase is not configured. Copy .env.example to .env.local.');
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getApp());
  return auth;
}

export function getFs(): Firestore {
  if (!db) db = getFirestore(getApp());
  return db;
}

export function getRtdb(): Database {
  if (!rtdb) rtdb = getDatabase(getApp());
  return rtdb;
}
