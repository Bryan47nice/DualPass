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
