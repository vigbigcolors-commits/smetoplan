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
- **ALWAYS gate** (`src/lib/pseo-quality.ts`): уникальный fingerprint + live snapshot (объём, FAQ≥4, регион)
- В индекс только `quality_status='ok'` (sitemap / getPublished / drip)
- Без региона → `missing_region` (отключить только `PSEO_REQUIRE_REGION=0`)
- Тонкий/дубль/слабый FAQ → `rejected`, не в sitemap
- SSR-блок обязателен; fail gate → **404 + noindex**
- Хабы всегда с живыми ссылками (демо + калькулятор), даже до drip
- Миграции: `005_pseo_quality_status.sql`, `006_pseo_content_fingerprint.sql`

### Поднять корпус локально
```bash
npm run db:up
npm run db:migrate
npm run db:generate-pseo   # или npm run pseo:bootstrap
npm run pseo:drip          # первая пачка через gate
# ежедневно: npm run cron:drip  (нужен Next + CRON_SECRET)
```

## Ключевые пути
| Путь | Назначение |
|------|------------|
| `/kalkulyator` | Основной калькулятор (`?type=slab|strip|beam|pier|wall`) |
| `/kalkulyator/[slug]` | PSEO landing (SEO drip, не UI-навигация) |
| `/api/cron/drip-feed` | Капельный релиз |
| `/sitemap.xml` | Динамический sitemap |
| `db/migrations/` | materials_dict · calc_formulas · pseo_routes |
