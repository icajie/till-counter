# Till Counter v2

AUD cash till counting app. Built with Next.js + Vercel Postgres.

## Features
1. Opening balance auto-carried from yesterday's closing
2. Today's sales value input
3. Petty cash taken out before counting
4. Bank run taken out after counting
5. Closer name recorded on every save
6. All AUD notes ($5–$100) and coins (5c–$2)
7. Coin rolls for all denominations
8. Cloud sync — saved to Postgres, works on all devices

## Project Structure
```
├── app/
│   ├── layout.js
│   ├── page.js
│   └── api/
│       ├── records/route.js
│       └── draft/route.js
├── components/
│   └── TillCounter.js
├── lib/
│   └── migrate.js
├── package.json
├── next.config.js
├── jsconfig.json
└── vercel.json
```

## Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Till Counter v2"
git remote add origin https://github.com/YOUR_USERNAME/till-counter.git
git branch -M main
git push -u origin main
```

### Step 2 — Deploy
1. Go to https://vercel.com/new
2. Import your repo
3. ⚠️ Leave Root Directory **blank**
4. Click Deploy

### Step 3 — Add Postgres Database
1. Vercel dashboard → your project → **Storage**
2. Create Database → **Neon Postgres** → Create & Connect

### Step 4 — Run Migration (Windows)
```cmd
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
npm install
node lib/migrate.js
```

### Step 5 — Redeploy
```cmd
git add .
git commit -m "deploy"
git push
```

## Local Development
```cmd
npm install
vercel env pull .env.local
npm run dev
```
Open http://localhost:3000
