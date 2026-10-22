import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { getUserGeminiKey, requireUserFromRequest } from '@/lib/auth'
import { decomposeTaskWithAI, GeminiError } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'
import { mapTask } from '@/lib/task-mapper'

const schema = z.object({
  taskId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const auth = await requireUserFromRequest(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = schema.parse(await req.json())
    const existing = await prisma.task.findFirst({
      where: { id: body.taskId, userId: auth.userId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    const apiKey = await getUserGeminiKey(auth.userId)
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Добавьте GEMINI_API_KEY в настройках', code: 'NO_KEY' },
        { status: 400 },
      )
    }

    const subtasks = await decomposeTaskWithAI(
      apiKey,
      existing.title,
      existing.description,
    )
    const task = await prisma.task.update({
      where: { id: existing.id },
      data: { subtasks: subtasks as unknown as Prisma.InputJsonValue },
    })
    return NextResponse.json({ task: mapTask(task) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
    }
    if (error instanceof GeminiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 502 },
      )
    }
    console.error(error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
