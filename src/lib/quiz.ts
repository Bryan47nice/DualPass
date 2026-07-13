/**
 * 從種子資料自動生成選擇題（零 AI、離線可用、答案永遠正確）。
 * 每題 = 一個目標項目 + 同牌組隨機 3 個誘答。
 */
import type { DeckId, Lang, SeedItem } from '@/types'
import { itemsForLang, matchesJaFilter, type JaFilterLike } from '@/data'

export type QuizMode = 'toMeaning' | 'toWord'

export interface QuizQuestion {
  itemId: string
  deck: DeckId
  mode: QuizMode
  /** 題幹（要顯示的內容） */
  prompt: string
  promptReading?: string
  promptIsJa: boolean
  /** 四個選項 */
  choices: string[]
  choicesAreJa: boolean
  answerIndex: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

/**
 * 產生一份測驗。
 * @param lang 目前語系（en→多益；ja→N4/N5）
 * @param filter JA 篩選（單字/文法 × 等級），非 JA 忽略
 * @param count 題數
 */
export function buildQuiz(lang: Lang, filter: JaFilterLike | undefined, count: number): QuizQuestion[] {
  const pool = itemsForLang(lang).filter((i) => matchesJaFilter(i.deck, i.id, filter))
  if (pool.length < 4) return [] // 選項不足

  // 同牌組分組，供抽誘答
  const byDeck = new Map<DeckId, SeedItem[]>()
  for (const item of pool) {
    const list = byDeck.get(item.deck) ?? []
    list.push(item)
    byDeck.set(item.deck, list)
  }

  const targets = pick(pool, Math.min(count, pool.length))
  const questions: QuizQuestion[] = []

  for (const target of targets) {
    const sameDeck = byDeck.get(target.deck) ?? pool
    // 文法一律「題幹→意思」；單字隨機正逆向
    const mode: QuizMode =
      target.deck === 'n4-grammar' ? 'toMeaning' : Math.random() < 0.65 ? 'toMeaning' : 'toWord'

    const q = mode === 'toMeaning'
      ? makeToMeaning(target, sameDeck, lang)
      : makeToWord(target, sameDeck, lang)
    if (q) questions.push(q)
  }
  return questions
}

/** 題幹是單字/文法，選正確的中文意思 */
function makeToMeaning(target: SeedItem, sameDeck: SeedItem[], lang: Lang): QuizQuestion | null {
  const distractors = pick(
    sameDeck.filter((i) => i.id !== target.id && i.meaning !== target.meaning),
    3,
  ).map((i) => i.meaning)
  if (distractors.length < 3) return null
  const choices = shuffle([target.meaning, ...distractors])
  return {
    itemId: target.id,
    deck: target.deck,
    mode: 'toMeaning',
    prompt: target.front,
    promptReading: target.reading && target.reading !== target.front ? target.reading : undefined,
    promptIsJa: lang === 'ja',
    choices,
    choicesAreJa: false,
    answerIndex: choices.indexOf(target.meaning),
  }
}

/** 題幹是中文意思，選正確的單字/文法 */
function makeToWord(target: SeedItem, sameDeck: SeedItem[], lang: Lang): QuizQuestion | null {
  const distractors = pick(
    sameDeck.filter((i) => i.id !== target.id && i.front !== target.front),
    3,
  ).map((i) => i.front)
  if (distractors.length < 3) return null
  const choices = shuffle([target.front, ...distractors])
  return {
    itemId: target.id,
    deck: target.deck,
    mode: 'toWord',
    prompt: target.meaning,
    promptIsJa: false,
    choices,
    choicesAreJa: lang === 'ja',
    answerIndex: choices.indexOf(target.front),
  }
}
