'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api-client'
import { useAuthStore, type AuthUser } from '@/store/useAuthStore'

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const refresh = useAuthStore((s) => s.refresh)
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (hydrated && user) router.replace('/')
  }, [hydrated, user, router])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await api<{ user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          name: name.trim() || undefined,
        }),
      })
      setUser(data.user)
      router.replace('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка регистрации')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="animate-fade-up rounded-2xl border border-ink/10 bg-white/80 p-8 shadow-lg backdrop-blur">
        <p className="font-display text-4xl font-extrabold text-ink">Klar</p>
        <h1 className="mt-2 text-lg font-semibold text-ink-soft">Регистрация</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none ring-sea/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none ring-sea/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Пароль (мин. 8 символов)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none ring-sea/30 focus:ring-2"
            />
          </div>
          {error ? (
            <p className="text-sm font-medium text-coral">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-ink py-3 text-sm font-bold text-white hover:bg-ink-soft disabled:opacity-50"
          >
            {busy ? 'Создаём…' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-soft">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-semibold text-sea hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
