
create extension if not exists "uuid-ossp";

create table patients (
  id uuid primary key default uuid_generate_v4(),
  hprn text unique, -- null until HPRS integration lands
  first_name text not null,
  last_name text not null,
  phone_number text not null,
  date_of_birth date not null,
  allergies text[] not null default '{}',
  chronic_conditions text[] not null default '{}',
  current_medications text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_patients_phone on patients(phone_number);
create index idx_patients_hprn on patients(hprn);

create type ticket_status as enum ('waiting', 'called', 'in_consult', 'completed', 'no_show');
create type ticket_source as enum ('mobile', 'ussd', 'walk_in', 'appointment');

create table queue_tickets (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id),
  facility_id text not null,
  service_point text not null,
  status ticket_status not null default 'waiting',
  source ticket_source not null,
  queue_position integer not null,
  checked_in_at timestamptz not null default now(),
  called_at timestamptz,
  completed_at timestamptz
);

create index idx_tickets_facility_status on queue_tickets(facility_id, service_point, status);

create table encounters (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id),
  ticket_id uuid not null references queue_tickets(id),
  clinician_id uuid not null,
  notes text,
  diagnosis_codes text[] not null default '{}',
  completed_at timestamptz
);

-- Append-only. No update/delete grants 
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid not null,
  actor_role text not null,
  action text not null check (action in ('read', 'create', 'update')),
  resource_type text not null check (resource_type in ('patient', 'encounter', 'ticket')),
  resource_id uuid not null,
  timestamp timestamptz not null default now()
);

-- Realtime: expose queue_tickets for live position broadcast 
alter publication supabase_realtime add table queue_tickets;