export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'same-origin',
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    code?: string
  } & T

  if (!res.ok) {
    throw new ApiError(
      data.error || 'Ошибка запроса',
      res.status,
      data.code,
    )
  }
  return data
}
