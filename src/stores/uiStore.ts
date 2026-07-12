import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang, UserSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

interface UiState {
  lang: Lang
  settings: UserSettings
  setLang: (lang: Lang) => void
  toggleLang: () => void
  updateSettings: (patch: Partial<UserSettings>) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      lang: 'en',
      settings: DEFAULT_SETTINGS,
      setLang: (lang) => set({ lang }),
      toggleLang: () => set((s) => ({ lang: s.lang === 'en' ? 'ja' : 'en' })),
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: 'dualpass-ui' },
  ),
)
