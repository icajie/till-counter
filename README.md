# Till Counter

AUD cash till counting app with cloud sync. Built with Next.js + Vercel Postgres.

---

## Features

- Count opening & closing float by denomination
- Cash sales calculated automatically (closing − opening)
- Yesterday's closing auto-carries as today's opening
- Variance tracking against POS expected sales
- Closer's name recorded on every save
- Full history of all saved days
- Cloud sync — works across all devices

---

## Project Structure

```
├── app/
│   ├── layout.js              # Root layout
│   ├── page.js                # Home page
│   └── api/
│       ├── records/route.js   # GET/POST till records
│       └── draft/route.js     # GET/POST auto-save draft
├── components/
│   └── TillCounter.js         # Main UI component
├── lib/
│   └── migrate.js             # DB schema migration
├── package.json
├── next.config.js
├── jsconfig.json
└── vercel.json
```

---

## Deployment (Vercel + Postgres)

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- [Vercel account](https://vercel.com) (free)
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`

---

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/till-counter.git
git branch -M main
git push -u origin main
```

---

### Step 2 — Deploy to Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select your repo
3. ⚠️ Leave **Root Directory blank** (do not set a subdirectory)
4. Click **Deploy** — wait ~60 seconds

---

### Step 3 — Add Postgres Database

1. In Vercel dashboard → open your project → **Storage** tab
2. Click **Create Database** → choose **Neon Postgres**
3. Click **Create & Connect** — Vercel auto-injects all `POSTGRES_*` env vars

---

### Step 4 — Run Database Migration

This creates the `till_records` and `till_drafts` tables.

```bash
npm install -g vercel        # if not already installed
vercel login
vercel env pull .env.local   # pulls your DB credentials locally
npm install
node lib/migrate.js
```

You should see: `✅ Migration complete.`

---

### Step 5 — Redeploy

```bash
vercel --prod
```

Or push any commit to `main` — Vercel auto-deploys on every push.

---

## Local Development

```bash
npm install
vercel env pull .env.local   # pulls Postgres credentials from Vercel
npm run dev                  # runs at http://localhost:3000
```

---

## Environment Variables

These are automatically injected by Vercel when you connect a Postgres database. You do not need to set them manually in production.

| Variable | Description |
|---|---|
| `POSTGRES_URL` | Postgres connection string |
| `POSTGRES_USER` | Database user |
| `POSTGRES_HOST` | Database host |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DATABASE` | Database name |

For local dev, run `vercel env pull .env.local` to get them automatically.

---

## Access & Security

Anyone with the Vercel URL can use the app. For password protection, you can enable [Vercel Authentication](https://vercel.com/docs/security/deployment-protection) in your project settings — no code changes needed.
