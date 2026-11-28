-- ============================================================
-- MIGRACIÓN: ORGANIZADOR DE ARCHIVOS STL / 3MF PARA 3D COPAS
-- Copiá y ejecutá este script en Supabase -> SQL Editor
-- ============================================================

-- 1. Tabla de archivos STL/3D (SOLO ADMIN)
create table if not exists stl_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  folder text not null default 'Sin clasificar',
  file_name text not null,
  file_path text not null,
  file_size_bytes bigint not null default 0,
  product_id uuid references products(id) on delete set null,
  material text default 'PLA',
  print_time_minutes integer,
  filament_grams numeric(10,2),
  layer_height text default '0.20mm',
  infill_pct integer default 15,
  supports boolean not null default false,
  notes text,
  tags text[] not null default '{}',
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stl_files_folder on stl_files(folder);
create index if not exists idx_stl_files_product on stl_files(product_id);
create index if not exists idx_stl_files_favorite on stl_files(favorite);

-- Trigger updated_at
drop trigger if exists trg_stl_files_updated_at on stl_files;
create trigger trg_stl_files_updated_at
  before update on stl_files
  for each row execute function set_updated_at();

-- 2. RLS: SOLO ADMIN puede leer, crear, editar o borrar
alter table stl_files enable row level security;

drop policy if exists "stl_files_admin_only" on stl_files;
create policy "stl_files_admin_only" on stl_files
  for all using (is_admin()) with check (is_admin());

-- 3. Bucket PRIVADO para archivos STL/3MF/OBJ
insert into storage.buckets (id, name, public)
values ('stl-files', 'stl-files', false)
on conflict (id) do nothing;

-- Políticas de Storage para bucket stl-files: SOLO ADMIN
drop policy if exists "stl_storage_admin_select" on storage.objects;
create policy "stl_storage_admin_select" on storage.objects
  for select using (bucket_id = 'stl-files' and is_admin());

drop policy if exists "stl_storage_admin_insert" on storage.objects;
create policy "stl_storage_admin_insert" on storage.objects
  for insert with check (bucket_id = 'stl-files' and is_admin());

drop policy if exists "stl_storage_admin_update" on storage.objects;
create policy "stl_storage_admin_update" on storage.objects
  for update using (bucket_id = 'stl-files' and is_admin());

drop policy if exists "stl_storage_admin_delete" on storage.objects;
create policy "stl_storage_admin_delete" on storage.objects
  for delete using (bucket_id = 'stl-files' and is_admin());
