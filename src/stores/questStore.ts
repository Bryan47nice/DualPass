import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QuestDay } from '@/types'
import { QUEST_TARGETS } from '@/types'
import { todayKey } from './srsStore'

interface QuestState {
  /** date → QuestDay（歷史保留供 streak 與統計） */
  days: Record<string, QuestDay>
  streak: number
  lastCheckIn: string | null
  addProgress: (field: 'enVocabDone' | 'jaGrammarDone' | 'readingDone', n?: number) => void
  /** 三項都達標時可打卡；回傳是否成功 */
  checkIn: () => boolean
  today: () => QuestDay
  isTodayComplete: () => boolean
}

function emptyDay(date: string): QuestDay {
  return { date, enVocabDone: 0, jaGrammarDone: 0, readingDone: 0 }
}

function isYesterday(dateStr: string, today: string): boolean {
  const d = new Date(today)
  d.setDate(d.getDate() - 1)
  const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return dateStr === y
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      days: {},
      streak: 0,
      lastCheckIn: null,

      addProgress: (field, n = 1) => {
        const date = todayKey()
        const s = get()
        const day = s.days[date] ?? emptyDay(date)
        set({ days: { ...s.days, [date]: { ...day, [field]: day[field] + n } } })
      },

      checkIn: () => {
        const s = get()
        const date = todayKey()
        if (!s.isTodayComplete()) return false
        if (s.lastCheckIn === date) return true // 已打卡
        const continued = s.lastCheckIn !== null && isYesterday(s.lastCheckIn, date)
        const day = s.days[date] ?? emptyDay(date)
        set({
          streak: continued ? s.streak + 1 : 1,
          lastCheckIn: date,
          days: { ...s.days, [date]: { ...day, completedAt: Date.now() } },
        })
        return true
      },

      today: () => {
        const date = todayKey()
        return get().days[date] ?? emptyDay(date)
      },

      isTodayComplete: () => {
        const d = get().today()
        return (
          d.enVocabDone >= QUEST_TARGETS.enVocab &&
          d.jaGrammarDone >= QUEST_TARGETS.jaGrammar &&
          d.readingDone >= QUEST_TARGETS.reading
        )
      },
    }),
    { name: 'dualpass-quest' },
  ),
)
