-- ============================================================
-- 3D COPAS — Datos de ejemplo (Seed)
-- Ejecutá este script en el SQL Editor de Supabase DESPUÉS de schema.sql
-- ============================================================

-- 1. 8 Productos de ejemplo (sin marcas ni personajes con derechos de autor)
insert into products (
  name, slug, description, category_id, photos, main_photo_index,
  variants, colors, labels, status, visible, featured, sort_order,
  season, estimated_delivery, personalizable, personalization_hint,
  shipping_height_cm, shipping_width_cm, shipping_length_cm, shipping_weight_g,
  packaging_cost, cost
) values
(
  'Cortante Casita de Jengibre',
  'cortante-casita-jengibre',
  'Cortante con marcador de detalles para masa de galletitas o porcelana fría. Bordes redondeados para un corte limpio y cómodo.',
  (select id from categories where slug = 'cortantes-galletitas' limit 1),
  array['https://placehold.co/600x600/FAF7EF/0F1B3D?text=Casita+de+Jengibre'],
  0,
  '[{"id":"v1","size":"8 cm","price":3200},{"id":"v2","size":"11 cm","price":4100}]'::jsonb,
  array['Blanco', 'Rojo', 'Verde', 'Dorado'],
  array['Navidad', 'Más pedido'],
  'disponible', true, true, 1, 'Navidad', '3 a 5 días hábiles', false, null,
  2.0, 9.0, 11.0, 45, 250, 1100
),
(
  'Cortante Árbol de Navidad',
  'cortante-arbol-navidad',
  'Cortante clásico de pino navideño con sello interior de guirnaldas. Ideal para galletitas decoradas con glasé.',
  (select id from categories where slug = 'cortantes-galletitas' limit 1),
  array['https://placehold.co/600x600/FAF7EF/3E9B47?text=Arbol+de+Navidad'],
  0,
  '[{"id":"v1","size":"8 cm","price":2900},{"id":"v2","size":"12 cm","price":3900}]'::jsonb,
  array['Verde', 'Blanco', 'Dorado'],
  array['Navidad', 'Nuevo'],
  'disponible', true, true, 2, 'Navidad', '3 a 5 días hábiles', false, null,
  2.0, 9.0, 12.0, 40, 250, 980
),
(
  'Cortante Estrella Navideña',
  'cortante-estrella-navidena',
  'Estrella de cinco puntas con relieve interno. Sirve tanto para masa como para cerámica artesanal.',
  (select id from categories where slug = 'cortantes-galletitas' limit 1),
  array['https://placehold.co/600x600/FAF7EF/E6B422?text=Estrella+Navidena'],
  0,
  '[{"id":"v1","size":"7 cm","price":2600},{"id":"v2","size":"10 cm","price":3400}]'::jsonb,
  array['Dorado', 'Blanco', 'Azul'],
  array['Navidad'],
  'disponible', true, false, 3, 'Navidad', '3 a 5 días hábiles', false, null,
  2.0, 8.0, 8.0, 35, 200, 850
),
(
  'Cortante Copo de Nieve',
  'cortante-copo-de-nieve',
  'Diseño geométrico de copo de nieve con sello expulsor para lograr un grabado nítido en cada galletita.',
  (select id from categories where slug = 'cortantes-galletitas' limit 1),
  array['https://placehold.co/600x600/FAF7EF/2456D6?text=Copo+de+Nieve'],
  0,
  '[{"id":"v1","size":"8 cm","price":3100}]'::jsonb,
  array['Blanco', 'Celeste', 'Azul'],
  array['Navidad', 'A pedido'],
  'a_pedido', true, false, 4, 'Navidad', '5 a 7 días hábiles', false, null,
  2.5, 9.0, 9.0, 48, 250, 1050
),
(
  'Set x6 Cortantes Botánicos para Cerámica',
  'set-cortantes-botanicos-ceramica',
  'Set de 6 cortantes con filo fino (0,8 mm) pensado especialmente para arcilla polimérica y cerámica. Incluye formas orgánicas de hojas y pétalos.',
  (select id from categories where slug = 'cortantes-ceramica' limit 1),
  array['https://placehold.co/600x600/FAF7EF/0F1B3D?text=Set+Ceramica+x6'],
  0,
  '[{"id":"v1","size":"Set 3 a 5 cm","price":7800},{"id":"v2","size":"Set 5 a 8 cm","price":10500}]'::jsonb,
  array['Blanco', 'Negro', 'Terracota'],
  array['Más pedido'],
  'disponible', true, true, 5, null, '4 a 6 días hábiles', false, null,
  3.0, 15.0, 18.0, 140, 400, 2900
),
(
  'Sello Personalizado para Emprendimientos',
  'sello-personalizado-emprendimientos',
  'Sello en relieve para marcar arcilla, jabones, cerámica o bolsas de papel kraft. Podés elegir el texto o enviarnos tu idea.',
  (select id from categories where slug = 'sellos' limit 1),
  array['https://placehold.co/600x600/FAF7EF/2456D6?text=Sello+Personalizado'],
  0,
  '[{"id":"v1","size":"4 x 4 cm","price":4500},{"id":"v2","size":"6 x 6 cm","price":5900}]'::jsonb,
  array['Azul', 'Negro', 'Blanco'],
  array['A pedido', 'Más pedido'],
  'a_pedido', true, true, 6, null, '5 a 8 días hábiles', true, 'Escribí el nombre o frase que querés grabar en el sello.',
  3.5, 7.0, 7.0, 65, 300, 1450
),
(
  'Velador Luna Texturada LED',
  'velador-luna-texturada-led',
  'Lámpara decorativa impresa en PLA translúcido con textura lunar realista y base de madera/PLA. Incluye luz LED cálida de bajo consumo.',
  (select id from categories where slug = 'luces' limit 1),
  array['https://placehold.co/600x600/0F1B3D/E6B422?text=Velador+Luna+LED'],
  0,
  '[{"id":"v1","size":"14 cm diámetro","price":18500},{"id":"v2","size":"18 cm diámetro","price":24900}]'::jsonb,
  array['Blanco cálido', 'Marfil'],
  array['Nuevo', 'Más pedido'],
  'a_pedido', true, true, 7, null, '7 a 10 días hábiles', true, 'Opcional: podés pedir una dedicatoria o nombre grabado en la base.',
  19.0, 19.0, 20.0, 420, 900, 7400
),
(
  'Espiral Antiestrés Geométrico',
  'espiral-antiestres-geometrico',
  'Juguete kinético articulado con encastre helicoidal suave. Ideal para tener en el escritorio o regalar.',
  (select id from categories where slug = 'antiestres' limit 1),
  array['https://placehold.co/600x600/FAF7EF/2456D6?text=Espiral+Antiestres'],
  0,
  '[{"id":"v1","size":"Estándar (10 cm)","price":4200}]'::jsonb,
  array['Azul y Dorado', 'Verde y Blanco', 'Multicolor'],
  array['Nuevo'],
  'disponible', true, false, 8, null, '2 a 4 días hábiles', false, null,
  6.0, 6.0, 11.0, 85, 250, 1200
)
on conflict (slug) do nothing;

-- 2. Gastos de ejemplo
insert into expense_entries (date, amount, category, note) values
  (current_date - interval '10 days', 26500, 'Filamento', '1 kg PLA Blanco + 1 kg PLA Azul 3D'),
  (current_date - interval '6 days', 4800, 'Packaging e insumos', 'Cajas de cartón, cinta y bolsitas'),
  (current_date - interval '2 days', 6200, 'Electricidad', 'Estimado mensual taller impresión 3D');

-- 3. Pedido de ejemplo (Balcarce, Buenos Aires)
insert into orders (
  guest_name, guest_email, guest_phone,
  province, city, postal_code,
  items, subtotal, delivery_type, shipping_cost, total,
  payment_method, status, ordered_at
) values (
  'Lucía Fernández',
  'lucia.ejemplo@correo.com',
  '2266123456',
  'Buenos Aires',
  'Balcarce',
  '7620',
  '[{"product_id":"ejemplo-1","name":"Cortante Casita de Jengibre","variant":{"id":"v1","size":"8 cm","price":3200},"color":"Rojo","qty":2,"unit_price":3200}]'::jsonb,
  6400,
  'local',
  0,
  6400,
  'efectivo',
  'nuevo',
  now() - interval '1 day'
);
