# Smetoplan.ru — строительная SaaS + Programmatic SEO

## Стек
- Next.js 15 App Router (SSR)
- PostgreSQL 16 (Podman)
- Tailwind CSS 4
- Constructix Pro: калькулятор, CAD 3D, BOM, офферы

## Быстрый старт
```bash
npm run db:up
npm install
npm run db:generate-pseo   # корпус unpublished роутов
npm run dev
```

Postgres: `127.0.0.1:5433` (см. `.env.local`).

## Анти-бан PSEO
- `pseo_routes.is_published` + `publish_date`
- Неопубликованное → **404**
- CRON `GET /api/cron/drip-feed` (Bearer `CRON_SECRET`) активирует **200–300** URL/сутки
- `/sitemap.xml` только из опубликованных
- 5 layout-вариантов DOM + скрытие армирования по интенту

## Ключевые пути
| Путь | Назначение |
|------|------------|
| `/kalkulyator/[slug]` | SSR PSEO-калькулятор |
| `/api/cron/drip-feed` | Капельный релиз |
| `/sitemap.xml` | Динамический sitemap |
| `db/migrations/` | materials_dict · calc_formulas · pseo_routes |
