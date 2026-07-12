import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card as FsrsCard,
  type Grade as FsrsGrade,
} from 'ts-fsrs'
import type { Grade, SrsCardState, DeckId } from '@/types'

const scheduler = fsrs() // FSRS 預設參數

const gradeToRating: Record<Grade, FsrsGrade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
}

/** 建立一張新卡（尚未複習過） */
export function newCard(itemId: string, deck: DeckId): SrsCardState {
  return { itemId, deck, fsrs: createEmptyCard(new Date()) }
}

/** 評分一張卡，回傳更新後的排程狀態 */
export function rate(card: SrsCardState, grade: Grade, now = new Date()): SrsCardState {
  const result = scheduler.repeat(card.fsrs, now)[gradeToRating[grade]]
  return { ...card, fsrs: result.card }
}

/** 卡片是否到期 */
export function isDue(card: SrsCardState, now = new Date()): boolean {
  return new Date(card.fsrs.due).getTime() <= now.getTime()
}

/** Firestore/JSON 序列化：ts-fsrs 的 Date 欄位轉 ISO 字串 */
export function serializeCard(card: SrsCardState): SrsCardState {
  const f = card.fsrs as FsrsCard & { due: Date | string; last_review?: Date | string }
  return {
    ...card,
    fsrs: {
      ...card.fsrs,
      due: new Date(f.due).toISOString() as unknown as Date,
      last_review: f.last_review
        ? (new Date(f.last_review).toISOString() as unknown as Date)
        : undefined,
    },
  }
}

export function deserializeCard(card: SrsCardState): SrsCardState {
  return {
    ...card,
    fsrs: {
      ...card.fsrs,
      due: new Date(card.fsrs.due),
      last_review: card.fsrs.last_review ? new Date(card.fsrs.last_review) : undefined,
    },
  }
}
