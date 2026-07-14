/**
 * 例句挖空（Part 5 型克漏字）用的純函式。
 * 只服務英文（拉丁字有明確詞界與簡單詞形變化）；日文不適用。
 */

/** 固定的空格 token */
export const BLANK = '______'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 在句子裡找出目標字的位置（不分大小寫、錨定詞界，含常見詞形變化）。
 * 回傳 { start, end }（end 為 exclusive），找不到回傳 null。
 */
export function findWordSpan(
  sentence: string,
  word: string,
): { start: number; end: number } | null {
  const w = word.trim()
  if (!w || !sentence) return null

  // ① 完全比對（整個詞）
  const exact = new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i')
  const m1 = exact.exec(sentence)
  if (m1) return { start: m1.index, end: m1.index + m1[0].length }

  // ② 詞形變化 fallback：去尾 e 取字幹，允許常見屈折字尾
  const stem = w.endsWith('e') ? w.slice(0, -1) : w
  if (stem.length < 3) return null // 太短的字幹容易誤命中
  const inflect = new RegExp(`\\b${escapeRegExp(stem)}(?:e|es|ed|ing|d|s|ies|ied)?\\b`, 'i')
  const m2 = inflect.exec(sentence)
  if (m2) {
    // 限制命中長度，避免短字幹吞掉不相干的長字（如 plan → planetarium）
    if (m2[0].length <= w.length + 3) {
      return { start: m2.index, end: m2.index + m2[0].length }
    }
  }
  return null
}

/**
 * 把句子中目標字換成空格。
 * found=false 時原句原樣回傳（呼叫端應改用其他題型）。
 */
export function makeCloze(sentence: string, word: string): { text: string; found: boolean } {
  const span = findWordSpan(sentence, word)
  if (!span) return { text: sentence, found: false }
  return {
    text: sentence.slice(0, span.start) + BLANK + sentence.slice(span.end),
    found: true,
  }
}
