import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Grade, Lang, SrsCardState } from '@/types'
import { itemsForLang, matchesJaFilter, type JaFilterLike } from '@/data'
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
  /** 每日已引入的新卡數：{ "yyyy-MM-dd": { <bucket>: n } }；bucket 見 bucketKey() */
  newIntroduced: Record<string, Record<string, number>>
  /** 今日各語系已複習張數（供每日任務計數） */
  reviewedToday: Record<string, Record<Lang, number>>
  rateCard: (itemId: string, grade: Grade) => void
  /** 到期舊卡 + 依每日額度引入的新卡，組成今日複習佇列（filter 僅日文適用） */
  buildQueue: (lang: Lang, newCardsPerDay: number, filter?: JaFilterLike) => SrsCardState[]
  dueCount: (lang: Lang, filter?: JaFilterLike) => number
  newAvailableCount: (lang: Lang, newCardsPerDay: number, filter?: JaFilterLike) => number
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

      buildQueue: (lang, newCardsPerDay, filter) => {
        const s = get()
        const now = new Date()
        const due = Object.values(s.cards).filter(
          (c) =>
            langOf(c) === lang &&
            isDue(c, now) &&
            matchesJaFilter(c.deck, c.itemId, filter),
        )
        // 引入新卡（尚無排程狀態的種子項目），每個篩選組合各有獨立每日額度
        const today = todayKey()
        const bucket = bucketKey(lang, filter)
        const introducedToday = s.newIntroduced[today]?.[bucket] ?? 0
        const budget = Math.max(0, newCardsPerDay - introducedToday)
        const fresh = itemsForLang(lang)
          .filter((item) => !s.cards[item.id] && matchesJaFilter(item.deck, item.id, filter))
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
                ...(s.newIntroduced[today] ?? {}),
                [bucket]: introducedToday + fresh.length,
              },
            },
          })
        }
        return [...due, ...fresh]
      },

      dueCount: (lang, filter) => {
        const now = new Date()
        return Object.values(get().cards).filter(
          (c) =>
            langOf(c) === lang &&
            isDue(c, now) &&
            matchesJaFilter(c.deck, c.itemId, filter),
        ).length
      },

      newAvailableCount: (lang, newCardsPerDay, filter) => {
        const s = get()
        const introducedToday = s.newIntroduced[todayKey()]?.[bucketKey(lang, filter)] ?? 0
        const budget = Math.max(0, newCardsPerDay - introducedToday)
        const freshTotal = itemsForLang(lang).filter(
          (i) => !s.cards[i.id] && matchesJaFilter(i.deck, i.id, filter),
        ).length
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

/** 每日新卡額度的分桶：全部/全部 用語系，其餘依篩選各自獨立 */
function bucketKey(lang: Lang, filter?: JaFilterLike): string {
  if (!filter || (filter.type === 'all' && filter.level === 'all')) return lang
  return `${lang}:${filter.type}:${filter.level}`
}

export { todayKey }
