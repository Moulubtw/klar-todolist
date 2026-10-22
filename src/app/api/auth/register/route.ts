import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSessionToken, setSessionCookie } from '@/lib/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(80).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const email = body.email.toLowerCase()

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже есть' },
        { status: 409 },
      )
    }

    const passwordHash = await bcrypt.hash(body.password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: body.name ?? null,
      },
    })

    const token = await createSessionToken(user.id)
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasGeminiKey: false,
      },
    })
    setSessionCookie(res, token)
    return res
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Некорректные данные регистрации' },
        { status: 400 },
      )
    }
    console.error(error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
