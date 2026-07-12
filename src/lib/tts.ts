/**
 * 用瀏覽器內建的 Web Speech API 朗讀（零成本、離線可用）。
 * 日文用 ja-JP、英文用 en-US。iOS 需由使用者手勢觸發（點按鈕即可）。
 */
export function speak(text: string, lang: 'ja-JP' | 'en-US'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel() // 中斷前一句
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = lang === 'ja-JP' ? 0.85 : 0.95 // 日文放慢一點好聽清楚
  // 挑一個符合語系的嗓音（有的話）
  const voices = window.speechSynthesis.getVoices()
  const match = voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(lang.slice(0, 2)))
  if (match) u.voice = match
  window.speechSynthesis.speak(u)
}

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
