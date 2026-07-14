import { Link } from 'react-router-dom'
import { t } from '@/i18n/zh-TW'
import { IconBook } from '@/components/icons'
import { SEED_BY_ID } from '@/data'
import { MASTERY_THRESHOLD, useMistakesStore } from '@/stores/mistakesStore'

function tpl(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

export default function Mistakes() {
  const entries = useMistakesStore((s) => Object.values(s.entries))
  const clearResolved = useMistakesStore((s) => s.clearResolved)
  const list = [...entries].sort((a, b) => b.at - a.at)
  const hasResolved = list.some((e) => e.resolved)
  const hasUnresolved = list.some((e) => !e.resolved)

  if (list.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="font-semibold">{t.mistakes.title}</h1>
        <div className="flex min-h-[40dvh] flex-col items-center justify-center rounded-2xl bg-slate-800 p-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900/60 text-slate-500">
            <IconBook className="h-8 w-8" />
          </div>
          <p className="text-lg font-semibold">{t.mistakes.empty}</p>
          <p className="mt-2 text-sm text-slate-400">{t.mistakes.emptyHint}</p>
          <Link
            to="/quiz"
            className="mt-6 rounded-xl bg-slate-900/60 px-5 py-3 text-sm font-medium text-slate-300 active:bg-slate-700"
          >
            {t.mistakes.goQuiz}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">{t.mistakes.title}</h1>
        <span className="text-sm text-slate-400">{tpl(t.mistakes.count, { n: list.length })}</span>
      </div>

      {hasUnresolved && (
        <Link
          to="/quiz?mode=retest"
          className="block rounded-xl bg-sky-500 py-3 text-center text-sm font-semibold text-white active:bg-sky-600"
        >
          {t.mistakes.retest}
        </Link>
      )}

      <ul className="space-y-3">
        {list.map((e) => {
          const item = SEED_BY_ID.get(e.itemId)
          const isJa = e.lang === 'ja'
          return (
            <li
              key={e.itemId}
              className={`rounded-2xl bg-slate-800 p-4 ${e.resolved ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div lang={isJa ? 'ja' : 'en'} className="text-lg font-bold">
                    {item?.front ?? e.prompt}
                  </div>
                  {item?.reading && item.reading !== item.front && (
                    <div lang="ja" className="text-sm text-slate-400">
                      {item.reading}
                    </div>
                  )}
                </div>
                {e.resolved ? (
                  <span className="shrink-0 rounded-full bg-emerald-600/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                    {t.mistakes.resolved}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-slate-900/60 px-2 py-0.5 text-[11px] font-semibold text-slate-400 tabular-nums">
                    {tpl(t.mistakes.masteryProgress, { c: e.correctStreak, n: MASTERY_THRESHOLD })}
                  </span>
                )}
              </div>

              <div className="mt-2 space-y-1 text-sm">
                <div className="text-emerald-400">
                  {t.mistakes.correctAnswer}：{item?.meaning ?? e.correctAnswer}
                </div>
                {!e.resolved && (
                  <div className="text-red-400">
                    {t.mistakes.yourAnswer}：{e.chosenAnswer}
                  </div>
                )}
                {item?.example && (
                  <div lang={isJa ? 'ja' : 'en'} className="mt-1 text-slate-400">
                    {item.example}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <p className="text-center text-xs text-slate-500">
        {tpl(t.mistakes.resolvedHint, { n: MASTERY_THRESHOLD })}
      </p>
      {hasResolved && (
        <button
          onClick={clearResolved}
          className="w-full rounded-xl bg-slate-800 py-3 text-sm font-medium text-slate-400 active:bg-slate-700"
        >
          {t.mistakes.clearResolved}
        </button>
      )}
    </div>
  )
}
