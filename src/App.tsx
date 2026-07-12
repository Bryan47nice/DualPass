import { NavLink, Route, Routes } from 'react-router-dom'
import { t } from '@/i18n/zh-TW'
import Dashboard from '@/features/dashboard/Dashboard'
import Flashcards from '@/features/flashcards/Flashcards'
import Quiz from '@/features/quiz/Quiz'
import Mistakes from '@/features/mistakes/Mistakes'
import Settings from '@/features/settings/Settings'

const tabs = [
  { to: '/', label: t.nav.dashboard, icon: '🏠', end: true },
  { to: '/flashcards', label: t.nav.flashcards, icon: '🗂️' },
  { to: '/quiz', label: t.nav.quiz, icon: '✍️' },
  { to: '/mistakes', label: t.nav.mistakes, icon: '📕' },
  { to: '/settings', label: t.nav.settings, icon: '⚙️' },
]

export default function App() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
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
        <div className="mx-auto flex max-w-md justify-around pb-[env(safe-area-inset-bottom)]">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors ${
                  isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
