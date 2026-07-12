import { useEffect, useRef, useState } from 'react'
import { t } from '@/i18n/zh-TW'
import type { Grade } from '@/types'
import { SEED_BY_ID } from '@/data'
import { useUiStore } from '@/stores/uiStore'
import { useSrsStore } from '@/stores/srsStore'
import { useQuestStore } from '@/stores/questStore'

export default function Flashcards() {
  const { lang, settings } = useUiStore()
  const buildQueue = useSrsStore((s) => s.buildQueue)
  const rateCard = useSrsStore((s) => s.rateCard)
  const addProgress = useQuestStore((s) => s.addProgress)

  // 佇列只在進入頁面（或切換語系）時建立一次
  const [queue, setQueue] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const builtFor = useRef<string | null>(null)

  useEffect(() => {
    if (builtFor.current === lang) return
    builtFor.current = lang
    const cards = buildQueue(lang, settings.newCardsPerDay)
    setQueue(cards.map((c) => c.itemId))
    setIndex(0)
    setRevealed(false)
  }, [lang, buildQueue, settings.newCardsPerDay])

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

  if (queue.length === 0 || index >= queue.length) {
    const finished = queue.length > 0
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold">
          {finished ? t.flashcards.finished : t.flashcards.empty}
        </p>
        {!finished && <p className="mt-2 text-sm text-slate-400">{t.flashcards.emptyHint}</p>}
      </div>
    )
  }

  if (!item) {
    // 佇列裡有卡但種子資料找不到（理論上不會發生）：跳過
    setIndex((i) => i + 1)
    return null
  }

  const accent = lang === 'en' ? 'text-sky-400' : 'text-rose-400'

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <header className="mb-4 flex items-center justify-between text-sm text-slate-400">
        <h1 className="font-semibold text-slate-200">{t.flashcards.title}</h1>
        <span>
          {t.flashcards.remaining} {queue.length - index}
        </span>
      </header>

      {/* 卡片 */}
      <div className="flex flex-1 flex-col rounded-2xl bg-slate-800 p-6">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className={`text-3xl font-bold ${accent}`}>{item.front}</div>
          {item.pos && <div className="mt-2 text-xs text-slate-500">{item.pos}</div>}

          {revealed && (
            <div className="mt-6 w-full space-y-4 border-t border-slate-700 pt-6 text-left">
              {item.reading && (
                <div>
                  <div className="text-xs text-slate-500">{t.flashcards.reading}</div>
                  <div className="text-lg">{item.reading}</div>
                </div>
              )}
              <div className="text-center text-xl font-semibold">{item.meaning}</div>
              {item.example && (
                <div className="rounded-xl bg-slate-900/60 p-3 text-sm">
                  <div className="text-xs text-slate-500">{t.flashcards.example}</div>
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
