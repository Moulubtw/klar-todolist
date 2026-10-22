import { GoogleGenAI, Type, type Schema } from '@google/genai'
import type {
  PrioritizationResult,
  Subtask,
  Task,
  TaskAnalysisResult,
} from '@/types/task'
import { randomUUID } from 'crypto'

function getClient(apiKey: string) {
  return new GoogleGenAI({ apiKey })
}

const prioritizationSchema: Schema = {
  type: Type.ARRAY,
  description: 'Список проанализированных задач с обновленными приоритетами',
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'ID исходной задачи' },
      priority: {
        type: Type.STRING,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      },
      quadrant: {
        type: Type.STRING,
        enum: ['DO_FIRST', 'SCHEDULE', 'DELEGATE', 'DELETE'],
      },
      estimatedMinutes: {
        type: Type.INTEGER,
        description: 'Оценка времени в минутах',
      },
      aiScore: {
        type: Type.INTEGER,
        description: 'Рейтинг приоритетности от 1 до 100',
      },
      aiReasoning: {
        type: Type.STRING,
        description: 'Короткое объяснение выбора приоритета для пользователя',
      },
    },
    required: [
      'id',
      'priority',
      'quadrant',
      'estimatedMinutes',
      'aiScore',
      'aiReasoning',
    ],
  },
}

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    priority: {
      type: Type.STRING,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    quadrant: {
      type: Type.STRING,
      enum: ['DO_FIRST', 'SCHEDULE', 'DELEGATE', 'DELETE'],
    },
    estimatedMinutes: { type: Type.INTEGER },
    dueDate: {
      type: Type.STRING,
      description:
        'ISO date YYYY-MM-DD если дедлайн угадывается из текста, иначе пустая строка',
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    aiScore: { type: Type.INTEGER },
    aiReasoning: { type: Type.STRING },
  },
  required: [
    'priority',
    'quadrant',
    'estimatedMinutes',
    'tags',
    'aiScore',
    'aiReasoning',
  ],
}

const decomposeSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
    },
    required: ['title'],
  },
}

export class GeminiError extends Error {
  readonly code?: 'NO_KEY' | 'RATE' | 'AUTH' | 'NETWORK' | 'UNKNOWN'

  constructor(
    message: string,
    code?: 'NO_KEY' | 'RATE' | 'AUTH' | 'NETWORK' | 'UNKNOWN',
  ) {
    super(message)
    this.name = 'GeminiError'
    this.code = code
  }
}

function mapApiError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error)
  if (/api key|403|401|invalid/i.test(message)) {
    throw new GeminiError('Неверный GEMINI_API_KEY', 'AUTH')
  }
  if (/429|quota|rate/i.test(message)) {
    throw new GeminiError('Превышена квота Gemini. Попробуйте позже.', 'RATE')
  }
  if (/fetch|network|Failed to fetch/i.test(message)) {
    throw new GeminiError('Сеть недоступна. Проверьте соединение.', 'NETWORK')
  }
  throw new GeminiError(message || 'Ошибка AI-модуля', 'UNKNOWN')
}

export async function prioritizeTasksWithAI(
  apiKey: string,
  tasks: Task[],
): Promise<PrioritizationResult[]> {
  if (!apiKey.trim()) {
    throw new GeminiError('Добавьте GEMINI_API_KEY в настройках', 'NO_KEY')
  }

  const batch = tasks.filter((t) => !t.isCompleted).slice(0, 50)
  if (batch.length === 0) return []

  const ai = getClient(apiKey)
  const prompt = `
Текущее время: ${new Date().toISOString()}
Список задач: ${JSON.stringify(
    batch.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
    })),
  )}
`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Ты — эксперт по личной продуктивности и тайм-менеджменту. Проанализируй список задач пользователя, учитывая текущую дату и время. Для каждой задачи определи уровень приоритета, квадрант матрицы Эйзенхауэра, примерное время выполнения в минутах, вычисли индекс важности (aiScore от 1 до 100) и дай краткое обоснование (1 предложение на русском языке).',
        responseMimeType: 'application/json',
        responseSchema: prioritizationSchema,
        temperature: 0.2,
      },
    })

    const text = response.text
    if (!text) throw new GeminiError('Пустой ответ от Gemini', 'UNKNOWN')
    return JSON.parse(text) as PrioritizationResult[]
  } catch (error) {
    if (error instanceof GeminiError) throw error
    mapApiError(error)
  }
}

export async function analyzeNewTaskWithAI(
  apiKey: string,
  title: string,
): Promise<TaskAnalysisResult> {
  if (!apiKey.trim()) {
    throw new GeminiError('Добавьте GEMINI_API_KEY в настройках', 'NO_KEY')
  }

  const ai = getClient(apiKey)
  const prompt = `
Текущее время: ${new Date().toISOString()}
Название задачи: "${title}"

Извлеки дедлайн из естественного языка если он есть, оцени приоритет по матрице Эйзенхауэра, время выполнения, теги и краткое обоснование на русском.
`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Ты — ассистент по продуктивности. Обогащай новую задачу метаданными приоритета.',
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        temperature: 0.2,
      },
    })

    const text = response.text
    if (!text) throw new GeminiError('Пустой ответ от Gemini', 'UNKNOWN')
    const parsed = JSON.parse(text) as TaskAnalysisResult & { dueDate?: string }
    return {
      ...parsed,
      dueDate:
        parsed.dueDate && parsed.dueDate.length > 0 ? parsed.dueDate : undefined,
    }
  } catch (error) {
    if (error instanceof GeminiError) throw error
    mapApiError(error)
  }
}

export async function decomposeTaskWithAI(
  apiKey: string,
  title: string,
  description?: string | null,
): Promise<Subtask[]> {
  if (!apiKey.trim()) {
    throw new GeminiError('Добавьте GEMINI_API_KEY в настройках', 'NO_KEY')
  }

  const ai = getClient(apiKey)
  const prompt = `
Задача: ${title}
Описание: ${description ?? '—'}

Разбей на 3–5 конкретных подзадач-шагов на русском языке.
`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Ты — ассистент по продуктивности. Декомпозируй сложные задачи на простые шаги.',
        responseMimeType: 'application/json',
        responseSchema: decomposeSchema,
        temperature: 0.3,
      },
    })

    const text = response.text
    if (!text) throw new GeminiError('Пустой ответ от Gemini', 'UNKNOWN')
    const items = JSON.parse(text) as { title: string }[]
    return items.slice(0, 5).map((item) => ({
      id: randomUUID(),
      title: item.title,
      isCompleted: false,
    }))
  } catch (error) {
    if (error instanceof GeminiError) throw error
    mapApiError(error)
  }
}
