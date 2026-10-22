'use client'

import { create } from 'zustand'
import { api } from '@/lib/api-client'

export type AuthUser = {
  id: string
  email: string
  name: string | null
  hasGeminiKey: boolean
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  hydrated: boolean
  setUser: (user: AuthUser | null) => void
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  hydrated: false,
  setUser: (user) => set({ user }),
  refresh: async () => {
    set({ loading: true })
    try {
      const data = await api<{ user: AuthUser }>('/api/auth/me')
      set({ user: data.user, loading: false, hydrated: true })
    } catch {
      set({ user: null, loading: false, hydrated: true })
    }
  },
  logout: async () => {
    await api('/api/auth/logout', { method: 'POST' })
    set({ user: null })
  },
}))
