-- Drop existing tables
drop table if exists public.intake_logs cascade;
drop table if exists public.treatments cascade;
drop table if exists public.products cascade;

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- Treatments
create table public.treatments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('medication','supplement')),
  source text not null check (source in ('manual','woo')),
  woo_product_id text,
  woo_product_image text,
  frequency_per_day integer not null check (frequency_per_day >= 0),
  units_per_intake integer not null check (units_per_intake >= 0),
  unit_label text not null,
  meal_condition text not null check (meal_condition in ('before','after','none')),
  times jsonb not null,
  start_date date not null,
  end_date date,
  notes text,
  package_size integer check (package_size >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Intake logs
create table public.intake_logs (
  id uuid primary key default gen_random_uuid(),
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null check (status in ('pending','taken','skipped','missed','snoozed')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_treatments_user_id on public.treatments(user_id);
create index idx_intake_logs_treatment_scheduled on public.intake_logs(treatment_id, scheduled_at);
create index idx_intake_logs_scheduled_at on public.intake_logs(scheduled_at);
create index idx_intake_logs_status_pending on public.intake_logs(status) where status = 'pending';

-- Auto-update updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql security definer as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_treatments
  before update on public.treatments
  for each row execute function public.set_updated_at();

create trigger set_updated_at_intake_logs
  before update on public.intake_logs
  for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.treatments enable row level security;
alter table public.intake_logs enable row level security;

-- Treatments policies
create policy "select own treatments"
  on public.treatments for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "insert own treatments"
  on public.treatments for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "update own treatments"
  on public.treatments for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "delete own treatments"
  on public.treatments for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Intake logs policies
create policy "select own logs"
  on public.intake_logs for select to authenticated
  using (
    exists (
      select 1 from public.treatments t
      where t.id = treatment_id
        and t.user_id = (select auth.uid())
    )
  );

create policy "insert own logs"
  on public.intake_logs for insert to authenticated
  with check (
    exists (
      select 1 from public.treatments t
      where t.id = treatment_id
        and t.user_id = (select auth.uid())
    )
  );

create policy "update own logs"
  on public.intake_logs for update to authenticated
  using (
    exists (
      select 1 from public.treatments t
      where t.id = treatment_id
        and t.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.treatments t
      where t.id = treatment_id
        and t.user_id = (select auth.uid())
    )
  );

create policy "delete own logs"
  on public.intake_logs for delete to authenticated
  using (
    exists (
      select 1 from public.treatments t
      where t.id = treatment_id
        and t.user_id = (select auth.uid())
    )
  );

-- Products table
create table public.products (
  id text primary key,
  name text not null,
  sku text not null,
  image text not null default '',
  price numeric(10,2) not null default 0,
  currency text not null default 'RON',
  units_per_package integer not null default 0,
  unit_label text not null default '',
  category text not null default '',
  description text not null default '',
  url text not null default '',
  units_per_intake integer not null default 1,
  frequency_per_day integer not null default 1,
  days_remaining integer not null default 0,
  total_days integer not null default 30
);

alter table public.products enable row level security;

create policy "Products readable by authenticated users"
  on public.products for select to authenticated
  using (true);

-- Insert produse
insert into public.products
  (id, name, sku, image, price, currency, units_per_package, unit_label,
   category, description, url, units_per_intake, frequency_per_day, days_remaining, total_days)
values
  ('58278', '5-HTP 100 mg, 30 capsule', '5HTP',
   'https://zenyth.work/staging120426/wp-content/uploads/2021/08/5-HTP-Fara-reflexie-96DPI.jpg',
   60, 'RON', 30, 'capsule', '', 'Vezi detalii pe site.',
   'https://zenyth.work/staging120426/produse/5-htp-100-mg/', 1, 1, 11, 30),

  ('41525', 'Acerola BIO 400 mg, 60 capsule', 'BIOACR60CPS',
   'https://zenyth.work/staging120426/wp-content/uploads/2016/03/Bio-Acerola-Capsule-Fara-reflexie-96DPI-1.jpg',
   95, 'RON', 60, 'capsule', '', 'Vezi detalii pe site.',
   'https://zenyth.work/staging120426/produse/bio-acerola-60-capsule-x-400-mg/', 1, 1, 21, 60),

  ('5660', 'Acid Alfa Lipoic 250 mg, 60 capsule', 'ALA60CPS',
   'https://zenyth.work/staging120426/wp-content/uploads/2016/03/Alpha-Lipoic-Acid-Fara-reflexie-96DPI.jpg',
   95, 'RON', 60, 'capsule', '', 'Vezi detalii pe site.',
   'https://zenyth.work/staging120426/produse/alpha-lipoic-acid/', 1, 1, 21, 60),

  ('54693', 'Acid hialuronic si Colagen complex, 30 capsule', 'HYACD30CPS',
   'https://zenyth.work/staging120426/wp-content/uploads/2020/05/Hyaluronic-Acid-NEW-30-CPS-Fara-reflexie-96DPI.jpg',
   39, 'RON', 30, 'capsule', '', 'Vezi detalii pe site.',
   'https://zenyth.work/staging120426/produse/hyaluronic-acid-30-capsule/', 1, 1, 11, 30),

  ('40906', 'Acid hialuronic si Colagen complex, 60 capsule', 'HYACD60CPS',
   'https://zenyth.work/staging120426/wp-content/uploads/2018/04/Hyaluronic-Acid-60-CPS-Fara-reflexie-96DPI.jpg',
   46, 'RON', 60, 'capsule', '', 'Vezi detalii pe site.',
   'https://zenyth.work/staging120426/produse/hyaluronic-acid-with-collagen-complex-60-cps-700-mg/', 1, 1, 21, 60),

  ('57265', 'AdaptoHelp Complex, 30 capsule', 'ADAPTHELP30',
   'https://zenyth.work/staging120426/wp-content/uploads/2021/01/AdaptoHelp-Fara-reflexie-96DPI.jpg',
   88, 'RON', 30, 'capsule', '', 'Vezi detalii pe site.',
   'https://zenyth.work/staging120426/produse/adaptohelp-complex/', 1, 1, 11, 30),

  ('54542', 'Andrographis, 30 capsule', 'ANDRO30CPS',
   'https://zenyth.work/staging120426/wp-content/uploads/2020/04/Andrographis-Fara-reflexie-96DPI.jpg',
   53, 'RON', 30, 'capsule', '', 'Vezi detalii pe site.',
   'https://zenyth.work/staging120426/produse/andrographis/', 1, 1, 11, 30),

  ('199449', 'Anorexia si alte tulburari de alimentatie', 'ANOREXTLB',
   'https://zenyth.work/staging120426/wp-content/uploads/2025/05/Eva-Musby-Anorexia-1.png',
   39, 'RON', 0, '', '', 'Vezi detalii pe site.',
   'https://zenyth.work/staging120426/produse/anorexia-si-alte-tulburari-de-alimentatie/', 1, 1, 11, 30),

  ('185494', 'Anti-Aging Support, 30 capsule', 'ANTIAGESUPPORT30CPS',
   'https://zenyth.work/staging120426/wp-content/uploads/2025/03/Anti-Aging-Support-Fara-reflexie-96DPI.jpg',
   67, 'RON', 30, 'capsule', '', 'Vezi detalii pe site.',
   'https://zenyth.work/staging120426/produse/anti-aging-support-30-capsule/', 1, 1, 11, 30),

  ('41484', 'ArtroHelp Forte, 14 plicuri x 5 g', 'AHF14PL',
   'https://zenyth.work/staging120426/wp-content/uploads/2018/09/ArtroHelp-Forte-14-plicuri-Fata-96-DPI.jpg',
   60, 'RON', 14, 'plicuri', '', 'Vezi detalii pe site.',
   'https://zenyth.work/staging120426/produse/artrohelp-forte-14plicuri-x-5-g-pulbere/', 1, 1, 5, 14)

on conflict (id) do nothing;
