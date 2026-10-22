import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserFromRequest } from '@/lib/auth'
import { encryptSecret, maskApiKey } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  apiKey: z.string().min(10).max(200),
})

export async function GET(req: NextRequest) {
  const auth = await requireUserFromRequest(req)
  if (auth instanceof NextResponse) return auth

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { geminiApiKeyEncrypted: true },
  })

  if (!user?.geminiApiKeyEncrypted) {
    return NextResponse.json({ hasKey: false, masked: null })
  }

  const { decryptSecret } = await import('@/lib/crypto')
  const plain = decryptSecret(user.geminiApiKeyEncrypted)
  return NextResponse.json({ hasKey: true, masked: maskApiKey(plain) })
}

export async function PUT(req: NextRequest) {
  const auth = await requireUserFromRequest(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = schema.parse(await req.json())
    const encrypted = encryptSecret(body.apiKey.trim())
    await prisma.user.update({
      where: { id: auth.userId },
      data: { geminiApiKeyEncrypted: encrypted },
    })
    return NextResponse.json({
      hasKey: true,
      masked: maskApiKey(body.apiKey.trim()),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Некорректный ключ' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUserFromRequest(req)
  if (auth instanceof NextResponse) return auth

  await prisma.user.update({
    where: { id: auth.userId },
    data: { geminiApiKeyEncrypted: null },
  })
  return NextResponse.json({ hasKey: false, masked: null })
}
