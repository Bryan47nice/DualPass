import { NavLink, Route, Routes } from 'react-router-dom'
import type { ComponentType } from 'react'
import { t } from '@/i18n/zh-TW'
import { useUiStore } from '@/stores/uiStore'
import { IconBook, IconCards, IconHome, IconQuiz, IconSettings } from '@/components/icons'
import Dashboard from '@/features/dashboard/Dashboard'
import Flashcards from '@/features/flashcards/Flashcards'
import Quiz from '@/features/quiz/Quiz'
import Mistakes from '@/features/mistakes/Mistakes'
import Settings from '@/features/settings/Settings'

const tabs: { to: string; label: string; Icon: ComponentType<{ className?: string }>; end?: boolean }[] = [
  { to: '/', label: t.nav.dashboard, Icon: IconHome, end: true },
  { to: '/flashcards', label: t.nav.flashcards, Icon: IconCards },
  { to: '/quiz', label: t.nav.quiz, Icon: IconQuiz },
  { to: '/mistakes', label: t.nav.mistakes, Icon: IconBook },
  { to: '/settings', label: t.nav.settings, Icon: IconSettings },
]

export default function App() {
  const lang = useUiStore((s) => s.lang)
  // 導覽 active 色跟隨學習模式：EN 藍 / JA 紅
  const activeColor = lang === 'en' ? 'text-sky-400' : 'text-rose-400'

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col md:max-w-lg">
      <main className="flex-1 px-4 pb-24 pt-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/mistakes" element={<Mistakes />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-700/60 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-md justify-around pb-[env(safe-area-inset-bottom)] md:max-w-lg">
          {tabs.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-[44px] flex-col items-center gap-1 px-3 py-2 text-[11px] transition-colors ${
                  isActive ? `${activeColor} font-semibold` : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
