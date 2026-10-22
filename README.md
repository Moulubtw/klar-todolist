# Klar — Smart ToDoList

Веб-приложение для управления задачами с AI-приоритезацией через Google Gemini.

## Стек

- Vite + React + TypeScript
- Tailwind CSS v4
- Zustand + localStorage
- `@google/genai` (модель `gemini-2.5-flash`)
- Framer Motion, Lucide

## Быстрый старт

```bash
npm install
npm run dev
```

1. Откройте приложение.
2. В настройках вставьте `GEMINI_API_KEY` из [Google AI Studio](https://aistudio.google.com/apikey).
3. Добавьте задачи с включённым **AI Auto-fill** или нажмите **Разобрать с AI**.

Ключ хранится только в `localStorage` браузера (BYOK).

## Возможности

- CRUD задач
- AI Auto-fill при создании (приоритет, дедлайн, время, теги)
- Массовая приоритезация («Разобрать с AI») + матрица Эйзенхауэра
- Декомпозиция задачи на подзадачи
- Rate limit 30 с на приоритезацию
- Fallback: без AI приложение работает как обычный todo
