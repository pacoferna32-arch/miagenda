import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const isNewApp = !getApps().length;
const app = isNewApp ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

function initDb(): Firestore {
  try {
    if (isNewApp) {
      return initializeFirestore(
        app,
        { ignoreUndefinedProperties: true },
        firebaseConfig.firestoreDatabaseId
      );
    }
  } catch {
    // Fallback if already initialized
  }
  return getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = initDb();

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

// Recursively remove undefined fields so Firestore setDoc never throws on undefined values
export function cleanFirestoreData<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        result[k] = cleanFirestoreData(v);
      }
    }
    return result as T;
  }
  return value;
}

// Test connection on boot
if (typeof window !== 'undefined') {
  getDocFromServer(doc(db, 'test', 'connection')).catch((err) => {
    if (err instanceof Error && err.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  });
}

// Error handling as required by Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error:', JSON.stringify(errInfo));
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
};
export type { User };
