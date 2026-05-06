# מעקב הוצאות — Variable Expense Tracker

A production-ready, Hebrew (RTL), mobile-first personal expense tracker.
Built to run as a web app **and** as an Android APK.

- **Frontend:** Next.js 14 (App Router) + Tailwind + Recharts + Framer Motion
- **Backend:** Next.js API Routes
- **Auth:** Supabase Auth (email + password)
- **Database:** PostgreSQL (Supabase) via Prisma
- **Mobile:** Capacitor (Android)

The app is multi-tenant — every record is scoped by `userId`, and every API
route enforces it.

---

## 🗂️ Project structure

```
.
├── prisma/
│   ├── schema.prisma           # Postgres schema (User, Expense, MonthlyBudget…)
│   └── seed.ts                 # Demo data seeder
├── src/
│   ├── app/
│   │   ├── api/                # /api/expenses, /api/budget, /api/analytics …
│   │   ├── login/, register/   # Supabase auth screens
│   │   ├── add/, history/,
│   │   │   analytics/, budget/ # Main app pages
│   │   ├── layout.tsx          # RTL + theme + auth providers
│   │   ├── page.tsx            # Dashboard
│   │   └── globals.css         # Design tokens (light/dark)
│   ├── components/             # AppShell, charts, toasts, etc.
│   ├── lib/
│   │   ├── api.ts              # Smart base-URL resolver + Bearer auth
│   │   ├── platform.ts         # Capacitor / browser / server detection
│   │   ├── supabase/           # Server & browser Supabase clients
│   │   ├── auth.ts             # withUser() — auth + lazy provisioning
│   │   ├── prisma.ts           # PrismaClient singleton
│   │   ├── validation.ts       # zod schemas
│   │   └── …                   # categories, dates, formatters
│   ├── types/dto.ts            # Shared API response types
│   └── middleware.ts           # Auth gate + cookie refresh
├── capacitor.config.ts         # Android shell config
├── next.config.js              # Static export when BUILD_MODE=export
├── package.json
├── tailwind.config.ts
└── .env.example
```

---

## 1) Run locally

### Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com/) project

### Steps

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# DATABASE_URL, DIRECT_URL.

# 3. Generate Prisma client + push schema to Supabase
npx prisma generate
npx prisma migrate dev --name init

# 4. (Optional) Seed demo data
#    a. Create a user in Supabase Auth (Dashboard → Authentication → Add user)
#    b. Copy that user's UUID, then:
SEED_USER_ID=<uuid> SEED_USER_EMAIL=demo@example.com npm run prisma:seed

# 5. Run the dev server
npm run dev
# → open http://localhost:3000
```

Sign up at `/register` or sign in at `/login` (use the demo account if seeded).

---

## 2) Connect Supabase

1. Create a project at <https://supabase.com>.
2. **Authentication → Providers** — leave **Email** enabled.
   - For local development you may want to **disable** "Confirm email" so test
     accounts can log in immediately.
3. **Project Settings → API** — copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Project Settings → Database → Connection string**:
   - Pooled (port `6543`) → `DATABASE_URL` — append `?pgbouncer=true&connection_limit=1`.
   - Direct (port `5432`) → `DIRECT_URL` — used only by Prisma migrations.
5. Apply migrations: `npx prisma migrate deploy`.

> **Row-level security note:** Because all DB access goes through the server
> (Prisma + a service-grade connection), and every API route is wrapped with
> `withUser()` which scopes queries by the authenticated `userId`, you don't
> *need* Supabase RLS for app-level security. If you want a defense-in-depth
> layer you can enable RLS on the `expenses`, `monthly_budgets`, and
> `user_preferences` tables and add policies like
> `userId = auth.uid()`.

---

## 3) Deploy to Vercel

1. Push the repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. **Framework Preset:** Next.js. **Build command:** `npm run build`.
4. Add the same env vars from `.env.local` in Vercel → Project → Settings →
   Environment Variables. Set them for **Production** and **Preview**.
5. Add a **post-build** step: in `package.json` you can change `build` to
   `prisma generate && next build` if you want Prisma to regenerate on every
   deploy. (Vercel runs `npm install` which already runs `postinstall`
   hooks — see below.)
6. Deploy.

The first time you deploy, also run migrations against the production DB:

```bash
DATABASE_URL=<prod-pooled-url> DIRECT_URL=<prod-direct-url> \
  npx prisma migrate deploy
```

---

## 4) Build the Android APK with Capacitor

The web app ships **server-rendered API routes** for the browser/Vercel
build, but Capacitor needs a **static** bundle to package. The build script
flips into static-export mode automatically:

```bash
# 1. Build the static web bundle (Next.js exports to ./out)
npm run build:static

# 2. (First time only) add the Android platform
npm run cap:add:android

# 3. Sync the static bundle into android/app/src/main/assets/public
npm run cap:sync
```

You should now have an `android/` folder.

### Configure the API base URL for the APK

Inside the APK there's no localhost and no relative origin — every API call
must hit your deployed Vercel URL. The smart resolver in
`src/lib/api.ts` reads `NEXT_PUBLIC_API_BASE_URL` and uses it **only when
running inside Capacitor**.

Before running `npm run build:static`, set:

```bash
export NEXT_PUBLIC_API_BASE_URL="https://your-app.vercel.app"
```

(or put it in a `.env.production` file in the project root).

### Build the APK in Android Studio

```bash
npm run cap:open:android
```

Android Studio opens. Then:

1. Wait for Gradle sync to finish.
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. The APK is written to
   `android/app/build/outputs/apk/debug/app-debug.apk`.
4. Transfer the APK to your phone (USB / cloud drive) and install.

> **Headless build:** `npm run android:build` runs `gradlew assembleDebug` for you.

### Allow your APK to call the API (CORS)

Vercel allows cross-origin fetches from any origin by default for API routes
that don't set restrictive headers, but Capacitor requests on Android use the
`https://localhost` (or `capacitor://localhost`) origin. Two options:

- **Recommended:** the app already attaches a Bearer JWT to every API call,
  so cookies aren't needed and Vercel's default CORS works out of the box.
- If you ever want to allow **credentialed** cross-origin requests, add a
  Next.js middleware that emits
  `Access-Control-Allow-Origin: https://localhost` and
  `Access-Control-Allow-Credentials: true` on `/api/*`.

### Building a signed release APK / AAB

1. Generate a keystore:
   ```bash
   keytool -genkey -v -keystore release.keystore -alias expenses \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. In `android/app/build.gradle` add a `signingConfigs.release` block pointing
   to that keystore.
3. **Build → Generate Signed Bundle / APK** in Android Studio, choose the
   keystore, and Android Studio will produce a release-signed `.aab` you can
   upload to the Play Console.

---

## 🧪 Useful scripts

| Command                       | What it does                                   |
| ----------------------------- | ---------------------------------------------- |
| `npm run dev`                 | Start Next.js in dev mode                      |
| `npm run build`               | Production build (SSR — for Vercel)            |
| `npm run build:static`        | Static export (for Capacitor APK)              |
| `npm run start`               | Serve the production SSR build                 |
| `npm run typecheck`           | Run `tsc --noEmit`                             |
| `npm run prisma:generate`     | Regenerate the Prisma client                   |
| `npm run prisma:migrate`      | Create + apply a dev migration                 |
| `npm run prisma:deploy`       | Apply pending migrations (CI / prod)           |
| `npm run prisma:seed`         | Seed demo data (needs `SEED_USER_ID`)          |
| `npm run cap:add:android`     | Scaffold the Android project (one-time)        |
| `npm run cap:sync`            | Build + push the web bundle into android/      |
| `npm run cap:open:android`    | Open the Android project in Android Studio     |
| `npm run android:build`       | Build a debug APK end-to-end via Gradle        |

---

## 🔒 Multi-tenancy at a glance

Every API route wraps its handler with `withUser()`, which:

1. Reads the user from the request — either via the Supabase **cookie session**
   (browser) or via an `Authorization: Bearer <jwt>` header (Capacitor).
2. Lazily upserts a `User` row keyed by the Supabase auth UUID.
3. Hands the handler a `{ user }` context, and every Prisma query is scoped
   with `userId: user.id`.

There is no path in the codebase that returns expenses without the `userId`
filter.

---

## 📦 Categories (fixed enum + custom name for "Other")

```
SUPERMARKET   סופרמרקט
GROCERY       מכולת
EATING_OUT    אוכל בחוץ
CLOTHING      ביגוד והנעלה
VACATIONS     חופשות
STOCK_MISC    חנויות שונות
OTHER         אחר   ← user-supplied name in `customCategory`
```

---

## 🎨 Theming

Light mode is default. Toggle is in the top bar (sun/moon button). Theme is
persisted via `next-themes` (localStorage) and applied via a `class="dark"`
on `<html>`. Design tokens live in `src/app/globals.css` as CSS variables
consumed by Tailwind.
