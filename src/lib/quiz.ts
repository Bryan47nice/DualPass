/**
 * 從種子資料自動生成選擇題（零 AI、離線可用、答案永遠正確）。
 * 每題 = 一個目標項目 + 同牌組隨機 3 個誘答。
 * 題型：看字選義 / 看義選字 / 例句填空(克漏字) / 聽力選義 / 聽力選字。
 */
import type { DeckId, Lang, SeedItem } from '@/types'
import { itemsForLang, matchesJaFilter, SEED_BY_ID, type JaFilterLike } from '@/data'
import { findWordSpan, makeCloze } from '@/lib/cloze'

export type QuizMode = 'toMeaning' | 'toWord' | 'cloze' | 'listenMeaning' | 'listenWord'

export interface QuizQuestion {
  itemId: string
  deck: DeckId
  mode: QuizMode
  /** 題幹（要顯示的內容） */
  prompt: string
  promptReading?: string
  promptIsJa: boolean
  /** 題幹為音檔：渲染播放鈕、作答前隱藏文字 */
  promptIsAudio?: boolean
  /** 要朗讀的文字（預設為目標字） */
  audioText?: string
  /** 例句翻譯，作答後揭示（克漏字用） */
  clozeTrans?: string
  /** 四個選項 */
  choices: string[]
  choicesAreJa: boolean
  answerIndex: number
}

export interface BuildQuizOptions {
  /** 只從這些 itemId 出題（錯題重測用） */
  onlyItemIds?: string[]
  /** 是否允許聽力題（傳入 ttsSupported()） */
  tts?: boolean
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

function weightedPick<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const it of items) {
    r -= it.weight
    if (r < 0) return it.value
  }
  return items[items.length - 1].value
}

/** 該項目是否適合出克漏字（限英文、有例句、且例句裡找得到目標字） */
function canCloze(item: SeedItem): boolean {
  return (
    item.deck === 'toeic-vocab' &&
    !!item.example &&
    findWordSpan(item.example, item.front) !== null
  )
}

/** 依牌組與資料可用性列出候選題型與權重 */
function candidateModes(item: SeedItem, tts: boolean): { mode: QuizMode; weight: number }[] {
  // 文法一律「題幹→意思」
  if (item.deck === 'n4-grammar') return [{ mode: 'toMeaning', weight: 1 }]
  const out: { mode: QuizMode; weight: number }[] = [
    { mode: 'toMeaning', weight: 40 },
    { mode: 'toWord', weight: 20 },
  ]
  if (canCloze(item)) out.push({ mode: 'cloze', weight: 20 })
  if (tts) {
    out.push({ mode: 'listenMeaning', weight: 10 })
    out.push({ mode: 'listenWord', weight: 10 })
  }
  return out
}

/**
 * 產生一份測驗。
 * @param lang 目前語系（en→多益；ja→N4/N5）
 * @param filter JA 篩選（單字/文法 × 等級），非 JA 忽略
 * @param count 題數
 * @param opts 進階選項（重測、聽力開關）
 */
export function buildQuiz(
  lang: Lang,
  filter: JaFilterLike | undefined,
  count: number,
  opts: BuildQuizOptions = {},
): QuizQuestion[] {
  const langItems = itemsForLang(lang)

  // 誘答一律從整個牌組抽（不受篩選/重測範圍影響，也修掉小 pool 出不了題的問題）
  const deckItems = new Map<DeckId, SeedItem[]>()
  for (const item of langItems) {
    const list = deckItems.get(item.deck) ?? []
    list.push(item)
    deckItems.set(item.deck, list)
  }

  // 出題目標池
  let targetPool: SeedItem[]
  if (opts.onlyItemIds) {
    const langIds = new Set(langItems.map((i) => i.id))
    targetPool = opts.onlyItemIds
      .map((id) => SEED_BY_ID.get(id))
      .filter((i): i is SeedItem => !!i && langIds.has(i.id))
  } else {
    targetPool = langItems.filter((i) => matchesJaFilter(i.deck, i.id, filter))
  }
  if (targetPool.length === 0) return []

  const targets = pick(targetPool, Math.min(count, targetPool.length))
  const questions: QuizQuestion[] = []

  for (const target of targets) {
    const deckArr = deckItems.get(target.deck) ?? langItems
    const mode = weightedPick(
      candidateModes(target, !!opts.tts).map((m) => ({ value: m.mode, weight: m.weight })),
    )

    let q: QuizQuestion | null
    switch (mode) {
      case 'cloze':
        q = makeClozeQ(target, deckArr) ?? makeToMeaning(target, deckArr, lang)
        break
      case 'listenMeaning':
        q = makeListenQ(target, deckArr, lang, 'listenMeaning')
        break
      case 'listenWord':
        q = makeListenQ(target, deckArr, lang, 'listenWord')
        break
      case 'toWord':
        q = makeToWord(target, deckArr, lang)
        break
      default:
        q = makeToMeaning(target, deckArr, lang)
    }
    if (q) questions.push(q)
  }
  return questions
}

/** 題幹是單字/文法，選正確的中文意思 */
function makeToMeaning(target: SeedItem, deckArr: SeedItem[], lang: Lang): QuizQuestion | null {
  const distractors = pick(
    deckArr.filter((i) => i.id !== target.id && i.meaning !== target.meaning),
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
function makeToWord(target: SeedItem, deckArr: SeedItem[], lang: Lang): QuizQuestion | null {
  const distractors = pick(
    deckArr.filter((i) => i.id !== target.id && i.front !== target.front),
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

/** 例句填空：把例句裡的目標字挖空，選正確的字 */
function makeClozeQ(target: SeedItem, deckArr: SeedItem[]): QuizQuestion | null {
  if (!target.example) return null
  const { text, found } = makeCloze(target.example, target.front)
  if (!found) return null
  const distractors = pick(
    deckArr.filter((i) => i.id !== target.id && i.front !== target.front),
    3,
  ).map((i) => i.front)
  if (distractors.length < 3) return null
  const choices = shuffle([target.front, ...distractors])
  return {
    itemId: target.id,
    deck: target.deck,
    mode: 'cloze',
    prompt: text,
    promptIsJa: false,
    audioText: target.front,
    clozeTrans: target.exampleTrans,
    choices,
    choicesAreJa: false,
    answerIndex: choices.indexOf(target.front),
  }
}

/** 聽力題：唸出目標字，選意思（listenMeaning）或選字（listenWord） */
function makeListenQ(
  target: SeedItem,
  deckArr: SeedItem[],
  lang: Lang,
  variant: 'listenMeaning' | 'listenWord',
): QuizQuestion | null {
  const base = {
    itemId: target.id,
    deck: target.deck,
    mode: variant,
    prompt: target.front, // 作答後才顯示，作為提示
    promptReading: target.reading && target.reading !== target.front ? target.reading : undefined,
    promptIsJa: lang === 'ja',
    promptIsAudio: true,
    audioText: lang === 'ja' ? target.reading ?? target.front : target.front,
  }

  if (variant === 'listenMeaning') {
    const distractors = pick(
      deckArr.filter((i) => i.id !== target.id && i.meaning !== target.meaning),
      3,
    ).map((i) => i.meaning)
    if (distractors.length < 3) return null
    const choices = shuffle([target.meaning, ...distractors])
    return { ...base, choices, choicesAreJa: false, answerIndex: choices.indexOf(target.meaning) }
  }

  const distractors = pick(
    deckArr.filter((i) => i.id !== target.id && i.front !== target.front),
    3,
  ).map((i) => i.front)
  if (distractors.length < 3) return null
  const choices = shuffle([target.front, ...distractors])
  return { ...base, choices, choicesAreJa: lang === 'ja', answerIndex: choices.indexOf(target.front) }
}
