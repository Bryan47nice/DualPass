import type { Card as FsrsCard } from 'ts-fsrs'

/** 學習語系模式 */
export type Lang = 'en' | 'ja'

/** 牌組分類 */
export type DeckId =
  | 'toeic-vocab'   // 多益商務單字
  | 'n4-vocab'      // N4 詞彙
  | 'n4-grammar'    // N4 文法句型
  | 'mistakes'      // 測驗錯題轉入

/** JLPT 等級（僅日文牌組適用） */
export type JlptLevel = 'N4' | 'N5'

/** 種子內容：一筆學習項目（打包進 bundle 的靜態資料） */
export interface SeedItem {
  id: string           // 例 "toeic:negotiate"、"n4v:あつまる"、"n4g:〜たことがある"
  deck: DeckId
  front: string        // 卡片正面：單字 / 文法點
  reading?: string     // 日文讀音（假名）
  pos?: string         // 詞性
  meaning: string      // zh-TW 釋義
  example?: string     // 例句
  exampleTrans?: string // 例句翻譯
  category?: string    // 商業情境 / 文法主題分類
  level?: JlptLevel    // 日文牌組的 JLPT 等級（N4/N5）
}

/** SRS 卡片排程狀態（ts-fsrs Card + 我們的識別欄位） */
export interface SrsCardState {
  itemId: string
  deck: DeckId
  fsrs: FsrsCard
}

/** 三鍵評分 */
export type Grade = 'again' | 'hard' | 'good'

/** AI 生成題目 */
export type QuestionType =
  | 'toeic_part5'
  | 'toeic_reading'
  | 'toeic_listening_script'
  | 'n4_vocab'
  | 'n4_grammar'

export interface Question {
  id: string
  lang: Lang
  type: QuestionType
  passage?: string
  question: string
  choices: string[]
  answerIndex: number
  explanation: string      // zh-TW 解說
  testedItems: string[]    // 對應 SeedItem id
  difficulty: number       // 1-5
  timesServed: number
}

/** 錯題紀錄 */
export interface WrongAnswer {
  id: string
  questionId: string
  question: Question
  chosenIndex: number
  at: number               // epoch ms
  resolved: boolean
}

/** 每日任務 */
export interface QuestDay {
  date: string             // yyyy-MM-dd
  enVocabDone: number      // 目標 10
  jaGrammarDone: number    // 目標 5
  readingDone: number      // 目標 1
  completedAt?: number
}

export const QUEST_TARGETS = { enVocab: 10, jaGrammar: 5, reading: 1 } as const

/** 使用者設定 */
export interface UserSettings {
  jlptDate: string   // yyyy-MM-dd
  toeicDate: string  // yyyy-MM-dd
  newCardsPerDay: number
}

export const DEFAULT_SETTINGS: UserSettings = {
  jlptDate: '2026-12-06',
  toeicDate: '2026-11-15',
  newCardsPerDay: 20,
}
