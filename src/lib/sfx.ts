/**
 * 答題音效：用 Web Audio API 即時合成，零音檔、離線可用。
 * AudioContext 需由使用者手勢啟動——答題的點擊本身就是手勢，故可正常發聲。
 */
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  freq: number,
  startOffset: number,
  dur: number,
  type: OscillatorType = 'sine',
  peak = 0.14,
): void {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(c.destination)
  const t0 = c.currentTime + startOffset
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

/** 答對：明亮的上行兩音（A5 → E6） */
export function playCorrect(): void {
  tone(880, 0, 0.12)
  tone(1318.5, 0.1, 0.16)
}

/** 答錯：低沉的下行方波蜂鳴 */
export function playWrong(): void {
  tone(196, 0, 0.22, 'square', 0.1)
  tone(146.8, 0.12, 0.24, 'square', 0.1)
}
