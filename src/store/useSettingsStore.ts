import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  apiKey: string
  aiAutoFill: boolean
  lastPrioritizeAt: number | null
  setApiKey: (key: string) => void
  setAiAutoFill: (value: boolean) => void
  markPrioritized: () => void
  canPrioritize: () => boolean
  prioritizeCooldownMs: () => number
}

const COOLDOWN_MS = 30_000

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      aiAutoFill: true,
      lastPrioritizeAt: null,
      setApiKey: (apiKey) => set({ apiKey: apiKey.trim() }),
      setAiAutoFill: (aiAutoFill) => set({ aiAutoFill }),
      markPrioritized: () => set({ lastPrioritizeAt: Date.now() }),
      canPrioritize: () => {
        const last = get().lastPrioritizeAt
        if (!last) return true
        return Date.now() - last >= COOLDOWN_MS
      },
      prioritizeCooldownMs: () => {
        const last = get().lastPrioritizeAt
        if (!last) return 0
        return Math.max(0, COOLDOWN_MS - (Date.now() - last))
      },
    }),
    {
      name: 'klar-settings',
      partialize: (state) => ({
        apiKey: state.apiKey,
        aiAutoFill: state.aiAutoFill,
        lastPrioritizeAt: state.lastPrioritizeAt,
      }),
    },
  ),
)
