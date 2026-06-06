# CalTrack — Food & Calorie Tracker

A full-stack PWA for tracking food, calories, and macros with AI-powered recipe analysis.

## Features

- **Food search** — searches USDA's 700,000+ food database; auto-scales macros to your portion size
- **Recipe analyzer** — paste text or upload a photo; Claude AI breaks down every ingredient
- **Smart goal setting** — enter a protein target (e.g. 150g/day) and it calculates calories, carbs, and fat automatically using your TDEE
- **History** — full food log browsable by date, persistent via Supabase
- **PWA** — installable on iOS/Android from the browser; works offline for log viewing

---

## Stack

| Layer | Tech |
|---|---|
| Frontend + API | Next.js 15 (App Router) |
| Database + Auth | Supabase (Postgres + Auth) |
| Nutrition data | USDA FoodData Central API |
| Recipe AI | Anthropic Claude (claude-opus-4-6) |
| Styling | Tailwind CSS |

---

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `supabase/migrations/001_initial.sql` → Run
3. Copy your **Project URL** and **anon key** from Settings → API

### 2. USDA API Key

1. Request a free key at [fdc.nal.usda.gov/api-guide.html](https://fdc.nal.usda.gov/api-guide.html)
2. Takes ~1 minute via email

### 3. Anthropic API Key

1. Create an account at [console.anthropic.com](https://console.anthropic.com)
2. Generate an API key under API Keys

### 4. Environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your three keys
```

### 5. Run locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 6. Deploy (Vercel — recommended)

```bash
npm install -g vercel
vercel
# Add environment variables in the Vercel dashboard
```

---

## Usage

### Adding food
- Tap **+ Add Food** or the **+** next to a meal section
- Search the USDA database (e.g. "chicken breast") or enter manually
- Set serving size in grams — macros update automatically

### Analyzing a recipe
- Go to **Recipes** → paste a recipe or ingredient list, OR upload a photo
- Claude returns a full ingredient breakdown with per-serving macros
- Save the recipe and log servings directly to today's log

### Setting goals
- Go to **Goals** → enter your stats (weight, height, age, activity)
- Choose a goal type (weight loss / maintenance / muscle gain / custom)
- Enter a **protein target** (e.g. 150g) and hit **Calculate** — calories, carbs, and fat are filled in automatically
- Dashboard rings show your daily progress

---

## App structure

```
src/
  app/
    page.tsx              # Dashboard (today's macros + meals)
    log/page.tsx          # Full date-browsable food log
    goals/page.tsx        # Goal setting + TDEE calculator
    recipes/page.tsx      # Recipe analyzer + saved recipes
    auth/page.tsx         # Login / signup
    api/
      food/search/        # USDA search
      food/details/       # USDA nutrient details + scaling
      recipe/analyze/     # Claude vision + text recipe breakdown
      log/                # Food log CRUD
      goals/              # Goals CRUD + macro calculation
      recipes/            # Saved recipes CRUD
  components/
    Navigation.tsx        # Top nav (desktop) + bottom tab bar (mobile)
    MacroRings.tsx        # SVG progress rings
    AddFoodModal.tsx      # Food search + manual entry modal
  lib/
    supabase/             # Browser + server clients
    calculations.ts       # TDEE, macro calc, sumMacros
  types/index.ts
supabase/
  migrations/001_initial.sql
```
