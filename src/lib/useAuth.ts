import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { completeRedirectSignIn, firebaseEnabled, watchAuth } from './firebase'
import { loadFromCloud, startSync, stopSync } from './sync'

export function useAuth(): {
  user: User | null
  ready: boolean
  localMode: boolean
  authError: string | null
} {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!firebaseEnabled)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseEnabled) return
    // 若剛從 Google redirect 回來，先完成登入流程
    completeRedirectSignIn().catch((err) => {
      setAuthError(describeAuthError(err))
    })
    const unsub = watchAuth((u) => {
      setUser(u)
      setReady(true)
      if (u) {
        void loadFromCloud(u.uid).then(() => startSync(u.uid))
      } else {
        stopSync()
      }
    })
    return () => {
      unsub()
      stopSync()
    }
  }, [])

  return { user, ready, localMode: !firebaseEnabled, authError }
}

export function describeAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/unauthorized-domain':
      return '這個網域尚未加入 Firebase 授權清單，請到 Authentication → Settings → Authorized domains 新增。'
    case 'auth/popup-blocked':
      return '登入彈窗被瀏覽器擋住了，請允許彈出視窗後再試一次。'
    case 'auth/popup-closed-by-user':
      return '登入視窗被關閉，尚未完成登入。'
    case 'auth/operation-not-allowed':
      return 'Firebase 尚未啟用 Google 登入，請到 Authentication → Sign-in method 開啟。'
    case 'auth/network-request-failed':
      return '網路連線失敗，請確認網路後再試。'
    default:
      return `登入失敗${code ? `（${code}）` : ''}，請再試一次。`
  }
}
