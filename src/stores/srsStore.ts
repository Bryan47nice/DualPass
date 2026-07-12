import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Grade, Lang, SrsCardState } from '@/types'
import { itemsForLang } from '@/data'
import { deserializeCard, isDue, newCard, rate, serializeCard } from '@/lib/srs'

function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface SrsState {
  /** itemId → 卡片排程狀態（只包含「已引入」的卡） */
  cards: Record<string, SrsCardState>
  /** 每日已引入的新卡數：{ "yyyy-MM-dd": { en: n, ja: n } } */
  newIntroduced: Record<string, Record<Lang, number>>
  /** 今日各語系已複習張數（供每日任務計數） */
  reviewedToday: Record<string, Record<Lang, number>>
  rateCard: (itemId: string, grade: Grade) => void
  /** 到期舊卡 + 依每日額度引入的新卡，組成今日複習佇列 */
  buildQueue: (lang: Lang, newCardsPerDay: number) => SrsCardState[]
  dueCount: (lang: Lang) => number
  newAvailableCount: (lang: Lang, newCardsPerDay: number) => number
  /** 測驗錯題注入：已有卡評 again，沒有的建新卡 */
  injectMistake: (itemId: string) => void
  replaceAll: (cards: Record<string, SrsCardState>) => void
}

export const useSrsStore = create<SrsState>()(
  persist(
    (set, get) => ({
      cards: {},
      newIntroduced: {},
      reviewedToday: {},

      rateCard: (itemId, grade) => {
        const s = get()
        const existing = s.cards[itemId]
        if (!existing) return
        const lang: Lang = existing.deck === 'toeic-vocab' ? 'en' : 'ja'
        const today = todayKey()
        const reviewed = s.reviewedToday[today] ?? { en: 0, ja: 0 }
        set({
          cards: { ...s.cards, [itemId]: rate(existing, grade) },
          reviewedToday: {
            [today]: { ...reviewed, [lang]: reviewed[lang] + 1 },
          },
        })
      },

      buildQueue: (lang, newCardsPerDay) => {
        const s = get()
        const now = new Date()
        const due = Object.values(s.cards).filter(
          (c) => langOf(c) === lang && isDue(c, now),
        )
        // 引入新卡（尚無排程狀態的種子項目），受每日額度限制
        const today = todayKey()
        const introducedToday = s.newIntroduced[today]?.[lang] ?? 0
        const budget = Math.max(0, newCardsPerDay - introducedToday)
        const fresh = itemsForLang(lang)
          .filter((item) => !s.cards[item.id])
          .slice(0, budget)
          .map((item) => newCard(item.id, item.deck))
        if (fresh.length > 0) {
          const nextCards = { ...s.cards }
          for (const c of fresh) nextCards[c.itemId] = c
          set({
            cards: nextCards,
            newIntroduced: {
              ...s.newIntroduced,
              [today]: {
                ...(s.newIntroduced[today] ?? { en: 0, ja: 0 }),
                [lang]: introducedToday + fresh.length,
              },
            },
          })
        }
        return [...due, ...fresh]
      },

      dueCount: (lang) => {
        const now = new Date()
        return Object.values(get().cards).filter(
          (c) => langOf(c) === lang && isDue(c, now),
        ).length
      },

      newAvailableCount: (lang, newCardsPerDay) => {
        const s = get()
        const introducedToday = s.newIntroduced[todayKey()]?.[lang] ?? 0
        const budget = Math.max(0, newCardsPerDay - introducedToday)
        const freshTotal = itemsForLang(lang).filter((i) => !s.cards[i.id]).length
        return Math.min(budget, freshTotal)
      },

      injectMistake: (itemId) => {
        const s = get()
        const existing = s.cards[itemId]
        if (existing) {
          set({ cards: { ...s.cards, [itemId]: rate(existing, 'again') } })
        } else {
          const item = itemsForLang('en')
            .concat(itemsForLang('ja'))
            .find((i) => i.id === itemId)
          if (!item) return
          set({ cards: { ...s.cards, [itemId]: newCard(item.id, item.deck) } })
        }
      },

      replaceAll: (cards) => set({ cards }),
    }),
    {
      name: 'dualpass-srs',
      storage: createJSONStorage(() => localStorage, {
        // ts-fsrs 的 Date 欄位在 JSON 往返時需要還原
        reviver: (_key, value) => value,
      }),
      partialize: (s) => ({
        cards: Object.fromEntries(
          Object.entries(s.cards).map(([k, v]) => [k, serializeCard(v)]),
        ),
        newIntroduced: s.newIntroduced,
        reviewedToday: s.reviewedToday,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<SrsState> | undefined
        if (!p) return current
        return {
          ...current,
          ...p,
          cards: Object.fromEntries(
            Object.entries(p.cards ?? {}).map(([k, v]) => [
              k,
              deserializeCard(v as SrsCardState),
            ]),
          ),
        }
      },
    },
  ),
)

function langOf(card: SrsCardState): Lang {
  return card.deck === 'toeic-vocab' ? 'en' : 'ja'
}

export { todayKey }
