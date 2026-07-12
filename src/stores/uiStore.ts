import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang, UserSettings, JlptLevel } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

/** 日文複習範圍篩選 */
export type JaType = 'all' | 'vocab' | 'grammar'
export interface JaFilter {
  type: JaType
  level: 'all' | JlptLevel
}

interface UiState {
  lang: Lang
  settings: UserSettings
  jaFilter: JaFilter
  setLang: (lang: Lang) => void
  toggleLang: () => void
  updateSettings: (patch: Partial<UserSettings>) => void
  setJaFilter: (patch: Partial<JaFilter>) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      lang: 'en',
      settings: DEFAULT_SETTINGS,
      jaFilter: { type: 'all', level: 'all' },
      setLang: (lang) => set({ lang }),
      toggleLang: () => set((s) => ({ lang: s.lang === 'en' ? 'ja' : 'en' })),
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      setJaFilter: (patch) => set((s) => ({ jaFilter: { ...s.jaFilter, ...patch } })),
    }),
    { name: 'dualpass-ui' },
  ),
)
