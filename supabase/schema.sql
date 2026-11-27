-- ============================================================
-- 3D COPAS — Schema SQL completo para Supabase
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- FUNCIÓN AUXILIAR: verificar si el usuario es administrador
-- ============================================================
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select (
    auth.jwt() ->> 'role' = 'service_role'
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
$$;

-- ============================================================
-- TABLA: business_config
-- ============================================================
create table if not exists business_config (
  id                         uuid primary key default uuid_generate_v4(),
  name                       text not null default '3D Copas',
  slogan                     text default 'Hecho a pedido en impresión 3D',
  logo_url                   text,
  whatsapp                   text default '542266000000',
  email                      text,
  instagram                  text,
  tiktok                     text,
  facebook                   text,
  other_links                jsonb default '[]',
  local_province             text not null default 'Buenos Aires',
  local_city                 text not null default 'Balcarce',
  local_postal_codes         text[] not null default '{"7620"}',
  transportes                jsonb not null default '[
    {"id":"correo","name":"Correo Argentino","active":true,"tracking_url":"https://www.correoargentino.com.ar/formularios/seguimiento","order":1},
    {"id":"via_cargo","name":"Vía Cargo","active":true,"tracking_url":"https://www.viacargo.com.ar/seguimiento","order":2},
    {"id":"oca","name":"OCA","active":true,"tracking_url":"https://www1.oca.com.ar/OCANet/IngresoNumerosPiezas.aspx","order":3},
    {"id":"garmendia","name":"Garmendia","active":true,"tracking_url":"","order":4,"warning":"Sujeto a confirmación según el paquete"}
  ]',
  garmendia_weight_threshold integer not null default 5000,
  garmendia_bultos_threshold integer not null default 3,
  payment_alias              text,
  payment_cbu                text,
  payment_holder             text,
  returns_policy             text default 'Podés arrepentirte de la compra dentro de los 10 días hábiles desde que recibís tu pedido (Ley de Defensa del Consumidor).',
  exchange_policy            text default 'Si el producto llega con algún defecto de impresión o rotura en el envío, lo reimprimimos sin cargo.',
  delivery_times_text        text default 'Todos los productos se imprimen a pedido. El tiempo estimado figura en cada publicación.',
  footer_text                text default 'Hecho a pedido en impresión 3D',
  welcome_message            text,
  banner_active              boolean not null default true,
  banner_title               text default 'Edición Navidad en 3D',
  banner_subtitle            text default 'Cortantes, sellos y adornos impresos a pedido en Balcarce. ¡Hacemos envíos a todo el país!',
  banner_image_url           text,
  banner_button_text         text default 'Ver catálogo',
  banner_button_url          text default '#catalogo',
  color_primary              text not null default '#2456D6',
  color_secondary            text not null default '#0F1B3D',
  color_accent               text not null default '#E6B422',
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create unique index if not exists business_config_singleton on business_config ((true));

insert into business_config (name) values ('3D Copas')
on conflict do nothing;

-- ============================================================
-- TABLA: categories
-- ============================================================
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  icon        text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

insert into categories (name, slug, icon, sort_order) values
  ('Cortantes de cerámica', 'cortantes-ceramica', '🏺', 1),
  ('Cortantes de galletitas', 'cortantes-galletitas', '🍪', 2),
  ('Sellos', 'sellos', '🔖', 3),
  ('Luces', 'luces', '💡', 4),
  ('Antiestrés', 'antiestres', '🌀', 5),
  ('Otros', 'otros', '✨', 6)
on conflict (slug) do nothing;

-- ============================================================
-- TABLA: products
-- ============================================================
create table if not exists products (
  id                   uuid primary key default uuid_generate_v4(),
  name                 text not null,
  slug                 text not null unique,
  description          text,
  category_id          uuid references categories(id) on delete set null,
  photos               text[] not null default '{}',
  main_photo_index     integer not null default 0,
  variants             jsonb not null default '[]',
  colors               text[] not null default '{}',
  labels               text[] not null default '{}',
  status               text not null default 'disponible' check (status in ('disponible','a_pedido','agotado')),
  visible              boolean not null default true,
  featured             boolean not null default false,
  sort_order           integer not null default 0,
  season               text,
  estimated_delivery   text not null default '5 a 7 días hábiles',
  personalizable       boolean not null default false,
  personalization_hint text,
  shipping_height_cm   numeric(6,1),
  shipping_width_cm    numeric(6,1),
  shipping_length_cm   numeric(6,1),
  shipping_weight_g    integer,
  packaging_cost       numeric(10,2) not null default 0,
  -- Columnas privadas (solo admin)
  cost                 numeric(10,2),
  cost_breakdown       jsonb,
  view_count           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists products_category_id_idx on products(category_id);
create index if not exists products_visible_idx on products(visible);
create index if not exists products_featured_idx on products(featured);
create index if not exists products_slug_idx on products(slug);

-- Vista pública segura de productos (sin costos ni márgenes)
create or replace view products_public as
  select
    id, name, slug, description, category_id,
    photos, main_photo_index, variants, colors, labels,
    status, visible, featured, sort_order, season,
    estimated_delivery, personalizable, personalization_hint,
    shipping_height_cm, shipping_width_cm, shipping_length_cm, shipping_weight_g,
    view_count, created_at, updated_at
  from products
  where visible = true;

-- ============================================================
-- TABLA: customers
-- ============================================================
create table if not exists customers (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists customers_email_idx on customers(email);

-- ============================================================
-- TABLA: orders
-- ============================================================
create table if not exists orders (
  id                uuid primary key default uuid_generate_v4(),
  order_number      serial unique,
  customer_id       uuid references customers(id) on delete set null,
  guest_email       text,
  guest_name        text,
  guest_phone       text,
  province          text not null,
  city              text not null,
  postal_code       text not null,
  items             jsonb not null default '[]',
  subtotal          numeric(10,2) not null default 0,
  delivery_type     text not null default 'envio' check (delivery_type in ('local','envio')),
  transporte        text,
  tracking_code     text,
  tracking_url      text,
  shipping_cost     numeric(10,2) not null default 0,
  total             numeric(10,2) not null default 0,
  payment_method    text check (payment_method in ('efectivo','transferencia')),
  box_height_cm     numeric(6,1),
  box_width_cm      numeric(6,1),
  box_length_cm     numeric(6,1),
  box_weight_g      integer,
  status            text not null default 'nuevo' check (status in (
    'nuevo','esperando_cotizacion','esperando_transferencia','pagado',
    'en_impresion','listo','despachado','entregado','cancelado'
  )),
  notes             text,
  ordered_at        timestamptz not null default now(),
  delivery_date     date,
  dispatch_date     date,
  receipt_number    integer,
  receipt_issued_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on orders(customer_id);
create index if not exists orders_guest_email_idx on orders(lower(guest_email));
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_ordered_at_idx on orders(ordered_at desc);

-- Función segura para que un cliente recién registrado vincule sus pedidos previos de invitado
create or replace function link_guest_orders()
returns void
language plpgsql
security definer
as $$
declare
  user_email text;
begin
  select email into user_email from auth.users where id = auth.uid();
  if user_email is not null then
    insert into customers (id, email, full_name)
    values (auth.uid(), user_email, (select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()))
    on conflict (id) do nothing;

    update orders
    set customer_id = auth.uid()
    where customer_id is null
      and lower(guest_email) = lower(user_email);
  end if;
end;
$$;

-- ============================================================
-- TABLA: custom_requests
-- ============================================================
create table if not exists custom_requests (
  id                  uuid primary key default uuid_generate_v4(),
  customer_name       text not null,
  contact_type        text not null check (contact_type in ('whatsapp','email')),
  contact_value       text not null,
  description         text not null,
  approximate_size    text,
  reference_photo_url text,
  status              text not null default 'nueva' check (status in ('nueva','respondida','cerrada')),
  internal_notes      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists custom_requests_status_idx on custom_requests(status);

-- ============================================================
-- TABLAS DE CONTABILIDAD PRIVADA (solo admin)
-- ============================================================
create table if not exists income_entries (
  id          uuid primary key default uuid_generate_v4(),
  date        date not null default current_date,
  amount      numeric(10,2) not null,
  description text,
  order_id    uuid references orders(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists income_entries_date_idx on income_entries(date desc);

create table if not exists expense_entries (
  id         uuid primary key default uuid_generate_v4(),
  date       date not null default current_date,
  amount     numeric(10,2) not null,
  category   text not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists expense_entries_date_idx on expense_entries(date desc);

create table if not exists withdrawals (
  id         uuid primary key default uuid_generate_v4(),
  date       date not null default current_date,
  amount     numeric(10,2) not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists withdrawals_date_idx on withdrawals(date desc);

create table if not exists calculator_defaults (
  id                    uuid primary key default uuid_generate_v4(),
  filament_price_per_kg numeric(10,2) not null default 25000,
  kwh_price             numeric(10,4) not null default 120,
  machine_wear_per_hour numeric(10,2) not null default 500,
  default_margin_pct    numeric(5,2) not null default 60,
  ml_commission_pct     numeric(5,2) not null default 17,
  updated_at            timestamptz not null default now()
);

create unique index if not exists calculator_defaults_singleton on calculator_defaults ((true));

insert into calculator_defaults (filament_price_per_kg) values (25000)
on conflict do nothing;

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger set_business_config_updated_at
  before update on business_config
  for each row execute function set_updated_at();

create or replace trigger set_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create or replace trigger set_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

create or replace trigger set_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

create or replace trigger set_custom_requests_updated_at
  before update on custom_requests
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- business_config: lectura pública, escritura solo admin
alter table business_config enable row level security;
drop policy if exists "business_config_public_read" on business_config;
create policy "business_config_public_read" on business_config
  for select using (true);
drop policy if exists "business_config_admin_write" on business_config;
create policy "business_config_admin_write" on business_config
  for all using (is_admin());

-- categories: lectura pública, escritura solo admin
alter table categories enable row level security;
drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read" on categories
  for select using (true);
drop policy if exists "categories_admin_write" on categories;
create policy "categories_admin_write" on categories
  for all using (is_admin());

-- products: lectura pública solo visibles y SIN columnas privadas (cost, cost_breakdown, packaging_cost)
alter table products enable row level security;
drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products
  for select using (visible = true);
drop policy if exists "products_admin_all" on products;
create policy "products_admin_all" on products
  for all using (is_admin());

-- Seguridad a nivel de columna: ni anon ni authenticated (clientes) pueden consultar cost/cost_breakdown por REST API
revoke select (cost, cost_breakdown, packaging_cost) on products from anon, authenticated;

-- customers: cada cliente lee/edita solo su perfil; admin ve todo
alter table customers enable row level security;
drop policy if exists "customers_own_read" on customers;
create policy "customers_own_read" on customers
  for select using (auth.uid() = id);
drop policy if exists "customers_own_insert" on customers;
create policy "customers_own_insert" on customers
  for insert with check (auth.uid() = id);
drop policy if exists "customers_own_update" on customers;
create policy "customers_own_update" on customers
  for update using (auth.uid() = id);
drop policy if exists "customers_admin_only" on customers;
create policy "customers_admin_only" on customers
  for all using (is_admin());

-- orders: cualquiera puede insertar; cliente ve solo sus propios pedidos (sin notas internas); admin ve todo
alter table orders enable row level security;
drop policy if exists "orders_public_insert" on orders;
create policy "orders_public_insert" on orders
  for insert with check (true);
drop policy if exists "orders_customer_read" on orders;
create policy "orders_customer_read" on orders
  for select using (auth.uid() is not null and auth.uid() = customer_id);
drop policy if exists "orders_admin_all" on orders;
create policy "orders_admin_all" on orders
  for all using (is_admin());

-- Ocultar notas internas del admin a los clientes comunes
revoke select (notes) on orders from anon, authenticated;

-- custom_requests: cualquiera puede insertar; solo admin lee y actualiza
alter table custom_requests enable row level security;
drop policy if exists "custom_requests_public_insert" on custom_requests;
create policy "custom_requests_public_insert" on custom_requests
  for insert with check (true);
drop policy if exists "custom_requests_admin_all" on custom_requests;
create policy "custom_requests_admin_all" on custom_requests
  for all using (is_admin());

-- Tablas privadas de contabilidad y calculadora: SOLO ADMIN
alter table income_entries enable row level security;
drop policy if exists "income_entries_admin_only" on income_entries;
create policy "income_entries_admin_only" on income_entries
  for all using (is_admin());

alter table expense_entries enable row level security;
drop policy if exists "expense_entries_admin_only" on expense_entries;
create policy "expense_entries_admin_only" on expense_entries
  for all using (is_admin());

alter table withdrawals enable row level security;
drop policy if exists "withdrawals_admin_only" on withdrawals;
create policy "withdrawals_admin_only" on withdrawals
  for all using (is_admin());

alter table calculator_defaults enable row level security;
drop policy if exists "calculator_defaults_admin_only" on calculator_defaults;
create policy "calculator_defaults_admin_only" on calculator_defaults
  for all using (is_admin());

-- ============================================================
-- STORAGE BUCKETS Y POLÍTICAS
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('products', 'products', true),
  ('requests', 'requests', true),
  ('logos', 'logos', true),
  ('banners', 'banners', true)
on conflict (id) do nothing;

drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('products', 'logos', 'banners', 'requests'));

drop policy if exists "storage_admin_write" on storage.objects;
create policy "storage_admin_write" on storage.objects
  for insert with check (bucket_id in ('products', 'logos', 'banners') and is_admin());

drop policy if exists "storage_admin_update" on storage.objects;
create policy "storage_admin_update" on storage.objects
  for update using (bucket_id in ('products', 'logos', 'banners') and is_admin());

drop policy if exists "storage_admin_delete" on storage.objects;
create policy "storage_admin_delete" on storage.objects
  for delete using (bucket_id in ('products', 'logos', 'banners', 'requests') and is_admin());

drop policy if exists "storage_requests_public_insert" on storage.objects;
create policy "storage_requests_public_insert" on storage.objects
  for insert with check (bucket_id = 'requests');
