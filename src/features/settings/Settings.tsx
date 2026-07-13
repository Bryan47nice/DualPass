import { useState } from 'react'
import { t } from '@/i18n/zh-TW'
import { firebaseEnabled, signIn, signOut } from '@/lib/firebase'
import { useAuth, describeAuthError } from '@/lib/useAuth'
import { useUiStore } from '@/stores/uiStore'
import { APP_VERSION, CHANGELOG } from '@/version'

export default function Settings() {
  const { user, ready, localMode, authError } = useAuth()
  const { settings, updateSettings } = useUiStore()
  const [showChangelog, setShowChangelog] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  async function handleSignIn() {
    setSignInError(null)
    try {
      await signIn()
    } catch (err) {
      console.error('[auth] sign-in failed', err)
      setSignInError(describeAuthError(err))
    }
  }

  const error = signInError ?? authError

  return (
    <div className="space-y-5">
      <h1 className="font-semibold">{t.settings.title}</h1>

      {/* 帳號 */}
      <section className="rounded-2xl bg-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-400">{t.settings.account}</h2>
        {localMode ? (
          <div>
            <div className="font-semibold text-amber-400">{t.settings.localMode}</div>
            <p className="mt-1 text-sm text-slate-400">{t.settings.localModeHint}</p>
          </div>
        ) : !ready ? (
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
            確認登入狀態中…
          </div>
        ) : user ? (
          <div className="flex items-center justify-between">
            <span className="text-sm">{user.email}</span>
            <button
              onClick={() => void signOut()}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm active:bg-slate-600"
            >
              {t.settings.signOut}
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => void handleSignIn()}
              disabled={!firebaseEnabled}
              className="w-full rounded-xl bg-sky-500 py-3 font-semibold text-white active:bg-sky-600"
            >
              {t.settings.signIn}
            </button>
            {error && (
              <p className="mt-2 rounded-lg bg-red-500/15 p-2 text-xs leading-relaxed text-red-300">
                {error}
              </p>
            )}
          </div>
        )}
      </section>

      {/* 考試日期 */}
      <section className="rounded-2xl bg-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-400">{t.settings.examDates}</h2>
        <div className="space-y-3">
          <DateField
            label={t.settings.jlptDate}
            value={settings.jlptDate}
            onChange={(v) => updateSettings({ jlptDate: v })}
          />
          <DateField
            label={t.settings.toeicDate}
            value={settings.toeicDate}
            onChange={(v) => updateSettings({ toeicDate: v })}
          />
        </div>
      </section>

      {/* 學習 */}
      <section className="rounded-2xl bg-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-400">{t.settings.study}</h2>
        <label className="flex items-center justify-between text-sm">
          {t.settings.newCardsPerDay}
          <input
            type="number"
            min={0}
            max={100}
            value={settings.newCardsPerDay}
            onChange={(e) =>
              updateSettings({ newCardsPerDay: Math.max(0, Number(e.target.value) || 0) })
            }
            className="w-20 rounded-lg bg-slate-900 px-3 py-2 text-right"
          />
        </label>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span>
            {t.settings.sound}
            <span className="mt-0.5 block text-xs text-slate-500">{t.settings.soundHint}</span>
          </span>
          <button
            role="switch"
            aria-checked={settings.soundEnabled !== false}
            onClick={() => updateSettings({ soundEnabled: settings.soundEnabled === false })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              settings.soundEnabled !== false ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                settings.soundEnabled !== false ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 授權聲明 */}
      <section className="rounded-2xl bg-slate-800 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-400">{t.settings.licenses}</h2>
        <p className="text-xs leading-relaxed text-slate-400">{t.settings.licensesBody}</p>
      </section>

      {/* 版本 */}
      <button
        onClick={() => setShowChangelog(true)}
        className="w-full py-2 text-center text-xs text-slate-500 active:text-slate-300"
      >
        {t.app.name} v{APP_VERSION} · {t.settings.changelog}
      </button>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </div>
  )
}

function ChangelogModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-4 sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-slate-800 p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t.settings.changelog}</h2>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-700 px-3 py-1 text-sm active:bg-slate-600"
          >
            {t.settings.close}
          </button>
        </div>
        <ul className="space-y-5">
          {CHANGELOG.map((entry, i) => (
            <li key={entry.version}>
              <div className="mb-1 flex items-center gap-2">
                <span className="font-semibold">v{entry.version}</span>
                {i === 0 && (
                  <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {t.settings.latest}
                  </span>
                )}
                <span className="text-xs text-slate-500">{entry.date}</span>
              </div>
              <ul className="space-y-1">
                {entry.changes.map((c, j) => (
                  <li key={j} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-slate-500">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center justify-between text-sm">
      {label}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg bg-slate-900 px-3 py-2"
      />
    </label>
  )
}
