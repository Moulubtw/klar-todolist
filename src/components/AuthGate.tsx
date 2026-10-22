'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const hydrated = useAuthStore((s) => s.hydrated)
  const refresh = useAuthStore((s) => s.refresh)

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (hydrated && !loading && !user) {
      router.replace('/login')
    }
  }, [hydrated, loading, user, router])

  if (!hydrated || loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-medium text-ink-soft">
        Загрузка…
      </div>
    )
  }

  return <>{children}</>
}
