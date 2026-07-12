import { t } from '@/i18n/zh-TW'
import { useQuestStore } from '@/stores/questStore'

export default function Quiz() {
  const addProgress = useQuestStore((s) => s.addProgress)
  const today = useQuestStore((s) => s.today())

  return (
    <div className="space-y-5">
      <h1 className="font-semibold">{t.quiz.title}</h1>
      <div className="flex min-h-[40dvh] flex-col items-center justify-center rounded-2xl bg-slate-800 p-6 text-center">
        <p className="text-lg font-semibold">🚧 {t.quiz.comingSoon}</p>
        <p className="mt-2 text-sm text-slate-400">{t.quiz.comingSoonHint}</p>
      </div>
      {/* W5 前的過渡：自行閱讀後手動登記，讓每日任務可以完成 */}
      <button
        onClick={() => addProgress('readingDone')}
        disabled={today.readingDone >= 1}
        className={`w-full rounded-xl py-3 font-semibold ${
          today.readingDone >= 1
            ? 'bg-slate-700 text-slate-500'
            : 'bg-sky-500 text-white active:bg-sky-600'
        }`}
      >
        {today.readingDone >= 1 ? '今日閱讀已完成 ✅' : '我今天讀完一篇閱讀了（手動登記）'}
      </button>
    </div>
  )
}
