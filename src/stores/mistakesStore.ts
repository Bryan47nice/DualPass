import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DeckId, Lang } from '@/types'

/** 一筆錯題紀錄（測驗答錯時寫入） */
export interface MistakeEntry {
  itemId: string
  deck: DeckId
  lang: Lang
  prompt: string          // 當時的題幹
  correctAnswer: string   // 正解文字
  chosenAnswer: string    // 使用者選的
  at: number              // epoch ms
  resolved: boolean       // 之後複習對了可標記已解決
}

interface MistakesState {
  /** itemId → 最新一筆錯題（同一項只留最新，避免爆量） */
  entries: Record<string, MistakeEntry>
  add: (e: Omit<MistakeEntry, 'at' | 'resolved'>) => void
  resolve: (itemId: string) => void
  remove: (itemId: string) => void
  clearResolved: () => void
  list: () => MistakeEntry[]
}

export const useMistakesStore = create<MistakesState>()(
  persist(
    (set, get) => ({
      entries: {},

      add: (e) =>
        set((s) => ({
          entries: {
            ...s.entries,
            [e.itemId]: { ...e, at: Date.now(), resolved: false },
          },
        })),

      resolve: (itemId) =>
        set((s) => {
          const entry = s.entries[itemId]
          if (!entry) return s
          return { entries: { ...s.entries, [itemId]: { ...entry, resolved: true } } }
        }),

      remove: (itemId) =>
        set((s) => {
          const next = { ...s.entries }
          delete next[itemId]
          return { entries: next }
        }),

      clearResolved: () =>
        set((s) => ({
          entries: Object.fromEntries(
            Object.entries(s.entries).filter(([, e]) => !e.resolved),
          ),
        })),

      list: () => Object.values(get().entries).sort((a, b) => b.at - a.at),
    }),
    { name: 'dualpass-mistakes' },
  ),
)
