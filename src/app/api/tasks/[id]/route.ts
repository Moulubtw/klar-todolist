import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { requireUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mapTask } from '@/lib/task-mapper'

const patchSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  isCompleted: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  quadrant: z
    .enum(['DO_FIRST', 'SCHEDULE', 'DELEGATE', 'DELETE'])
    .optional()
    .nullable(),
  aiScore: z.number().int().min(1).max(100).optional().nullable(),
  aiReasoning: z.string().optional().nullable(),
  subtasks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        isCompleted: z.boolean(),
      }),
    )
    .optional(),
})

type Ctx = { params: Promise<{ id: string }> }

async function getOwnedTask(userId: string, id: string) {
  return prisma.task.findFirst({ where: { id, userId } })
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireUserFromRequest(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await ctx.params

  const existing = await getOwnedTask(auth.userId, id)
  if (!existing) {
    return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
  }

  try {
    const body = patchSchema.parse(await req.json())
    const task = await prisma.task.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        isCompleted: body.isCompleted,
        priority: body.priority,
        dueDate:
          body.dueDate === undefined
            ? undefined
            : body.dueDate
              ? new Date(body.dueDate)
              : null,
        tags: body.tags,
        estimatedMinutes: body.estimatedMinutes,
        quadrant: body.quadrant,
        aiScore: body.aiScore,
        aiReasoning: body.aiReasoning,
        subtasks:
          body.subtasks === undefined
            ? undefined
            : (body.subtasks as unknown as Prisma.InputJsonValue),
      },
    })
    return NextResponse.json({ task: mapTask(task) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireUserFromRequest(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await ctx.params

  const existing = await getOwnedTask(auth.userId, id)
  if (!existing) {
    return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
  }

  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
