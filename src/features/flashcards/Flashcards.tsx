import { useEffect, useRef, useState, type ReactNode } from 'react'
import { t } from '@/i18n/zh-TW'
import type { Grade } from '@/types'
import { SEED_BY_ID } from '@/data'
import { useUiStore } from '@/stores/uiStore'
import { useSrsStore } from '@/stores/srsStore'
import { useQuestStore } from '@/stores/questStore'
import { speak, ttsSupported } from '@/lib/tts'

/** 小喇叭發音按鈕 */
function SpeakButton({ text, lang }: { text: string; lang: 'ja-JP' | 'en-US' }) {
  if (!ttsSupported()) return null
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        speak(text, lang)
      }}
      aria-label={t.flashcards.play}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-base active:bg-slate-600"
    >
      🔊
    </button>
  )
}

export default function Flashcards() {
  const { lang, settings } = useUiStore()
  const jaFilter = useUiStore((s) => s.jaFilter)
  const buildQueue = useSrsStore((s) => s.buildQueue)
  const rateCard = useSrsStore((s) => s.rateCard)
  const addProgress = useQuestStore((s) => s.addProgress)

  // 日文才套用篩選；英文不受影響
  const filter = lang === 'ja' ? jaFilter : undefined
  const filterKey = lang === 'ja' ? `ja:${jaFilter.type}:${jaFilter.level}` : 'en'

  // 佇列在切換語系或變更篩選時重建
  const [queue, setQueue] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const builtFor = useRef<string | null>(null)

  useEffect(() => {
    if (builtFor.current === filterKey) return
    builtFor.current = filterKey
    const cards = buildQueue(lang, settings.newCardsPerDay, filter)
    setQueue(cards.map((c) => c.itemId))
    setIndex(0)
    setRevealed(false)
  }, [filterKey, lang, filter, buildQueue, settings.newCardsPerDay])

  const currentId = queue[index]
  const item = currentId ? SEED_BY_ID.get(currentId) : undefined

  function grade(g: Grade) {
    if (!currentId) return
    rateCard(currentId, g)
    addProgress(lang === 'en' ? 'enVocabDone' : 'jaGrammarDone')
    setRevealed(false)
    if (g === 'again') {
      // 不會的卡排回本輪佇列尾端再複習一次
      setQueue((q) => [...q, currentId])
    }
    setIndex((i) => i + 1)
  }

  const accent = lang === 'en' ? 'text-sky-400' : 'text-rose-400'
  const ttsLang: 'ja-JP' | 'en-US' = lang === 'en' ? 'en-US' : 'ja-JP'
  const empty = queue.length === 0 || index >= queue.length
  const finished = empty && queue.length > 0

  return (
    <div className="flex min-h-[70dvh] flex-col">
      {lang === 'ja' && <JaFilterBar />}

      {empty || !item ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-lg font-semibold">
            {finished ? t.flashcards.finished : t.flashcards.empty}
          </p>
          {!finished && <p className="mt-2 text-sm text-slate-400">{t.flashcards.emptyHint}</p>}
        </div>
      ) : (
        <>
          <header className="mb-4 flex items-center justify-between text-sm text-slate-400">
            <h1 className="font-semibold text-slate-200">{t.flashcards.title}</h1>
            <span>
              {t.flashcards.remaining} {queue.length - index}
            </span>
          </header>

          {/* 卡片 */}
          <div className="flex flex-1 flex-col rounded-2xl bg-slate-800 p-6">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              {/* 等級 / 類型徽章 */}
              <div className="mb-3 flex gap-2">
                {item.level && <Badge>{item.level}</Badge>}
                <Badge>{deckLabel(item.deck)}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-3xl font-bold ${accent}`}>{item.front}</div>
                <SpeakButton text={item.front} lang={ttsLang} />
              </div>
              {/* 日文卡：正面就顯示假名讀音，讓不熟漢字也念得出來 */}
              {item.reading && item.reading !== item.front && (
                <div className="mt-1 text-base text-slate-400">{item.reading}</div>
              )}
              {item.pos && <div className="mt-2 text-xs text-slate-500">{item.pos}</div>}

              {revealed && (
                <div className="mt-6 w-full space-y-4 border-t border-slate-700 pt-6 text-left">
                  <div className="text-center text-xl font-semibold">{item.meaning}</div>
                  {item.example && (
                    <div className="rounded-xl bg-slate-900/60 p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-slate-500">{t.flashcards.example}</span>
                        <SpeakButton text={item.example} lang={ttsLang} />
                      </div>
                      <div className="mt-1">{item.example}</div>
                      {item.exampleTrans && (
                        <div className="mt-1 text-slate-400">{item.exampleTrans}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 操作區 */}
          <div className="mt-4">
            {revealed ? (
              <div className="grid grid-cols-3 gap-3">
                <GradeButton label={t.flashcards.again} className="bg-red-500/90 active:bg-red-600" onClick={() => grade('again')} />
                <GradeButton label={t.flashcards.hard} className="bg-amber-500/90 active:bg-amber-600" onClick={() => grade('hard')} />
                <GradeButton label={t.flashcards.good} className="bg-emerald-500/90 active:bg-emerald-600" onClick={() => grade('good')} />
              </div>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="w-full rounded-xl bg-slate-700 py-4 font-semibold active:bg-slate-600"
              >
                {t.flashcards.showAnswer}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
      {children}
    </span>
  )
}

function deckLabel(deck: string): string {
  if (deck === 'n4-vocab') return t.flashcards.vocab
  if (deck === 'n4-grammar') return t.flashcards.grammar
  if (deck === 'toeic-vocab') return t.flashcards.toeic
  return t.flashcards.mistakes
}

/** 日文複習篩選列：類型（單字/文法）× 等級（N4/N5） */
function JaFilterBar() {
  const jaFilter = useUiStore((s) => s.jaFilter)
  const setJaFilter = useUiStore((s) => s.setJaFilter)
  const dueCount = useSrsStore((s) => s.dueCount('ja', jaFilter))
  const newCount = useSrsStore((s) =>
    s.newAvailableCount('ja', useUiStore.getState().settings.newCardsPerDay, jaFilter),
  )

  return (
    <div className="mb-4 space-y-2">
      <SegGroup
        value={jaFilter.type}
        onChange={(v) => setJaFilter({ type: v as typeof jaFilter.type })}
        options={[
          { value: 'all', label: t.flashcards.filterAll },
          { value: 'vocab', label: t.flashcards.vocab },
          { value: 'grammar', label: t.flashcards.grammar },
        ]}
      />
      <SegGroup
        value={jaFilter.level}
        onChange={(v) => setJaFilter({ level: v as typeof jaFilter.level })}
        options={[
          { value: 'all', label: t.flashcards.filterAll },
          { value: 'N5', label: 'N5' },
          { value: 'N4', label: 'N4' },
        ]}
      />
      <div className="text-center text-xs text-slate-500">
        {t.dashboard.dueCards} {dueCount} · {t.dashboard.newCards} {newCount}
      </div>
    </div>
  )
}

function SegGroup({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-800 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            value === o.value ? 'bg-rose-500 text-white' : 'text-slate-400 active:text-slate-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function GradeButton({
  label,
  className,
  onClick,
}: {
  label: string
  className: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className={`rounded-xl py-4 font-semibold text-white ${className}`}>
      {label}
    </button>
  )
}
