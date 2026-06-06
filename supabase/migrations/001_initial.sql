-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Food Log ────────────────────────────────────────────────────────────────
create table public.food_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  food_name    text not null,
  food_id      text,                          -- USDA fdcId if from search
  meal_type    text default 'snack',          -- breakfast | lunch | dinner | snack
  serving_size numeric(10,2) not null,
  serving_unit text not null default 'g',
  calories     numeric(10,2),
  protein      numeric(10,2),
  carbs        numeric(10,2),
  fat          numeric(10,2),
  fiber        numeric(10,2),
  sugar        numeric(10,2),
  sodium       numeric(10,2),
  notes        text,
  logged_at    timestamptz default now(),
  log_date     date default current_date
);

alter table public.food_log enable row level security;

create policy "Users can manage their own food log"
  on public.food_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index food_log_user_date on public.food_log (user_id, log_date desc);

-- ─── Nutrition Goals ─────────────────────────────────────────────────────────
create table public.nutrition_goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null unique,
  calories     numeric(10,2),
  protein      numeric(10,2),
  carbs        numeric(10,2),
  fat          numeric(10,2),
  fiber        numeric(10,2),
  goal_type    text default 'custom',         -- custom | weight_loss | muscle_gain | maintenance
  activity     text default 'moderate',       -- sedentary | light | moderate | active | very_active
  weight_kg    numeric(6,2),
  height_cm    numeric(6,2),
  age          int,
  sex          text,                          -- male | female
  updated_at   timestamptz default now()
);

alter table public.nutrition_goals enable row level security;

create policy "Users can manage their own goals"
  on public.nutrition_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Recipes (saved analyzed recipes) ────────────────────────────────────────
create table public.recipes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  servings     int default 1,
  ingredients  jsonb,                         -- array of {name, amount, unit, ...macros}
  total_calories numeric(10,2),
  total_protein  numeric(10,2),
  total_carbs    numeric(10,2),
  total_fat      numeric(10,2),
  total_fiber    numeric(10,2),
  source       text default 'text',           -- text | image
  created_at   timestamptz default now()
);

alter table public.recipes enable row level security;

create policy "Users can manage their own recipes"
  on public.recipes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
