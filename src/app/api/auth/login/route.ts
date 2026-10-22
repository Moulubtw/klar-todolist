import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSessionToken, setSessionCookie } from '@/lib/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const email = body.email.toLowerCase()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 },
      )
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash)
    if (!ok) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 },
      )
    }

    const token = await createSessionToken(user.id)
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasGeminiKey: Boolean(user.geminiApiKeyEncrypted),
      },
    })
    setSessionCookie(res, token)
    return res
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
