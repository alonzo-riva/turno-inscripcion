-- Esquema para Supabase (Postgres) - Turnos con 6 cupos por bloque
create extension if not exists "pgcrypto";

create table if not exists public.reservas (
  dia date not null,
  bloque text not null check (bloque in ('M','T')),
  slot_no int not null check (slot_no between 1 and 6),
  nombre text not null check (char_length(nombre) between 1 and 50),
  created_at timestamptz default now(),
  primary key (dia, bloque, slot_no)
);

-- RLS
alter table public.reservas enable row level security;

-- Lectura para todos (público)
create policy "read_all" on public.reservas
  for select using (true);

-- Inserción anónima permitida SOLO si aún hay cupos (<6) para ese bloque y día
-- Nota: El límite real ya lo impone la PK (1..6 slots). Pero esta política da un mensaje más claro
-- y evita updates/deletes desde clientes anónimos.
create policy "insert_if_capacity" on public.reservas
  for insert
  with check (
    -- no permitir más de 6 filas por (dia,bloque)
    (select count(*) from public.reservas r where r.dia = reservas.dia and r.bloque = reservas.bloque) < 6
  );

-- Prohibimos UPDATE/DELETE a anónimos (no se crea política => denegado por defecto).
