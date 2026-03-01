import { getApp, getApps, initializeApp } from 'firebase/app'
import { browserLocalPersistence, connectAuthEmulator, getAuth, GoogleAuthProvider, setPersistence } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

const missingKeys = requiredKeys.filter((key) => !import.meta.env[key])
if (missingKeys.length) {
  console.warn(`Missing Firebase env vars: ${missingKeys.join(', ')}`)
}

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
export const provider = new GoogleAuthProvider()

if (import.meta.env.DEV && !globalThis.__PAWS2HELP_EMULATORS_CONNECTED__) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  globalThis.__PAWS2HELP_EMULATORS_CONNECTED__ = true
}

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Failed to enable local auth persistence:', error)
})
