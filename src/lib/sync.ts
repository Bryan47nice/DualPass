/**
 * Firestore 雲端同步（登入後啟用）。
 * 策略：登入時雲端有資料 → 蓋掉本機；之後 store 變更 debounce 寫回雲端。
 * 單人單裝置為主，不做複雜合併。
 */
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { getDb } from './firebase'
import { useSrsStore } from '@/stores/srsStore'
import { useQuestStore } from '@/stores/questStore'
import { useUiStore } from '@/stores/uiStore'
import { deserializeCard, serializeCard } from './srs'
import type { DeckId, SrsCardState } from '@/types'

const DECKS: DeckId[] = ['toeic-vocab', 'n4-vocab', 'n4-grammar', 'mistakes']
const WRITE_DEBOUNCE_MS = 30_000

let unsubs: Array<() => void> = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let dirty = false
let currentUid: string | null = null

export async function loadFromCloud(uid: string): Promise<void> {
  const db = getDb()
  if (!db) return

  // profile（settings + quest streak）
  const profileSnap = await getDoc(doc(db, 'users', uid))
  if (profileSnap.exists()) {
    const p = profileSnap.data()
    if (p.settings) useUiStore.getState().updateSettings(p.settings)
    if (p.quest) useQuestStore.setState(p.quest)
  }

  // SRS chunks（依 deck 分桶）
  const srsSnap = await getDocs(collection(db, 'users', uid, 'srs'))
  if (!srsSnap.empty) {
    const cards: Record<string, SrsCardState> = {}
    srsSnap.forEach((d) => {
      const data = d.data() as { cards: Record<string, SrsCardState> }
      for (const [id, card] of Object.entries(data.cards ?? {})) {
        cards[id] = deserializeCard(card)
      }
    })
    useSrsStore.getState().replaceAll(cards)
  }
}

export function startSync(uid: string): void {
  stopSync()
  currentUid = uid
  const markDirty = () => {
    dirty = true
    if (!flushTimer) flushTimer = setTimeout(flush, WRITE_DEBOUNCE_MS)
  }
  unsubs = [
    useSrsStore.subscribe(markDirty),
    useQuestStore.subscribe(markDirty),
    useUiStore.subscribe(markDirty),
  ]
  // 離開頁面前 flush（PWA 常見於手機切走）
  window.addEventListener('pagehide', flushNow)
}

export function stopSync(): void {
  for (const u of unsubs) u()
  unsubs = []
  window.removeEventListener('pagehide', flushNow)
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = null
  currentUid = null
}

function flushNow(): void {
  if (dirty) void flush()
}

async function flush(): Promise<void> {
  flushTimer = null
  if (!dirty || !currentUid) return
  dirty = false
  const db = getDb()
  if (!db) return
  const uid = currentUid

  const ui = useUiStore.getState()
  const quest = useQuestStore.getState()
  const srs = useSrsStore.getState()

  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        settings: ui.settings,
        quest: { days: quest.days, streak: quest.streak, lastCheckIn: quest.lastCheckIn },
        updatedAt: Date.now(),
      },
      { merge: true },
    )
    for (const deck of DECKS) {
      const chunk: Record<string, SrsCardState> = {}
      for (const card of Object.values(srs.cards)) {
        if (card.deck === deck) chunk[card.itemId] = serializeCard(card)
      }
      await setDoc(doc(db, 'users', uid, 'srs', deck), { cards: chunk })
    }
  } catch (err) {
    // 離線或權限問題：標記回 dirty，下次再試
    console.warn('[sync] flush failed, will retry', err)
    dirty = true
    if (!flushTimer) flushTimer = setTimeout(flush, WRITE_DEBOUNCE_MS)
  }
}
