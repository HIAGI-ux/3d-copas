# 3D Copas — Tienda online + Panel de administración

Aplicación web completa para **3D Copas** (Balcarce, provincia de Buenos Aires), construida con **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase**.

## ¿Qué incluye?

- **Tienda pública (`/`)**: catálogo mobile-first con filtros por categoría, buscador, banner de temporada, destacados, página de producto (`/producto/[slug]`), personalización y formulario de pedidos a medida.
- **Carrito y checkout (`/carrito`)**: sin pago online. Detecta automáticamente **entrega local en Balcarce** (efectivo o transferencia) vs **envío** (solo transferencia tras cotizar), con 4 transportes (Correo Argentino, Vía Cargo, OCA y Garmendia) y armado automático de mensaje para WhatsApp.
- **Cuenta de cliente (`/cuenta`)**: opcional para seguir pedidos, ver código y link de seguimiento y descargar comprobante PDF. Vincula pedidos previos hechos como invitado usando el mismo email.
- **Panel de administración (`/admin`)**: protegido con Supabase Auth (rol `admin`), optimizado para celular:
  - Productos (CRUD, múltiples fotos comprimidas, costos privados, variantes)
  - Orden y destacados con arrastrar y soltar táctil
  - Calculadora de costos y precios (con soporte de Packs)
  - Pedidos + Calculadora de caja/envío + Comparador de transportes + Comprobante PDF tipo "X"
  - Consultas personalizadas con respuesta directa por WhatsApp o email
  - Contabilidad privada (ingresos, gastos por rubro, retiros, gráfico mensual y exportación a Excel `.xlsx`)
  - Configuración del negocio, categorías y copia de seguridad JSON

---

## Guía paso a paso para ponerlo en marcha (sin conocimientos previos)

### Paso 1: Crear tu base de datos en Supabase (gratis)
1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta gratuita.
2. Hacé clic en **New Project**, elegí un nombre (ej: `3d-copas`) y una contraseña segura. Esperá 1-2 minutos.
3. En el menú izquierdo, abrí **SQL Editor** → **New query**.
4. Copiá todo el contenido de `supabase/schema.sql`, pegalo ahí y apretá **Run** (esto crea todas las tablas, la seguridad RLS y los buckets de fotos).
5. (Opcional recomendado) Abrí otra **New query**, pegá el contenido de `supabase/seed.sql` y apretá **Run** para cargar los 8 productos, gastos y pedido de ejemplo.

### Paso 2: Copiar las claves de Supabase
1. En Supabase, andá a **Settings → API**.
2. Copiá la **Project URL** y la clave **`anon` `public`**.
3. En la carpeta del proyecto, duplicá `.env.example`, renombralo a `.env.local` y pegá esas dos claves junto con tu número de WhatsApp.

### Paso 3: Crear tu usuario Administrador
1. En Supabase, andá a **Authentication → Users** → **Add user → Create new user**.
2. Ingresá tu email y la contraseña con la que vas a entrar a `/admin`.
3. Luego, en **SQL Editor**, ejecutá esta consulta cambiando el email por el tuyo:

```sql
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'tu@email.com';
```

### Paso 4: Correr la app en tu computadora
Necesitás tener instalado [Node.js 18+](https://nodejs.org/) y `pnpm` (o `npm`).

```bash
pnpm install
pnpm dev
```

- Tienda pública: `http://localhost:3000`
- Mi cuenta (clientes): `http://localhost:3000/cuenta`
- Panel de administrador: `http://localhost:3000/admin`

### Paso 5: Subir gratis a Vercel
1. Subí esta carpeta a un repositorio privado en GitHub.
2. Entrá a [vercel.com](https://vercel.com), hacé clic en **Add New → Project** y elegí tu repositorio.
3. En **Environment Variables**, agregá las mismas variables de tu `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`).
4. Hacé clic en **Deploy**. ¡Listo!
