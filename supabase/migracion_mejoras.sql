-- ============================================================
-- MIGRACIÓN DE MEJORAS PARA 3D COPAS
-- Copiá y ejecutá este script en Supabase -> SQL Editor
-- ============================================================

-- 1. Columnas para productos anclados por temporada/mes
alter table products add column if not exists pinned boolean not null default false;
alter table products add column if not exists pinned_until date;

-- 2. Actualizar vista pública de productos
drop view if exists products_public;
create view products_public as
  select
    id, name, slug, description, category_id,
    photos, main_photo_index, variants, colors, labels,
    status, visible, featured, pinned, pinned_until, sort_order, season,
    estimated_delivery, personalizable, personalization_hint,
    shipping_height_cm, shipping_width_cm, shipping_length_cm, shipping_weight_g,
    view_count, created_at, updated_at
  from products
  where visible = true;

-- 3. Permitir admin tanto por user_metadata como por app_metadata
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select (
    auth.jwt() ->> 'role' = 'service_role'
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
$$;

-- 4. Guardar automáticamente cada usuario nuevo en la tabla customers
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customers (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.customers.full_name),
    phone = coalesce(nullif(excluded.phone, ''), public.customers.phone);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Confirmar todos los usuarios existentes que quedaron sin confirmar email
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

-- 6. Sincronizar usuarios existentes a la tabla customers
insert into public.customers (id, email, full_name, phone)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', ''),
  coalesce(raw_user_meta_data->>'phone', '')
from auth.users
on conflict (id) do nothing;

-- 7. Tipo de comprobante en pedidos (X o E)
alter table orders add column if not exists receipt_type text default 'X' check (receipt_type in ('X','E'));
