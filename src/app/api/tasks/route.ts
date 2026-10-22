import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mapTask } from '@/lib/task-mapper'

const createSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  quadrant: z
    .enum(['DO_FIRST', 'SCHEDULE', 'DELEGATE', 'DELETE'])
    .optional()
    .nullable(),
  aiScore: z.number().int().min(1).max(100).optional(),
  aiReasoning: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await requireUserFromRequest(req)
  if (auth instanceof NextResponse) return auth

  const tasks = await prisma.task.findMany({
    where: { userId: auth.userId },
    orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ tasks: tasks.map(mapTask) })
}

export async function POST(req: NextRequest) {
  const auth = await requireUserFromRequest(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = createSchema.parse(await req.json())
    const task = await prisma.task.create({
      data: {
        userId: auth.userId,
        title: body.title,
        description: body.description,
        priority: body.priority ?? 'MEDIUM',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        tags: body.tags ?? [],
        estimatedMinutes: body.estimatedMinutes,
        quadrant: body.quadrant ?? null,
        aiScore: body.aiScore,
        aiReasoning: body.aiReasoning,
      },
    })
    return NextResponse.json({ task: mapTask(task) }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
