import { t } from '@/i18n/zh-TW'
import { IconBook } from '@/components/icons'

export default function Mistakes() {
  return (
    <div className="space-y-5">
      <h1 className="font-semibold">{t.mistakes.title}</h1>
      <div className="flex min-h-[40dvh] flex-col items-center justify-center rounded-2xl bg-slate-800 p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900/60 text-slate-500">
          <IconBook className="h-8 w-8" />
        </div>
        <p className="text-lg font-semibold">{t.mistakes.empty}</p>
        <p className="mt-2 text-sm text-slate-400">{t.mistakes.emptyHint}</p>
      </div>
    </div>
  )
}
