import { NextRequest, NextResponse } from 'next/server'
import { getUserGeminiKey, requireUserFromRequest } from '@/lib/auth'
import { GeminiError, prioritizeTasksWithAI } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'
import { mapTask } from '@/lib/task-mapper'

const COOLDOWN_MS = 30_000

export async function POST(req: NextRequest) {
  const auth = await requireUserFromRequest(req)
  if (auth instanceof NextResponse) return auth

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { lastPrioritizeAt: true },
  })

  if (user?.lastPrioritizeAt) {
    const elapsed = Date.now() - user.lastPrioritizeAt.getTime()
    if (elapsed < COOLDOWN_MS) {
      return NextResponse.json(
        {
          error: `Подождите ${Math.ceil((COOLDOWN_MS - elapsed) / 1000)} с`,
          retryAfterMs: COOLDOWN_MS - elapsed,
        },
        { status: 429 },
      )
    }
  }

  const apiKey = await getUserGeminiKey(auth.userId)
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Добавьте GEMINI_API_KEY в настройках', code: 'NO_KEY' },
      { status: 400 },
    )
  }

  const rows = await prisma.task.findMany({
    where: { userId: auth.userId, isCompleted: false },
    take: 50,
  })

  if (rows.length === 0) {
    return NextResponse.json({ tasks: [] })
  }

  try {
    const results = await prioritizeTasksWithAI(apiKey, rows.map(mapTask))

    await prisma.$transaction(
      results.map((r) =>
        prisma.task.updateMany({
          where: { id: r.id, userId: auth.userId },
          data: {
            priority: r.priority,
            quadrant: r.quadrant,
            estimatedMinutes: r.estimatedMinutes,
            aiScore: r.aiScore,
            aiReasoning: r.aiReasoning,
          },
        }),
      ),
    )

    await prisma.user.update({
      where: { id: auth.userId },
      data: { lastPrioritizeAt: new Date() },
    })

    const tasks = await prisma.task.findMany({
      where: { userId: auth.userId },
      orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ tasks: tasks.map(mapTask) })
  } catch (error) {
    const message =
      error instanceof GeminiError ? error.message : 'AI-приоритезация недоступна'
    const status = error instanceof GeminiError && error.code === 'AUTH' ? 400 : 502
    return NextResponse.json(
      {
        error: message,
        code: error instanceof GeminiError ? error.code : 'UNKNOWN',
      },
      { status },
    )
  }
}
