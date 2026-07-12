import type { SeedItem, DeckId, Lang } from '@/types'
import toeicVocab from './toeic-vocab.json'
import n4Vocab from './n4-vocab.json'
import n4Grammar from './n4-grammar.json'

export const SEED_ITEMS: SeedItem[] = [
  ...(toeicVocab as SeedItem[]),
  ...(n4Vocab as SeedItem[]),
  ...(n4Grammar as SeedItem[]),
]

export const SEED_BY_ID: Map<string, SeedItem> = new Map(
  SEED_ITEMS.map((item) => [item.id, item]),
)

export const DECKS_BY_LANG: Record<Lang, DeckId[]> = {
  en: ['toeic-vocab'],
  ja: ['n4-vocab', 'n4-grammar'],
}

export function itemsForLang(lang: Lang): SeedItem[] {
  const decks = new Set<DeckId>(DECKS_BY_LANG[lang])
  return SEED_ITEMS.filter((i) => decks.has(i.deck))
}

/** 日文複習篩選：type（單字/文法/全部）× level（N4/N5/全部） */
export interface JaFilterLike {
  type: 'all' | 'vocab' | 'grammar'
  level: 'all' | 'N4' | 'N5'
}

/** 依 deck 與 itemId 判斷是否符合日文篩選（非日文牌組一律通過） */
export function matchesJaFilter(
  deck: DeckId,
  itemId: string,
  filter: JaFilterLike | undefined,
): boolean {
  if (!filter) return true
  if (deck === 'toeic-vocab') return true // 英文不受影響
  if (filter.type === 'vocab' && deck !== 'n4-vocab') return false
  if (filter.type === 'grammar' && deck !== 'n4-grammar') return false
  if (filter.level !== 'all') {
    const item = SEED_BY_ID.get(itemId)
    if (item?.level !== filter.level) return false
  }
  return true
}
