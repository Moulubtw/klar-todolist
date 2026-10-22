import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserGeminiKey, requireUserFromRequest } from '@/lib/auth'
import { analyzeNewTaskWithAI, GeminiError } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'
import { mapTask } from '@/lib/task-mapper'

const schema = z.object({
  title: z.string().trim().min(1).max(500),
})

export async function POST(req: NextRequest) {
  const auth = await requireUserFromRequest(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = schema.parse(await req.json())
    const apiKey = await getUserGeminiKey(auth.userId)

    const base = await prisma.task.create({
      data: {
        userId: auth.userId,
        title: body.title,
        priority: 'MEDIUM',
      },
    })

    if (!apiKey) {
      return NextResponse.json({
        task: mapTask(base),
        analyzed: false,
        warning: 'Ключ Gemini не задан — задача сохранена без AI',
      })
    }

    try {
      const analysis = await analyzeNewTaskWithAI(apiKey, body.title)
      const task = await prisma.task.update({
        where: { id: base.id },
        data: {
          priority: analysis.priority,
          quadrant: analysis.quadrant,
          estimatedMinutes: analysis.estimatedMinutes,
          dueDate: analysis.dueDate ? new Date(analysis.dueDate) : null,
          tags: analysis.tags,
          aiScore: analysis.aiScore,
          aiReasoning: analysis.aiReasoning,
        },
      })
      return NextResponse.json({ task: mapTask(task), analyzed: true })
    } catch (error) {
      return NextResponse.json({
        task: mapTask(base),
        analyzed: false,
        warning:
          error instanceof GeminiError
            ? error.message
            : 'AI-анализ не удался — задача сохранена без обогащения',
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
