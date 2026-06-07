-- Workspace Reservation App Tables

-- ─── Workstations ──────────────────────────────────────────────────────────
create table public.workstations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  location    text,
  created_at  timestamptz default now()
);

alter table public.workstations enable row level security;

create policy "Allow all for workstations"
  on public.workstations for all
  using (true)
  with check (true);

-- ─── Reservations ──────────────────────────────────────────────────────────
create table public.reservations (
  id               uuid primary key default gen_random_uuid(),
  workstation_id   uuid not null references public.workstations(id) on delete cascade,
  person_name      text not null,
  date             date not null,
  created_at       timestamptz default now(),
  unique (workstation_id, date)
);

alter table public.reservations enable row level security;

create policy "Allow all for reservations"
  on public.reservations for all
  using (true)
  with check (true);

create index reservations_date_idx on public.reservations (date);
create index reservations_workstation_date_idx on public.reservations (workstation_id, date);
