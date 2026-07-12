/**
 * Firebase 初始化：env 有設定就啟用（Auth + Firestore 離線持久化），
 * 沒設定則整個 app 以「本機模式」運作（zustand persist → localStorage）。
 */
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type Auth,
  type User,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  type Firestore,
} from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const firebaseEnabled: boolean = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (firebaseEnabled) {
  app = initializeApp(config as Required<typeof config>)
  auth = getAuth(app)
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager(undefined),
    }),
  })
}

export function getDb(): Firestore | null {
  return db
}

export async function signIn(): Promise<User | null> {
  if (!auth) return null
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
  return result.user
}

export async function signOut(): Promise<void> {
  if (auth) await fbSignOut(auth)
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(auth, cb)
}
