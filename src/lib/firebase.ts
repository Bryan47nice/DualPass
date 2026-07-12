/**
 * Firebase 初始化：env 有設定就啟用（Auth + Firestore 離線持久化），
 * 沒設定則整個 app 以「本機模式」運作（zustand persist → localStorage）。
 */
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
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

function isMobileOrStandalone(): boolean {
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  return standalone || mobile
}

/**
 * 桌面用 popup（體驗好、不離開頁面）；手機/PWA 用 redirect（popup 會被擋）。
 * redirect 的結果在 completeRedirectSignIn() 於 app 載入時取回。
 */
export async function signIn(): Promise<User | null> {
  if (!auth) return null
  const provider = new GoogleAuthProvider()
  if (isMobileOrStandalone()) {
    await signInWithRedirect(auth, provider)
    return null // 會整頁跳轉，不會走到這
  }
  const result = await signInWithPopup(auth, provider)
  return result.user
}

/** app 載入時呼叫：完成 redirect 登入流程（若剛從 Google 跳轉回來） */
export async function completeRedirectSignIn(): Promise<void> {
  if (!auth) return
  try {
    await getRedirectResult(auth)
  } catch (err) {
    console.error('[auth] redirect result error', err)
    throw err
  }
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
