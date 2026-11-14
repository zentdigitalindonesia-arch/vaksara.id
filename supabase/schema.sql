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

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
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
-- bila sebelumnya ditolak, atau bila profil yang sudah disetujui mengubah isi yang diperiksa peninjau
-- (nama, kategori, wilayah, deskripsi, kontak), agar verifikasi tidak dapat dilewati setelah lolos sekali.
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
      if old.review_status = 'rejected' then
        new.review_status := 'pending';
      elsif old.review_status = 'approved' and (
        new.name is distinct from old.name or new.category is distinct from old.category or
        new.area is distinct from old.area or new.description is distinct from old.description or
        new.whatsapp is distinct from old.whatsapp or new.instagram is distinct from old.instagram or
        new.tiktok is distinct from old.tiktok or new.facebook is distinct from old.facebook) then
        new.review_status := 'pending';
        -- Hasil pemeriksaan lama dipertahankan agar kerja sama yang sedang berjalan tidak terhenti;
        -- profil tersembunyi dari direktori dan permintaan baru sampai peninjau menyetujui ulang.
        new.review_note := 'Profil diubah setelah disetujui; menunggu peninjauan ulang.';
      else
        new.review_status := old.review_status;
      end if;
    end if;
  elsif auth.uid() is not null and tg_op = 'UPDATE' and new.review_status = 'approved' and old.review_status is distinct from 'approved' then
    -- Peninjau menyetujui: KTP, verifikasi wajah, dan minimal 2 foto kegiatan wajib sudah diunggah pelaku.
    if not exists (select 1 from public.documents d where d.user_id = new.id and d.kind = 'ktp') then
      raise exception 'Dokumen belum lengkap: KTP penanggung jawab belum diunggah.';
    elsif not exists (select 1 from public.documents d where d.user_id = new.id and d.kind = 'face') then
      raise exception 'Dokumen belum lengkap: verifikasi wajah belum dilakukan.';
    elsif (select count(*) from public.documents d where d.user_id = new.id and d.kind = 'portfolio') < 2 then
      raise exception 'Dokumen belum lengkap: minimal 2 foto kegiatan diperlukan.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_listing on public.vendor_listings;
create trigger guard_listing before insert or update on public.vendor_listings
  for each row execute function public.guard_listing();

alter table public.vendor_listings enable row level security;
drop policy if exists listings_public on public.vendor_listings;
-- Tabel ini memuat catatan dan hasil pemeriksaan internal, jadi hanya terbaca oleh pemilik profil dan peninjau.
-- Pengunjung dan akun lain membaca direktori lewat view public.vendor_directory (kolom publik saja).
create policy listings_public on public.vendor_listings for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists listings_insert on public.vendor_listings;
create policy listings_insert on public.vendor_listings for insert to authenticated
  with check (id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'vendor'));
drop policy if exists listings_update on public.vendor_listings;
create policy listings_update on public.vendor_listings for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create or replace function public.is_listed(p_vendor uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vendor_listings where id = p_vendor and published and review_status = 'approved');
$$;
grant execute on function public.my_role() to authenticated;
grant execute on function public.is_listed(uuid) to anon, authenticated;

-- Direktori publik: hanya profil yang disetujui dan ditampilkan, tanpa catatan dan hasil pemeriksaan internal.
create or replace view public.vendor_directory as
  select id, name, category, area, description, price_from, whatsapp, instagram, tiktok, facebook, created_at, updated_at
  from public.vendor_listings where published and review_status = 'approved';
revoke all on public.vendor_directory from anon, authenticated;
grant select on public.vendor_directory to anon, authenticated;

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
  -- Nama pihak diambil dari profil dan profil layanan, bukan dari isian browser.
  if tg_op = 'INSERT' then
    new.couple_name := coalesce((select full_name from public.profiles where id = new.couple_id), '');
    new.vendor_name := coalesce((select name from public.vendor_listings where id = new.vendor_id), '');
  else
    new.couple_name := old.couple_name; new.vendor_name := old.vendor_name;
    -- Keluarga menyetujui perjanjian hanya setelah KTP salah satu anggota keluarga diunggah.
    if coalesce((new.data->'approvals'->>'couple')::boolean, false) and not coalesce((old.data->'approvals'->>'couple')::boolean, false)
       and not exists (select 1 from public.documents d where d.user_id = new.couple_id and d.kind = 'ktp') then
      raise exception 'Unggah KTP salah satu anggota keluarga sebelum menyetujui perjanjian.';
    end if;
  end if;
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
  with check (couple_id = auth.uid() and phase = 'draft' and public.my_role() = 'couple' and public.is_listed(vendor_id));
drop policy if exists coop_update on public.cooperations;
-- Peninjau (is_admin) perlu menulis untuk mencatat mediasi sengketa.
create policy coop_update on public.cooperations for update to authenticated
  using (couple_id = auth.uid() or vendor_id = auth.uid() or public.is_admin())
  with check (couple_id = auth.uid() or vendor_id = auth.uid() or public.is_admin());

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
create policy req_insert on public.open_requests for insert to authenticated with check (owner_id = auth.uid() and public.my_role() = 'couple');
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
create or replace function public.guard_response() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.vendor_name := coalesce((select name from public.vendor_listings where id = new.vendor_id), '');
  return new;
end $$;
drop trigger if exists guard_response on public.open_request_responses;
create trigger guard_response before insert or update on public.open_request_responses
  for each row execute function public.guard_response();
drop policy if exists resp_update on public.open_request_responses;
create policy resp_update on public.open_request_responses for update to authenticated
  using (vendor_id = auth.uid()) with check (vendor_id = auth.uid());

-- ============ PEMBERITAHUAN (lonceng aplikasi + email) ============
-- Pemicu di database mencatat kejadian penting untuk pihak yang perlu tahu. Pihak yang melakukan tindakan
-- tidak diberi tahu tentang tindakannya sendiri. Email dikirim Edge Function "notify-email" (lihat
-- supabase/PANDUAN-NOTIFIKASI.md) melalui Database Webhook pada tabel ini.
alter table public.profiles add column if not exists email_notifications boolean not null default true;

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  link text not null default '',
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Pengguna hanya dapat membaca miliknya dan menandai dibaca; pemberitahuan dibuat oleh pemicu, bukan oleh browser.
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select p_user, p_kind, left(p_title, 200), left(coalesce(p_body, ''), 500), coalesce(p_link, '')
  where p_user is not null and exists (select 1 from public.profiles where id = p_user);
$$;
create or replace function public.notify_admins(p_kind text, p_title text, p_body text, p_link text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select id, p_kind, left(p_title, 200), left(coalesce(p_body, ''), 500), coalesce(p_link, '') from public.profiles where is_admin;
$$;
create or replace function public.idr(n bigint) returns text language sql immutable as $$
  select 'Rp' || replace(to_char(coalesce(n, 0), 'FM999,999,999,990'), ',', '.');
$$;
-- Fungsi pemberitahuan tidak boleh dipanggil langsung dari browser (mencegah pemberitahuan palsu).
revoke execute on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.notify_admins(text, text, text, text) from public, anon, authenticated;

-- Profil pelaku: pendaftar baru dan tinjau ulang ke peninjau; hasil peninjauan ke pelaku.
create or replace function public.notify_listing() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify_admins('listing_new', 'Pendaftar baru: ' || new.name, 'Profil pelaku budaya menunggu peninjauan.', 'admin/screening');
  elsif new.review_status is distinct from old.review_status then
    if new.review_status = 'approved' then
      perform public.notify(new.id, 'listing_approved', 'Profil Anda disetujui', 'Profil ' || new.name || ' kini tampil di direktori VAKSARA dan dapat menerima permintaan.', 'vendor/profil');
    elsif new.review_status = 'rejected' then
      perform public.notify(new.id, 'listing_rejected', 'Profil Anda perlu diperbaiki', coalesce(nullif(new.review_note, ''), 'Lihat catatan peninjau di halaman profil.'), 'vendor/profil');
    elsif new.review_status = 'pending' then
      perform public.notify_admins('listing_review', 'Tinjau ulang: ' || new.name,
        case when old.review_status = 'approved' then 'Profil diubah setelah disetujui.' else 'Profil diperbaiki dan diajukan ulang.' end, 'admin/screening');
      if old.review_status = 'approved' then
        perform public.notify(new.id, 'listing_pending', 'Profil Anda ditinjau ulang', 'Profil disembunyikan sementara sampai peninjau menyetujui perubahan. Kerja sama yang berjalan tetap dapat dilanjutkan.', 'vendor/profil');
      end if;
    end if;
  end if;
  return null;
end $$;
drop trigger if exists notify_listing on public.vendor_listings;
create trigger notify_listing after insert or update on public.vendor_listings
  for each row execute function public.notify_listing();

-- Kerja sama: setiap perubahan tahap, versi penawaran, persetujuan, dan pembayaran diberitahukan ke pihak lain.
create or replace function public.notify_cooperation() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  actor text := coalesce(new.data->'history'->-1->>'actor', '');
  fam text := coalesce(nullif(new.couple_name, ''), 'Keluarga');
  ven text := coalesce(nullif(new.vendor_name, ''), 'Pelaku budaya');
  old_ver int := coalesce((old.data->'offer'->>'version')::int, 0);
  new_ver int := coalesce((new.data->'offer'->>'version')::int, 0);
  old_pending int := (select count(*) from jsonb_array_elements(coalesce(old.data->'payments', '[]')) p where p->>'status' = 'pending');
  new_pending int := (select count(*) from jsonb_array_elements(coalesce(new.data->'payments', '[]')) p where p->>'status' = 'pending');
  old_conf int := (select count(*) from jsonb_array_elements(coalesce(old.data->'payments', '[]')) p where p->>'status' = 'confirmed');
  new_conf int := (select count(*) from jsonb_array_elements(coalesce(new.data->'payments', '[]')) p where p->>'status' = 'confirmed');
  old_rej int := (select count(*) from jsonb_array_elements(coalesce(old.data->'payments', '[]')) p where p->>'status' = 'rejected');
  new_rej int := (select count(*) from jsonb_array_elements(coalesce(new.data->'payments', '[]')) p where p->>'status' = 'rejected');
  last_amount bigint := coalesce((new.data->'payments'->-1->>'amount')::bigint, 0);
  note text := coalesce(nullif(new.data->>'reviewNote', ''), '');
  c_title text; c_body text := ''; v_title text; v_body text := ''; a_title text; a_body text := '';
begin
  if new.phase is distinct from old.phase then
    case new.phase
      when 'inquiry' then v_title := 'Permintaan baru dari ' || fam; v_body := left(coalesce(new.data->>'request', ''), 300);
      when 'replied' then
        if old.phase = 'inquiry' then c_title := ven || ' membalas permintaan Anda'; c_body := left(coalesce(new.data->>'reply', ''), 300);
        else v_title := fam || ' meminta revisi penawaran'; v_body := note; end if;
      when 'declined' then c_title := ven || ' menolak permintaan Anda'; c_body := note;
      when 'offered' then c_title := 'Penawaran dari ' || ven || ' (versi ' || new_ver || ')'; c_body := 'Nilai layanan ' || public.idr((new.data->'offer'->>'price')::bigint) || ', DP ' || public.idr((new.data->'offer'->>'deposit')::bigint) || '.';
      when 'contract' then v_title := fam || ' menerima penawaran Anda'; v_body := 'Setujui perjanjian versi ' || new_ver || ' agar kerja sama berlaku.';
      when 'active' then c_title := 'Perjanjian disepakati kedua pihak'; v_title := c_title; c_body := 'Langkah berikutnya: pembayaran DP.'; v_body := 'Tunggu keluarga membayar DP, lalu konfirmasi penerimaannya.';
      when 'running' then c_title := ven || ' memulai pelaksanaan';
      when 'handover' then c_title := ven || ' mengajukan BAST'; c_body := 'Periksa hasil layanan, lalu terima BAST atau minta perbaikan.';
      when 'revision' then v_title := fam || ' meminta perbaikan hasil'; v_body := note;
      when 'accepted' then v_title := fam || ' menerima BAST'; v_body := 'Selesaikan keuangan agar kerja sama dapat ditutup.';
      when 'completed' then c_title := 'Kerja sama dengan ' || ven || ' ditutup'; v_title := 'Kerja sama dengan ' || fam || ' ditutup';
      when 'disputed' then c_title := 'Sengketa diajukan'; v_title := c_title; c_body := note; v_body := note;
        a_title := 'Sengketa menunggu mediasi: ' || fam || ' – ' || ven; a_body := note;
      when 'cancel_pending' then c_title := 'Usulan pembatalan dari ' || ven; v_title := 'Usulan pembatalan dari ' || fam; c_body := note; v_body := note;
      when 'refund_due' then v_title := 'Pembatalan disepakati; catat pengembalian dana'; v_body := 'Refund ' || public.idr((new.data->'cancellation'->>'refund')::bigint) || ' kepada ' || fam || '.';
      when 'refund_sent' then c_title := ven || ' mencatat pengembalian dana'; c_body := 'Konfirmasi bila dana sudah Anda terima.';
      when 'cancelled' then c_title := 'Kerja sama dengan ' || ven || ' dibatalkan'; v_title := 'Kerja sama dengan ' || fam || ' dibatalkan'; c_body := note; v_body := note;
      else null;
    end case;
    if old.phase = 'disputed' and new.phase not in ('cancel_pending', 'cancelled') then
      c_title := 'Mediasi dicatat; kerja sama dilanjutkan'; v_title := c_title; c_body := coalesce(new.data->>'reply', ''); v_body := c_body;
    elsif old.phase = 'cancel_pending' and new.phase not in ('cancelled', 'refund_due') then
      c_title := 'Usulan pembatalan ditolak'; v_title := c_title; c_body := note; v_body := note;
    end if;
  else
    if new.phase = 'offered' and new_ver > old_ver then
      c_title := 'Penawaran baru dari ' || ven || ' (versi ' || new_ver || ')'; c_body := 'Versi sebelumnya tidak berlaku lagi; tinjau ulang sebelum menyetujui.';
    elsif new.phase = 'contract' then
      if coalesce((new.data->'approvals'->>'couple')::boolean, false) and not coalesce((old.data->'approvals'->>'couple')::boolean, false) then
        v_title := fam || ' menyetujui perjanjian'; v_body := 'Giliran Anda menyetujui versi ' || new_ver || '.'; end if;
      if coalesce((new.data->'approvals'->>'vendor')::boolean, false) and not coalesce((old.data->'approvals'->>'vendor')::boolean, false) then
        c_title := ven || ' menyetujui perjanjian'; c_body := 'Giliran Anda menyetujui versi ' || new_ver || '.'; end if;
    end if;
  end if;
  -- Pembayaran (tanpa perubahan tahap).
  if new_pending > old_pending then
    v_title := fam || ' mencatat pembayaran ' || public.idr(last_amount); v_body := 'Periksa rekening Anda, lalu konfirmasi atau tolak catatan ini.';
  elsif new_conf > old_conf and actor = 'vendor' then
    c_title := ven || ' mengonfirmasi pembayaran Anda';
  elsif new_rej > old_rej then
    c_title := ven || ' menolak catatan pembayaran'; c_body := 'Periksa kembali bukti transfer Anda.';
  end if;

  if c_title is not null and actor <> 'couple' then
    perform public.notify(new.couple_id, 'cooperation', c_title, c_body, 'planner/alur?case=' || new.id);
  end if;
  if v_title is not null and actor <> 'vendor' then
    perform public.notify(new.vendor_id, 'cooperation', v_title, v_body, 'vendor/alur?case=' || new.id);
  end if;
  if a_title is not null then
    perform public.notify_admins('dispute', a_title, a_body, 'admin/alur?case=' || new.id);
  end if;
  return null;
end $$;
drop trigger if exists notify_cooperation on public.cooperations;
create trigger notify_cooperation after update on public.cooperations
  for each row execute function public.notify_cooperation();

-- Permintaan terbuka: pelaku terverifikasi di kategori yang sama diberi tahu; keluarga diberi tahu saat ada minat.
create or replace function public.notify_open_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, title, body, link)
  select v.id, 'open_request', left('Permintaan terbuka: ' || new.title, 200),
         left(concat_ws(' · ', nullif(new.category, ''), nullif(new.location, ''), nullif(new.event_date, ''), nullif(new.budget, '')), 500), 'vendor/peluang'
  from public.vendor_listings v
  where v.review_status = 'approved' and v.published and v.id <> new.owner_id and (new.category = '' or v.category = new.category);
  return null;
end $$;
drop trigger if exists notify_open_request on public.open_requests;
create trigger notify_open_request after insert on public.open_requests
  for each row execute function public.notify_open_request();

create or replace function public.notify_open_response() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify(r.owner_id, 'open_response', left(coalesce(nullif(new.vendor_name, ''), 'Pelaku budaya') || ' berminat pada permintaan Anda', 200),
    'Perkiraan harga ' || public.idr(new.price) || '. ' || left(new.note, 300), 'planner/permintaan-terbuka')
  from public.open_requests r where r.id = new.request_id;
  return null;
end $$;
drop trigger if exists notify_open_response on public.open_request_responses;
create trigger notify_open_response after insert on public.open_request_responses
  for each row execute function public.notify_open_response();

-- ============ DOKUMEN VERIFIKASI (KTP, foto kegiatan, NIB, surat rekomendasi, verifikasi wajah) ============
-- Berkas disimpan di bucket privat "verifikasi" dengan folder per akun: <id akun>/<nama berkas>.
-- Hanya pemilik dan peninjau (is_admin) yang dapat membuka. Dibuka lewat tautan bertanda tangan yang kedaluwarsa.
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('ktp', 'portfolio', 'nib', 'recommendation', 'face')),
  path text not null unique check (length(path) between 5 and 300),
  note text not null default '' check (length(note) <= 300),
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists documents_user on public.documents (user_id, kind);
alter table public.documents enable row level security;
drop policy if exists docs_select on public.documents;
create policy docs_select on public.documents for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists docs_insert on public.documents;
create policy docs_insert on public.documents for insert to authenticated
  with check (user_id = auth.uid() and split_part(path, '/', 1) = auth.uid()::text);
drop policy if exists docs_delete on public.documents;
create policy docs_delete on public.documents for delete to authenticated using (user_id = auth.uid());
revoke all on public.documents from anon, authenticated;
grant select, insert, delete on public.documents to authenticated;

-- Batas jumlah: 5 foto kegiatan, 1 untuk jenis lainnya (hapus yang lama untuk mengganti).
create or replace function public.guard_document() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.documents where user_id = new.user_id and kind = new.kind) >= (case when new.kind = 'portfolio' then 5 else 1 end) then
    raise exception 'Batas dokumen jenis ini sudah tercapai. Hapus yang lama untuk mengganti.';
  end if;
  if new.kind = 'face' and public.my_role() is distinct from 'vendor' then
    raise exception 'Verifikasi wajah hanya untuk pelaku budaya.';
  end if;
  return new;
end $$;
drop trigger if exists guard_document on public.documents;
create trigger guard_document before insert on public.documents
  for each row execute function public.guard_document();

-- Pelaku dapat melihat apakah keluarga mitranya sudah mengunggah KTP (tanpa melihat KTP-nya).
create or replace function public.has_ktp(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.documents where user_id = p_user and kind = 'ktp')
    and (p_user = auth.uid() or public.is_admin() or exists (
      select 1 from public.cooperations c where c.couple_id = p_user and c.vendor_id = auth.uid()));
$$;
grant execute on function public.has_ktp(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verifikasi', 'verifikasi', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists verifikasi_insert on storage.objects;
create policy verifikasi_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'verifikasi' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists verifikasi_select on storage.objects;
create policy verifikasi_select on storage.objects for select to authenticated
  using (bucket_id = 'verifikasi' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists verifikasi_delete on storage.objects;
create policy verifikasi_delete on storage.objects for delete to authenticated
  using (bucket_id = 'verifikasi' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============ HAK AKSES API ============
grant usage on schema public to anon, authenticated;
revoke select on public.vendor_listings from anon;
grant select, insert, update, delete on
  public.profiles, public.vendor_listings, public.user_state, public.cooperations,
  public.open_requests, public.open_request_responses to authenticated;
-- Kerja sama hanya diubah lewat Edge Function "cooperation-action" (aturan alur diperiksa di server).
-- Browser hanya boleh membaca; menulis langsung ke tabel ini ditolak.
revoke insert, update, delete on public.cooperations from anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
