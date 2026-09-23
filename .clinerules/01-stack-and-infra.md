# Стек и инфраструктура — Real Estate Marketplace

## Монорепо

Turborepo:
```
apps/
  web/     — Next.js 16 (App Router), TypeScript
  api/     — NestJS, TypeScript
packages/
  shared/  — общие Zod-схемы, TS-типы, DTO-контракты между FE/BE
  ui/      — переиспользуемые UI-компоненты (опционально, по необходимости)
  config/  — общий eslint/tsconfig/tailwind config
```

## Frontend

- Next.js 16 (App Router) + TypeScript (strict mode), запиннен точно на 16.2.10
- Tailwind CSS v4 (CSS-first: токены в `globals.css` через `:root` + `@theme inline`, `tailwind.config.ts` не используется) + shadcn/ui как база компонентов (кастомизируется под дизайн)
- Zustand — client state (UI-состояние, фильтры формы, локальные предпочтения)
- TanStack Query — server state, кэш, инвалидация после мутаций
- React Hook Form + Zod — формы, схемы валидации импортируются из `packages/shared`
- Framer Motion — лёгкие scroll-анимации (`whileInView`, `once: true`), без параллакс-эффектов
- Leaflet + OpenStreetMap (react-leaflet) — карта с кластеризацией меток (`react-leaflet-cluster`)

## Backend

- NestJS (Modules, Controllers, Providers, Guards, Interceptors, Pipes) — намеренный выбор ради DI и
  модульной архитектуры под GRASP/GoF
- PostgreSQL + Prisma ORM
- Redis (Upstash free tier) — кэш горячих запросов, rate-limiting, дедуп счётчика просмотров
- Passport.js — JWT-стратегия + Google OAuth2 стратегия
- BullMQ — очереди: email-подтверждение, авто-отмена брони по таймеру
- Zod на границе DTO (`nestjs-zod` + кастомный `ZodValidationPipe`) — единый подход на всём стеке.
  Схемы из `packages/shared` (включая discriminated union по типам сделки) переиспользуются
  напрямую и в валидации NestJS-запросов, и в React Hook Form — один источник правды, без
  дублирования DTO. class-validator не используется.

## Инфраструктура (всё бесплатное)

- БД: Neon (Postgres, serverless, не спит)
- Backend hosting: Render free tier (+ GitHub Actions cron-пинг раз в 10 мин, чтобы не засыпал)
- Frontend hosting: Vercel
- Файлы/фото: UploadThing (с возможной заменой позже)
- Email: Resend (100 писем/день бесплатно)
- Redis: Upstash free tier

## Инфра-нюансы, которые нужно закладывать в архитектуру

- Render free tier "засыпает" — cron keep-alive через GitHub Actions настраивается с самого начала
  CI, а не постфактум.
- UploadThing — учитывать лимиты free tier при проектировании загрузки фото: сжатие изображений на
  клиенте перед загрузкой.
- Neon — serverless Postgres, есть cold start при первом коннекте. Учитывать connection pooling
  (Prisma Accelerate или PgBouncer), если станет проблемой.
- Upstash Redis free tier — лимит на количество команд/день, не на объём. BullMQ активно шлёт
  команды в Redis (delayed jobs держат служебные ключи per job). Если упрёмся в лимит — запасной
  вариант для auto-cancel брони: `@nestjs/schedule` cron вместо BullMQ delayed job.

## Тесты

- Jest + React Testing Library — frontend, ключевые компоненты и хуки
- Jest + Nest Testing Module — backend, сервисы и guards в приоритете
- Playwright — 2-3 критичных e2e-сценария (регистрация → создание объявления → бронь), не больше

## Git-процесс

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `test:`
- Ветки: `feature/*`, `fix/*`, `refactor/*`, слияние в `develop`, релизы в `main`
- PR-шаблон с чеклистом: тесты прошли, линт чист, скриншот если есть UI-изменения
- Даже в соло-разработке история ведётся как в команде — это часть демонстрации в портфолио
