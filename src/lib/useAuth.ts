import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { firebaseEnabled, watchAuth } from './firebase'
import { loadFromCloud, startSync, stopSync } from './sync'

export function useAuth(): { user: User | null; ready: boolean; localMode: boolean } {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!firebaseEnabled)

  useEffect(() => {
    if (!firebaseEnabled) return
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

  return { user, ready, localMode: !firebaseEnabled }
}
