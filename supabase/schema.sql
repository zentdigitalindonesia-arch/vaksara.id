-- VAKSARA Wedding: skema database Supabase (jalankan sekali di SQL Editor).
-- Aman dijalankan ulang: memakai IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.

-- ============ PROFIL PENGGUNA ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'couple' check (role in ('couple','vendor')),
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  city text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists email text not null default '';

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Profil dibuat otomatis saat pendaftaran dari metadata (role, full_name, phone, city).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, email, phone, city)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' = 'vendor' then 'vendor' else 'couple' end,
    left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120),
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data->>'phone', ''), 20),
    left(coalesce(new.raw_user_meta_data->>'city', ''), 80)
  ) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pengguna tidak dapat menjadikan dirinya admin atau mengganti peran (SQL Editor pemilik tetap boleh).
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.is_admin := old.is_admin;
    new.role := old.role;
    new.email := old.email;
  end if;
  return new;
end $$;
drop trigger if exists guard_profile on public.profiles;
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- ============ PROFIL LAYANAN PELAKU BUDAYA ============
create table if not exists public.vendor_listings (
  id uuid primary key references public.profiles(id) on delete cascade,
  name text not null check (length(name) between 3 and 120),
  category text not null default '',
  area text not null default '',
  description text not null default '' check (length(description) <= 2000),
  price_from bigint check (price_from is null or price_from between 0 and 1000000000),
  whatsapp text not null default '',
  instagram text not null default '',
  tiktok text not null default '',
  facebook text not null default '',
  published boolean not null default true,
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  review_note text not null default '',
  identity_ok boolean not null default false,
  culture_ok boolean not null default false,
  consent_ok boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists vendor_listings_name_key on public.vendor_listings (lower(name));

-- Hasil peninjauan hanya dapat diubah admin. Perubahan profil oleh pelaku mengembalikan status ke "pending"
-- bila sebelumnya ditolak, agar dapat ditinjau ulang.
create or replace function public.guard_listing() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.review_status := 'pending'; new.review_note := '';
      new.identity_ok := false; new.culture_ok := false; new.consent_ok := false;
    else
      new.identity_ok := old.identity_ok; new.culture_ok := old.culture_ok; new.consent_ok := old.consent_ok;
      new.review_note := old.review_note;
      new.review_status := case when old.review_status = 'rejected' then 'pending' else old.review_status end;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_listing on public.vendor_listings;
create trigger guard_listing before insert or update on public.vendor_listings
  for each row execute function public.guard_listing();

alter table public.vendor_listings enable row level security;
drop policy if exists listings_public on public.vendor_listings;
create policy listings_public on public.vendor_listings for select to anon, authenticated
  using ((published and review_status = 'approved') or id = auth.uid() or public.is_admin());
drop policy if exists listings_insert on public.vendor_listings;
create policy listings_insert on public.vendor_listings for insert to authenticated
  with check (id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'vendor'));
drop policy if exists listings_update on public.vendor_listings;
create policy listings_update on public.vendor_listings for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- ============ DATA PERENCANAAN PRIBADI (rencana, tugas, tamu, anggaran) ============
create table if not exists public.user_state (
  user_id uuid not null references public.profiles(id) on delete cascade,
  key text not null check (key ~ '^vaksara-[a-z0-9-]+$'),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.user_state enable row level security;
drop policy if exists state_own on public.user_state;
create policy state_own on public.user_state for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ KERJA SAMA (dua pihak) ============
create table if not exists public.cooperations (
  id text primary key check (length(id) between 8 and 80),
  couple_id uuid not null references public.profiles(id) on delete cascade,
  vendor_id uuid not null references public.vendor_listings(id) on delete cascade,
  couple_name text not null default '',
  vendor_name text not null default '',
  phase text not null default 'draft',
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cooperations_couple on public.cooperations (couple_id);
create index if not exists cooperations_vendor on public.cooperations (vendor_id);

create or replace function public.guard_cooperation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.couple_id := old.couple_id; new.vendor_id := old.vendor_id; new.created_at := old.created_at;
  end if;
  return new;
end $$;
drop trigger if exists guard_cooperation on public.cooperations;
create trigger guard_cooperation before insert or update on public.cooperations
  for each row execute function public.guard_cooperation();

alter table public.cooperations enable row level security;
drop policy if exists coop_select on public.cooperations;
create policy coop_select on public.cooperations for select to authenticated
  using (couple_id = auth.uid() or vendor_id = auth.uid() or public.is_admin());
drop policy if exists coop_insert on public.cooperations;
create policy coop_insert on public.cooperations for insert to authenticated
  with check (couple_id = auth.uid() and exists (
    select 1 from public.vendor_listings v where v.id = vendor_id and v.published and v.review_status = 'approved'));
drop policy if exists coop_update on public.cooperations;
create policy coop_update on public.cooperations for update to authenticated
  using (couple_id = auth.uid() or vendor_id = auth.uid()) with check (couple_id = auth.uid() or vendor_id = auth.uid());

-- ============ PERMINTAAN TERBUKA (keluarga memasang, pelaku menanggapi) ============
create table if not exists public.open_requests (
  id text primary key check (length(id) between 4 and 80),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  family text not null default '',
  category text not null default '',
  title text not null check (length(title) between 5 and 200),
  event_date text not null default '',
  location text not null default '',
  budget text not null default '',
  detail text not null default '' check (length(detail) <= 2000),
  status text not null default 'open' check (status in ('open','closed')),
  chosen text,
  case_id text,
  created_at timestamptz not null default now()
);
alter table public.open_requests enable row level security;
drop policy if exists req_select on public.open_requests;
create policy req_select on public.open_requests for select to authenticated
  using (owner_id = auth.uid() or public.is_admin() or (status = 'open' and exists (
    select 1 from public.vendor_listings v where v.id = auth.uid() and v.review_status = 'approved')));
drop policy if exists req_insert on public.open_requests;
create policy req_insert on public.open_requests for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists req_update on public.open_requests;
create policy req_update on public.open_requests for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists req_delete on public.open_requests;
create policy req_delete on public.open_requests for delete to authenticated using (owner_id = auth.uid());

create table if not exists public.open_request_responses (
  id text primary key,
  request_id text not null references public.open_requests(id) on delete cascade,
  vendor_id uuid not null default auth.uid() references public.vendor_listings(id) on delete cascade,
  vendor_name text not null default '',
  note text not null check (length(note) between 5 and 2000),
  price bigint not null check (price between 0 and 1000000000),
  created_at timestamptz not null default now(),
  unique (request_id, vendor_id)
);
alter table public.open_request_responses enable row level security;
drop policy if exists resp_select on public.open_request_responses;
create policy resp_select on public.open_request_responses for select to authenticated
  using (vendor_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.open_requests r where r.id = request_id and r.owner_id = auth.uid()));
drop policy if exists resp_insert on public.open_request_responses;
create policy resp_insert on public.open_request_responses for insert to authenticated
  with check (vendor_id = auth.uid()
    and exists (select 1 from public.vendor_listings v where v.id = auth.uid() and v.review_status = 'approved')
    and exists (select 1 from public.open_requests r where r.id = request_id and r.status = 'open'));
drop policy if exists resp_update on public.open_request_responses;
create policy resp_update on public.open_request_responses for update to authenticated
  using (vendor_id = auth.uid()) with check (vendor_id = auth.uid());

-- ============ HAK AKSES API ============
grant usage on schema public to anon, authenticated;
grant select on public.vendor_listings to anon;
grant select, insert, update, delete on
  public.profiles, public.vendor_listings, public.user_state, public.cooperations,
  public.open_requests, public.open_request_responses to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
