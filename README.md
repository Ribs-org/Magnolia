# Magnolia

Plataforma de reservas online para un centro de salud mental (psicología y psiquiatría). Permite a pacientes explorar el equipo de profesionales, ver disponibilidad real y agendar sesiones (presenciales u online); a los profesionales gestionar su agenda, disponibilidad y notas de sesión privadas; y al equipo administrativo operar el centro completo (agenda de todos, pacientes, profesionales y configuración) desde un panel único.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**.
- **Supabase**: Postgres + Auth + Row Level Security. Sin ORM: se usa `@supabase/supabase-js` / `@supabase/ssr` directamente.
- **Tailwind CSS 4**.
- **Resend** para envío de emails transaccionales (confirmación, cancelación, reagendamiento, recordatorio).
- **Vercel** para deploy y **Vercel Cron** para el job diario de recordatorios.
- **Vitest** para tests unitarios (cálculo de slots, reglas de cancelación).

## Setup local

1. Clonar el repo e instalar dependencias:

   ```bash
   git clone <repo>
   cd magnolia
   npm i
   ```

2. Crear un proyecto en [Supabase](https://supabase.com).

3. Aplicar el schema: abrir **SQL Editor** en el dashboard de Supabase, pegar el contenido completo de [`supabase/migrations/0001_schema.sql`](./supabase/migrations/0001_schema.sql) y ejecutarlo. Este archivo crea tablas, tipos, funciones, triggers y todas las políticas de RLS — es la única fuente de verdad del schema (no hay migraciones incrementales en fase 1, y no se usa el CLI de Supabase para esto). **Es de ejecución única**: no usa `if not exists` en sus `create`, así que no es re-ejecutable tal cual. Si falla a medias (por ejemplo, se corta en la mitad de las políticas de RLS), hay que limpiar manualmente lo que sí se creó (`drop` de tablas/tipos/funciones ya aplicados) antes de volver a correrlo completo — no basta con reintentar.

4. Desactivar la confirmación de email: en **Authentication → Sign In / Up**, desactivar **"Confirm email"**. El seed (`scripts/seed.ts`) sí usa la Admin API para crear usuarios ya confirmados, pero el flujo de registro de la app (`signUp` en `src/lib/actions/auth.ts`) usa el `auth.signUp` normal del cliente — sin este flag desactivado, esas cuentas quedarían sin confirmar y no podrían iniciar sesión. **Importante**: este mismo flag debe desactivarse también en el proyecto Supabase de **producción**, no solo en desarrollo — no es algo que se resuelva solo por estar en el `.env` de un ambiente.

5. Copiar las variables de entorno:

   ```bash
   cp .env.example .env.local
   ```

   Completar con los valores del proyecto (**Project Settings → API**):

   | Variable | Descripción |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública, respeta RLS). |
   | `SUPABASE_SERVICE_ROLE_KEY` | Clave de service role (bypassa RLS). **Nunca** exponerla al cliente ni commitearla. |
   | `RESEND_API_KEY` | API key de Resend. Si se deja vacía, los emails se loguean en consola en vez de enviarse (útil en desarrollo). |
   | `EMAIL_FROM` | Remitente de los emails, ej. `Magnolia <onboarding@resend.dev>`. |
   | `CRON_SECRET` | Secreto compartido que valida las llamadas al cron de recordatorios. Generar uno aleatorio, ej. `openssl rand -hex 32`. |
   | `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (`http://localhost:3000` en local). |

6. Cargar datos de demo:

   ```bash
   npm run seed
   ```

   El script (`scripts/seed.ts`) es **idempotente**: busca cada entidad por email/slug antes de crearla, así se puede correr varias veces sin duplicar datos. Crea:
   - 1 cuenta admin.
   - 3 profesionales con sus reglas de disponibilidad semanal.
   - 1 paciente de ejemplo.

7. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000).

## Credenciales del seed

| Rol | Email | Password |
|---|---|---|
| Admin | `admin@magnolia.cl` | `magnolia-admin-1234` |
| Profesional (psicóloga, presencial + online) | `carolina.mendez@magnolia.cl` | `magnolia-pro-1234` |
| Profesional (psicólogo, solo online) | `javier.rios@magnolia.cl` | `magnolia-pro-1234` |
| Profesional (psiquiatra, solo presencial) | `antonia.silva@magnolia.cl` | `magnolia-pro-1234` |
| Paciente demo | `paciente@ejemplo.cl` | `magnolia-paciente-1234` |

## Notas de diseño del schema

- **`professionals.full_name` denormalizado**: aunque el nombre "canónico" vive en `profiles.full_name` (poblado por el trigger `handle_new_user` al crear el usuario en Auth), la tabla `professionals` guarda su propia copia de `full_name`. Esto evita que cualquier lectura pública (landing, ficha de equipo, selects del cron, etc.) necesite hacer join contra `profiles` — tabla con RLS más restrictivo y que no es de lectura pública. El seed escribe explícitamente este valor al crear cada profesional, y la convención en todo el código es **no** anidar `profile:profiles(...)` bajo `professionals` en ningún select (ni siquiera con el cliente admin, que bypassa RLS) — se usa siempre `professional:professionals(full_name)` directo.
- **Aislamiento de `meeting_url`**: el link de videollamada de cada profesional (`professionals.meeting_url`) es información sensible que no debe filtrarse en la lectura pública del equipo. Se resuelve con dos capas:
  1. **Grants a nivel de columna**: se revoca el `select` completo sobre `professionals` a `anon`/`authenticated` y se otorga explícitamente solo sobre las columnas públicas (sin `meeting_url`).
  2. **Trigger `set_appointment_meeting_url`**: al crear una cita online, el trigger copia el `meeting_url` del profesional hacia `appointments.meeting_url` de forma autoritativa (server-side, `security definer`), para que el paciente reciba el link de su cita sin necesitar acceso directo a la fila del profesional.
- **Anti-doble-reserva**: constraint `exclude using gist` sobre `appointments` (rango `tstzrange(starts_at, ends_at)` por `professional_id`, solo para citas `confirmed`) — a nivel de base de datos, no de aplicación.
- **Cálculo de slots al vuelo**: la disponibilidad no se materializa en una tabla; se calcula combinando `availability_rules` (reglas semanales recurrentes), `availability_exceptions` (bloqueos o aperturas puntuales) y las citas ya confirmadas, en `src/lib/scheduling/fetch-slots.ts`.

## Recordatorios (cron)

`src/app/api/cron/reminders/route.ts` busca citas `confirmed` sin `reminder_sent_at` que empiecen dentro de las próximas 24 horas, envía un email de recordatorio a cada paciente y marca `reminder_sent_at`. Corre diariamente vía Vercel Cron (ver `vercel.json`, `0 12 * * *` = 12:00 UTC = 08:00 en Chile en horario de invierno / 09:00 en horario de verano).

El endpoint exige el header `Authorization: Bearer $CRON_SECRET`; sin ese header responde `401`.

Para probarlo en local:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
# → {"sent": n}
# segunda llamada sobre las mismas citas → {"sent": 0}
```

## Deploy en Vercel

1. Importar el repositorio en [Vercel](https://vercel.com/new).
2. Configurar las variables de entorno del proyecto (las mismas de `.env.local`, incluyendo un `CRON_SECRET` aleatorio y distinto al de desarrollo).
3. Configurar el dominio del proyecto.
4. El cron de recordatorios se registra automáticamente a partir de `vercel.json` — no requiere configuración adicional en el dashboard.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Build de producción. |
| `npm run start` | Sirve el build de producción. |
| `npm run lint` | ESLint. |
| `npm run test` | Tests unitarios (Vitest). |
| `npm run seed` | Carga los datos de demo (ver arriba). |

## Fase 2 (fuera de alcance de este release)

- **Pagos**: la tabla `payments` ya existe en el schema (`supabase/migrations/0001_schema.sql`, ligada 1:1 a `appointments`, con `status`, `provider` y `external_id`), pero no hay integración activa. La idea es introducir una interfaz `PaymentProvider` (ej. Webpay/Flow/Mercado Pago) que abstraiga el cobro y actualice esta tabla, sin acoplar el resto de la app a un proveedor específico.
- **WhatsApp**: notificaciones y recordatorios por WhatsApp (además o en vez de email), probablemente vía un proveedor tipo Twilio o la API de WhatsApp Business.
- **Ficha clínica**: hoy `session_notes` guarda notas de sesión simples, privadas por profesional. Una ficha clínica estructurada (antecedentes, evolución, adjuntos) es un desarrollo mayor a futuro.

## Limitaciones conocidas (follow-ups)

- **Validación de variables de entorno al arrancar**: hoy las env vars (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) se leen con `!` donde se usan; si falta una, el error aparece tarde y de forma poco clara. Falta un chequeo temprano (por ejemplo con `zod`) que falle rápido y con un mensaje explícito.
- **Validación de dígito verificador de RUT**: el registro solo valida largo mínimo (`rut.min(8)`), no el dígito verificador real. Un RUT con formato válido pero DV incorrecto pasa el formulario.
- **Batching de settings**: `src/lib/settings.ts` hace una consulta por cada `getSetting` individual; en páginas que leen varias claves (ej. `cancellation_window_hours` y `center_phone`) esto son round-trips separados en vez de una sola consulta agrupada.
- **Sin test adicional de cambio de hora (DST)** más allá del caso agregado en esta ronda (`tests/scheduling/slots.dst.test.ts`, primavera en Chile); faltaría cobertura del otro extremo (otoño / retraso de reloj) y de otros husos horarios si el centro llegase a operar en más de uno.
- **Paginación de `listUsers` en el seed**: `scripts/seed.ts` asume que todos los usuarios existentes caben en una sola página de `auth.admin.listUsers()`; en un proyecto con muchos usuarios, la búsqueda "¿ya existe este email?" podría no encontrar coincidencias más allá de la primera página.
- **Creación de profesional no transaccional**: crear un profesional implica varios pasos (usuario en Auth, fila en `professionals`, reglas de disponibilidad) sin una transacción que los agrupe; un fallo a mitad de camino puede dejar estado parcial que hay que limpiar a mano.
- **Focus management del wizard**: el flujo de reserva (selección de profesional → modalidad → horario → confirmación) no mueve el foco del teclado entre pasos, lo que degrada la experiencia con lectores de pantalla y navegación por teclado.
