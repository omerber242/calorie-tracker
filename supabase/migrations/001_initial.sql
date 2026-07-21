-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Japan Trip Expense Tracker

-- ─── Expenses ────────────────────────────────────────────────────────────────
create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  date            date not null default current_date,
  category        text not null default 'other'
                  check (category in ('food', 'transport', 'lodging', 'shopping', 'activities', 'other')),
  amount_jpy      numeric(12,2) not null,
  payment_method  text not null default 'cash' check (payment_method in ('cash', 'card')),
  description     text,
  created_at      timestamptz default now()
);

alter table public.expenses enable row level security;

create policy "Allow all for expenses"
  on public.expenses for all
  using (true)
  with check (true);

create index expenses_date_idx on public.expenses (date desc);

-- ─── Trip budget (single settings row) ───────────────────────────────────────
create table public.trip_budget (
  id                 uuid primary key default gen_random_uuid(),
  start_date         date,
  end_date           date,
  total_budget_jpy   numeric(12,2) not null default 0,
  exchange_rate      numeric(10,6) not null default 0.024,
  category_budgets   jsonb not null default '{"food":0,"transport":0,"lodging":0,"shopping":0,"activities":0,"other":0}'::jsonb,
  updated_at         timestamptz default now()
);

alter table public.trip_budget enable row level security;

create policy "Allow all for trip_budget"
  on public.trip_budget for all
  using (true)
  with check (true);
