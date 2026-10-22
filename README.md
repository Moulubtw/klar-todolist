# Klar — Smart ToDoList

Next.js приложение с регистрацией, Neon PostgreSQL и AI-приоритезацией через Gemini.

## Стек

- Next.js (App Router) + TypeScript + Tailwind
- Neon (PostgreSQL) + Prisma
- Auth: email/password, httpOnly JWT cookie
- Gemini API: ключ **на пользователя**, шифруется и хранится в БД (не в localStorage)
- Деплой: Vercel

## Локально

```bash
npm install
cp .env.example .env
# заполните DATABASE_URL, AUTH_SECRET, ENCRYPTION_SECRET
npx prisma db push
npm run dev
```

## CLI

```bash
# Neon
neonctl auth
neonctl projects create --name klar-todolist
neonctl connection-string <project-id> --database-name neondb

# Vercel
vercel login
vercel link
vercel env add DATABASE_URL
vercel env add AUTH_SECRET
vercel env add ENCRYPTION_SECRET
vercel --prod
```
