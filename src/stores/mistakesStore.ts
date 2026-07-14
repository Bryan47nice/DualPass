import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DeckId, Lang } from '@/types'

/** 連續答對幾次才算「精熟／已訂正」 */
export const MASTERY_THRESHOLD = 2

/** 一筆錯題紀錄（測驗答錯時寫入） */
export interface MistakeEntry {
  itemId: string
  deck: DeckId
  lang: Lang
  prompt: string          // 當時的題幹
  correctAnswer: string   // 正解文字
  chosenAnswer: string    // 使用者選的
  at: number              // epoch ms
  correctStreak: number   // 上次答錯後的連續答對次數
  masteredAt?: number     // 達精熟門檻的時間
  resolved: boolean       // 衍生：correctStreak >= MASTERY_THRESHOLD
}

interface MistakesState {
  /** itemId → 最新一筆錯題（同一項只留最新，避免爆量） */
  entries: Record<string, MistakeEntry>
  add: (e: Omit<MistakeEntry, 'at' | 'resolved' | 'correctStreak' | 'masteredAt'>) => void
  /** 答對一次：推進精熟計數，達門檻標記已訂正（不建立新紀錄） */
  recordCorrect: (itemId: string) => void
  /** 複習評 again 時：重置既有未訂正紀錄的連對計數（不建立新紀錄） */
  resetStreakIfPresent: (itemId: string) => void
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
            // 已精熟又答錯 → 重新啟用；沿用同一筆、歸零連對計數
            ...s.entries,
            [e.itemId]: {
              ...e,
              at: Date.now(),
              correctStreak: 0,
              masteredAt: undefined,
              resolved: false,
            },
          },
        })),

      recordCorrect: (itemId) =>
        set((s) => {
          const entry = s.entries[itemId]
          if (!entry || entry.resolved) return s
          const correctStreak = entry.correctStreak + 1
          const mastered = correctStreak >= MASTERY_THRESHOLD
          return {
            entries: {
              ...s.entries,
              [itemId]: {
                ...entry,
                correctStreak,
                resolved: mastered,
                masteredAt: mastered ? Date.now() : entry.masteredAt,
              },
            },
          }
        }),

      resetStreakIfPresent: (itemId) =>
        set((s) => {
          const entry = s.entries[itemId]
          if (!entry || entry.resolved) return s
          if (entry.correctStreak === 0) return s
          return {
            entries: { ...s.entries, [itemId]: { ...entry, correctStreak: 0 } },
          }
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
    {
      name: 'dualpass-mistakes',
      version: 1,
      // v0 → v1：舊資料沒有 correctStreak，用 resolved 回填，避免 x/2 進度顯示 NaN
      migrate: (persisted, version) => {
        const s = persisted as { entries?: Record<string, Partial<MistakeEntry>> } | undefined
        if (!s?.entries) return s as MistakesState
        if (version < 1) {
          s.entries = Object.fromEntries(
            Object.entries(s.entries).map(([id, e]) => [
              id,
              {
                ...e,
                correctStreak: e.resolved ? MASTERY_THRESHOLD : 0,
                resolved: !!e.resolved,
              },
            ]),
          )
        }
        return s as MistakesState
      },
    },
  ),
)
