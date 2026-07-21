create extension if not exists btree_gist;

-- Enums
create type public.user_role as enum ('patient','professional','admin');
create type public.specialty as enum ('psychologist','psychiatrist');
create type public.modality as enum ('in_person','online');
create type public.rule_modality as enum ('in_person','online','both');
create type public.appointment_status as enum
  ('confirmed','cancelled_by_patient','cancelled_by_center','completed','no_show');
create type public.exception_kind as enum ('blocked','extra_open');

-- Profiles (1:1 auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  rut text,
  phone text,
  role public.user_role not null default 'patient',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, rut, phone)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name',''),
          new.raw_user_meta_data->>'rut',
          new.raw_user_meta_data->>'phone');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helper (security definer avoids RLS recursion)
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as
$$ select role::text from public.profiles where id = auth.uid() $$;

-- Professionals
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null default '',
  slug text not null unique,
  specialty public.specialty not null,
  photo_url text,
  bio text not null default '',
  modalities public.modality[] not null default '{in_person}',
  session_duration_min int not null default 50 check (session_duration_min between 15 and 180),
  session_price int not null default 0,
  meeting_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Profesional: id de su fila en professionals (evita recursion en policies)
create or replace function public.my_professional_id() returns uuid
language sql stable security definer set search_path = public as
$$ select id from public.professionals where profile_id = auth.uid() $$;

-- Weekly recurring availability
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0=domingo
  start_time time not null,
  end_time time not null check (end_time > start_time),
  modality public.rule_modality not null default 'both'
);

-- One-off blocks / extra openings
create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  date date not null,
  start_time time,             -- null = whole day
  end_time time,
  kind public.exception_kind not null default 'blocked',
  reason text,
  check ((start_time is null) = (end_time is null))
);

-- Appointments
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  professional_id uuid not null references public.professionals(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  modality public.modality not null,
  status public.appointment_status not null default 'confirmed',
  meeting_url text,
  source text not null default 'web' check (source in ('web','admin')),
  reminder_sent_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint no_double_booking exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed')
);
create index appointments_patient_idx on public.appointments (patient_id, starts_at desc);
create index appointments_professional_idx on public.appointments (professional_id, starts_at);

-- Private session notes (author-only)
create table public.session_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  professional_id uuid not null references public.professionals(id),
  body text not null default '',
  updated_at timestamptz not null default now()
);

-- Payments (fase 2 — schema only)
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id),
  amount int not null,
  currency text not null default 'CLP',
  status text not null default 'pending' check (status in ('pending','paid','refunded','failed')),
  provider text,
  external_id text,
  created_at timestamptz not null default now()
);

-- Settings
create table public.settings (
  key text primary key,
  value text not null
);
insert into public.settings (key, value) values
  ('cancellation_window_hours','24'),
  ('center_phone','+56 9 1234 5678'),
  ('center_email','contacto@magnolia.cl'),
  ('center_address','Av. Providencia 1234, Of. 56, Providencia, Santiago');

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.professionals enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.appointments enable row level security;
alter table public.session_notes enable row level security;
alter table public.payments enable row level security;
alter table public.settings enable row level security;

-- profiles: own row; admin all; professionals can read patients they attend (via join in app using admin client instead — keep simple: admin + self)
create policy "profiles self read" on public.profiles for select using (id = auth.uid() or public.my_role() = 'admin');
create policy "profiles self update" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.my_role() = 'admin' then return new; end if;
  if new.role is distinct from old.role then
    raise exception 'No autorizado a cambiar el rol';
  end if;
  return new;
end; $$;
create trigger profiles_guard_update before update on public.profiles
  for each row execute function public.guard_profile_update();
create policy "profiles admin all" on public.profiles for all using (public.my_role() = 'admin');

create policy "profiles professional reads own patients" on public.profiles for select
  using (exists (
    select 1 from public.appointments a
    where a.patient_id = profiles.id
      and a.professional_id = public.my_professional_id()
  ));

-- professionals: public read of active; owner update; admin all
create policy "professionals public read" on public.professionals for select
  using (is_active = true or profile_id = auth.uid() or public.my_role() = 'admin');
create policy "professionals owner update" on public.professionals for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "professionals admin all" on public.professionals for all using (public.my_role() = 'admin');

-- availability: solo el dueño y admin leen las reglas/excepciones crudas.
-- El cómputo de slots para el público pasa por src/lib/scheduling/fetch-slots.ts
-- con el cliente admin (service role) y solo expone horarios ya calculados.
create policy "rules staff read" on public.availability_rules for select
  using (professional_id in (select id from public.professionals where profile_id = auth.uid()) or public.my_role() = 'admin');
create policy "rules owner write" on public.availability_rules for all
  using (professional_id in (select id from public.professionals where profile_id = auth.uid()) or public.my_role() = 'admin')
  with check (professional_id in (select id from public.professionals where profile_id = auth.uid()) or public.my_role() = 'admin');
create policy "exceptions staff read" on public.availability_exceptions for select
  using (professional_id in (select id from public.professionals where profile_id = auth.uid()) or public.my_role() = 'admin');
create policy "exceptions owner write" on public.availability_exceptions for all
  using (professional_id in (select id from public.professionals where profile_id = auth.uid()) or public.my_role() = 'admin')
  with check (professional_id in (select id from public.professionals where profile_id = auth.uid()) or public.my_role() = 'admin');

-- appointments: patient sees own; professional sees own; admin all; patients insert own
create policy "appt patient read" on public.appointments for select using (patient_id = auth.uid());
create policy "appt professional read" on public.appointments for select
  using (professional_id in (select id from public.professionals where profile_id = auth.uid()));
create policy "appt admin all" on public.appointments for all using (public.my_role() = 'admin');
create policy "appt patient insert" on public.appointments for insert
  with check (patient_id = auth.uid() and status = 'confirmed' and source = 'web');
create policy "appt patient cancel" on public.appointments for update
  using (patient_id = auth.uid() and status = 'confirmed')
  with check (patient_id = auth.uid() and status = 'cancelled_by_patient');
create policy "appt professional update" on public.appointments for update
  using (professional_id in (select id from public.professionals where profile_id = auth.uid()))
  with check (professional_id in (select id from public.professionals where profile_id = auth.uid()));

create or replace function public.guard_appointment_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare win int;
begin
  if auth.uid() is null or public.my_role() = 'admin' then return new; end if;
  if new.patient_id is distinct from old.patient_id
     or new.professional_id is distinct from old.professional_id
     or new.starts_at is distinct from old.starts_at
     or new.ends_at is distinct from old.ends_at
     or new.modality is distinct from old.modality
     or new.source is distinct from old.source then
    raise exception 'No autorizado a modificar estos campos de la cita';
  end if;
  if new.status = 'cancelled_by_patient' and old.status = 'confirmed' then
    select value::int into win from public.settings where key = 'cancellation_window_hours';
    if old.starts_at <= now() + make_interval(hours => coalesce(win, 24)) then
      raise exception 'Fuera de la ventana de cancelación';
    end if;
  end if;
  return new;
end; $$;
create trigger appointments_guard_update before update on public.appointments
  for each row execute function public.guard_appointment_update();

-- Valida inserciones de citas de usuarios finales (incluye REST directo)
create or replace function public.guard_appointment_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pro public.professionals%rowtype;
begin
  if auth.uid() is null or public.my_role() = 'admin' then return new; end if;
  select * into pro from public.professionals where id = new.professional_id;
  if pro.id is null or not pro.is_active then
    raise exception 'Profesional no disponible';
  end if;
  if not (new.modality = any(pro.modalities)) then
    raise exception 'Modalidad no ofrecida por el profesional';
  end if;
  if new.ends_at - new.starts_at <> make_interval(mins => pro.session_duration_min) then
    raise exception 'Duración de cita inválida';
  end if;
  if new.starts_at <= now() then
    raise exception 'La cita debe ser en el futuro';
  end if;
  return new;
end; $$;
create trigger appointments_guard_insert before insert on public.appointments
  for each row execute function public.guard_appointment_insert();

-- Copia (autoritativamente) el link de videollamada del profesional al crear una cita online
create or replace function public.set_appointment_meeting_url() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.modality = 'online' then
    select meeting_url into new.meeting_url from public.professionals
      where id = new.professional_id and 'online' = any(modalities);
  else
    new.meeting_url := null;
  end if;
  return new;
end; $$;
create trigger appointments_set_meeting_url before insert on public.appointments
  for each row execute function public.set_appointment_meeting_url();

-- session_notes: strictly author-only (not even admin)
create policy "notes author all" on public.session_notes for all
  using (professional_id in (select id from public.professionals where profile_id = auth.uid()))
  with check (
    professional_id in (select id from public.professionals where profile_id = auth.uid())
    and exists (
      select 1 from public.appointments a
      where a.id = session_notes.appointment_id
        and a.professional_id = session_notes.professional_id
    )
  );

-- payments: admin + owning patient read
create policy "payments admin all" on public.payments for all using (public.my_role() = 'admin');
create policy "payments patient read" on public.payments for select
  using (appointment_id in (select id from public.appointments where patient_id = auth.uid()));

-- settings: public read, admin write
create policy "settings public read" on public.settings for select using (true);
create policy "settings admin write" on public.settings for all using (public.my_role() = 'admin');

-- Column-level hardening: ni anon ni authenticated leen meeting_url de professionals
revoke select on public.professionals from anon, authenticated;
grant select (id, profile_id, full_name, slug, specialty, photo_url, bio, modalities, session_duration_min, session_price, is_active, created_at) on public.professionals to anon, authenticated;
