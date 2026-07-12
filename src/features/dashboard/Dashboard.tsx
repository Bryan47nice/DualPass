import { Link } from 'react-router-dom'
import { t } from '@/i18n/zh-TW'
import { QUEST_TARGETS } from '@/types'
import { useUiStore } from '@/stores/uiStore'
import { useSrsStore } from '@/stores/srsStore'
import { useQuestStore } from '@/stores/questStore'

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86_400_000)
}

export default function Dashboard() {
  const { lang, toggleLang, settings } = useUiStore()
  const dueCount = useSrsStore((s) => s.dueCount(lang))
  const newCount = useSrsStore((s) => s.newAvailableCount(lang, settings.newCardsPerDay))
  const quest = useQuestStore()
  const today = quest.today()
  const complete = quest.isTodayComplete()
  const checkedIn = quest.lastCheckIn === today.date

  const jlptDays = daysUntil(settings.jlptDate)
  const toeicDays = daysUntil(settings.toeicDate)

  return (
    <div className="space-y-5">
      {/* 標題 + 模式切換 */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t.app.name}</h1>
          <p className="text-xs text-slate-400">{t.app.tagline}</p>
        </div>
        <button
          onClick={toggleLang}
          aria-label="切換學習語系"
          className="relative flex h-10 w-32 items-center rounded-full bg-slate-800 p-1 text-sm font-semibold"
        >
          <span
            className={`absolute h-8 w-[3.7rem] rounded-full transition-transform duration-200 ${
              lang === 'en' ? 'translate-x-0 bg-sky-500' : 'translate-x-[3.8rem] bg-rose-500'
            }`}
          />
          <span className={`relative z-10 w-1/2 text-center ${lang === 'en' ? 'text-white' : 'text-slate-400'}`}>
            EN
          </span>
          <span className={`relative z-10 w-1/2 text-center ${lang === 'ja' ? 'text-white' : 'text-slate-400'}`}>
            JA
          </span>
        </button>
      </header>

      {/* 考試倒數 */}
      <section className="grid grid-cols-2 gap-3">
        <CountdownCard
          label={t.dashboard.countdownToeic}
          days={toeicDays}
          active={lang === 'en'}
          color="sky"
        />
        <CountdownCard
          label={t.dashboard.countdownJlpt}
          days={jlptDays}
          active={lang === 'ja'}
          color="rose"
        />
      </section>

      {/* 複習入口 */}
      <section className="rounded-2xl bg-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-5 text-sm">
            <div>
              <div className="text-2xl font-bold text-amber-400">{dueCount}</div>
              <div className="text-slate-400">{t.dashboard.dueCards}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">{newCount}</div>
              <div className="text-slate-400">{t.dashboard.newCards}</div>
            </div>
          </div>
          <Link
            to="/flashcards"
            className={`rounded-xl px-5 py-3 font-semibold text-white ${
              lang === 'en' ? 'bg-sky-500 active:bg-sky-600' : 'bg-rose-500 active:bg-rose-600'
            }`}
          >
            {t.dashboard.startReview}
          </Link>
        </div>
      </section>

      {/* 每日任務 */}
      <section className="rounded-2xl bg-slate-800 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t.dashboard.dailyQuest}</h2>
          <span className="text-sm text-slate-400">
            🔥 {t.dashboard.streak} {quest.streak}
          </span>
        </div>
        <ul className="space-y-2">
          <QuestRow
            label={t.dashboard.questEnVocab}
            done={today.enVocabDone}
            target={QUEST_TARGETS.enVocab}
          />
          <QuestRow
            label={t.dashboard.questJaGrammar}
            done={today.jaGrammarDone}
            target={QUEST_TARGETS.jaGrammar}
          />
          <QuestRow
            label={t.dashboard.questReading}
            done={today.readingDone}
            target={QUEST_TARGETS.reading}
          />
        </ul>
        <button
          onClick={() => quest.checkIn()}
          disabled={!complete || checkedIn}
          className={`mt-4 w-full rounded-xl py-3 font-semibold transition-colors ${
            checkedIn
              ? 'bg-emerald-600/30 text-emerald-300'
              : complete
                ? 'bg-emerald-500 text-white active:bg-emerald-600'
                : 'bg-slate-700 text-slate-500'
          }`}
        >
          {checkedIn ? t.dashboard.questDone : t.dashboard.checkIn}
        </button>
      </section>
    </div>
  )
}

function CountdownCard({
  label,
  days,
  active,
  color,
}: {
  label: string
  days: number
  active: boolean
  color: 'sky' | 'rose'
}) {
  const ring = color === 'sky' ? 'ring-sky-500' : 'ring-rose-500'
  const text = color === 'sky' ? 'text-sky-400' : 'text-rose-400'
  return (
    <div
      className={`rounded-2xl bg-slate-800 p-4 ${active ? `ring-2 ${ring}` : 'opacity-70'}`}
    >
      <div className="text-xs text-slate-400">{label}</div>
      {days >= 0 ? (
        <div className="mt-1">
          <span className={`text-3xl font-bold ${text}`}>{days}</span>
          <span className="ml-1 text-sm text-slate-400">{t.dashboard.daysLeft}</span>
        </div>
      ) : (
        <div className="mt-1 text-sm text-slate-500">{t.dashboard.examPassed}</div>
      )}
    </div>
  )
}

function QuestRow({ label, done, target }: { label: string; done: number; target: number }) {
  const finished = done >= target
  return (
    <li className="flex items-center justify-between text-sm">
      <span className={finished ? 'text-slate-500 line-through' : ''}>
        {finished ? '✅' : '⬜'} {label}
      </span>
      <span className={`tabular-nums ${finished ? 'text-emerald-400' : 'text-slate-400'}`}>
        {Math.min(done, target)}/{target}
      </span>
    </li>
  )
}
