# Magnolia — Diseño de la plataforma del centro médico

**Fecha:** 2026-07-20
**Estado:** Aprobado por el usuario (diseño conversacional); pendiente revisión del documento escrito.

## 1. Contexto y objetivo

Magnolia es un centro médico pequeño de salud mental (psicólogos y psiquiatras) que hoy agenda con Reservo. Se busca una solución web completa y propia que reemplace a Reservo: sitio público, auto-reserva online, portal de pacientes y panel interno para profesionales y administración.

**Criterio de éxito:** un paciente puede descubrir el centro, elegir profesional, reservar una hora real y recibir confirmación por email sin intervención humana; la secretaria y los profesionales gestionan toda su operación diaria desde el panel.

## 2. Alcance

### Incluido (fase 1)
- Sitio público: home, equipo (con página por profesional), flujo de reserva, contacto.
- Auto-reserva online con confirmación instantánea.
- Cuentas de paciente (email + contraseña vía Supabase Auth) con portal: ver citas, reagendar, cancelar.
- Regla de cancelación/reagendamiento: hasta 24 h antes (configurable). Dentro de la ventana, solo el centro puede modificar.
- Modalidades presencial y online; las citas online guardan un link de videollamada (Meet/Zoom del profesional).
- Panel del profesional: disponibilidad recurrente, bloqueos, agenda propia, estados de cita (completada / no-show), notas privadas de sesión.
- Panel de administración: agenda global, CRUD de citas para cualquier paciente, gestión de profesionales y horarios, gestión de pacientes, configuración (ventana de cancelación, datos del centro).
- Emails transaccionales (Resend): confirmación, cancelación, reagendamiento, recordatorio 24 h antes (Vercel Cron).
- Estilo visual cálido y sereno (paleta crema / verdes-lilas suaves evocando la magnolia).

### Excluido (fase 2, pero considerado en el diseño)
- **Pago online:** hoy Reservo cobra con un link. Se diseña una interfaz `PaymentProvider` desacoplada y la tabla `payments`; fase 1 opera "sin pago online". La pasarela (Mercado Pago / Webpay / Flow) se decide después.
- **WhatsApp:** recordatorios por WhatsApp Business API.
- **Ficha clínica formal:** solo notas simples por sesión en fase 1.

## 3. Stack técnico

| Capa | Elección |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Base de datos / Auth | Supabase (Postgres + Auth + Row Level Security) |
| Email | Resend |
| Jobs | Vercel Cron (recordatorios diarios) |
| Deploy | Vercel |
| Tests | Vitest (lógica pura) |

El usuario creará el proyecto Supabase y entregará las credenciales (URL, anon key, service role key). Migraciones SQL versionadas en `supabase/migrations`.

## 4. Estructura de rutas

| Área | Rutas | Acceso |
|---|---|---|
| Pública | `/`, `/equipo`, `/equipo/[slug]`, `/reservar`, `/contacto` | Todos |
| Auth | `/login`, `/registro`, `/recuperar` | Anónimos |
| Portal paciente | `/mi-cuenta`, `/mi-cuenta/citas` | Rol `patient` |
| Panel interno | `/panel` (agenda), `/panel/disponibilidad`, `/panel/pacientes`, `/panel/profesionales`*, `/panel/configuracion`* | `professional` y `admin` (* solo admin) |

El wizard `/reservar`: especialidad → profesional → modalidad → día/hora → sesión (login o registro inline) → confirmación.

## 5. Modelo de datos

- **profiles** (1:1 con `auth.users`): `full_name`, `rut`, `phone`, `role` (`patient` | `professional` | `admin`).
- **professionals**: `profile_id`, `slug`, `specialty` (`psychologist` | `psychiatrist`), `photo_url`, `bio`, `modalities` (presencial/online), `session_duration_min`, `session_price`, `meeting_url`, `is_active`.
- **availability_rules**: `professional_id`, `weekday`, `start_time`, `end_time`, `modality`.
- **availability_exceptions**: `professional_id`, `date`, rango horario opcional, `kind` (`blocked` | `extra_open`), motivo.
- **appointments**: `patient_id`, `professional_id`, `starts_at`, `ends_at`, `modality`, `status` (`confirmed` | `cancelled_by_patient` | `cancelled_by_center` | `completed` | `no_show`), `meeting_url`, `source` (`web` | `admin`), timestamps de cancelación.
- **session_notes**: `appointment_id`, `professional_id`, `body`. Visible solo para su autor.
- **payments** (fase 2): `appointment_id`, `amount`, `currency`, `status`, `provider`, `external_id`.
- **settings**: clave/valor (ventana de cancelación en horas, datos de contacto del centro).

**Disponibilidad calculada al vuelo:** slots = reglas recurrentes − excepciones − citas activas, computados en el servidor para un rango de fechas. No hay tabla de slots pre-generados.

**Anti doble-reserva:** constraint de exclusión en Postgres (`EXCLUDE USING gist` sobre `professional_id` + rango `tstzrange(starts_at, ends_at)` para citas con estado activo). Si dos personas confirman el mismo slot a la vez, la segunda inserción falla y el wizard pide elegir otra hora.

## 6. Flujos clave

- **Reserva:** wizard consulta disponibilidad en vivo; la confirmación corre en una Server Action que revalida el slot y las reglas de negocio antes de insertar. Email de confirmación al paciente.
- **Cancelar/reagendar (paciente):** permitido si faltan ≥ 24 h (leído de `settings`). Reagendar = cancelar + nueva reserva en la misma operación. Emails correspondientes.
- **Admin:** crea/mueve/cancela citas de cualquier paciente (para quienes llaman por teléfono), puede saltarse la ventana de 24 h, gestiona profesionales (alta/baja/edición de perfil público), horarios y pacientes. Vista de agenda global por día y semana.
- **Profesional:** CRUD de sus reglas de disponibilidad y bloqueos, agenda propia, marca `completed` / `no_show`, escribe/edita su nota por sesión.
- **Recordatorios:** Vercel Cron diario → busca citas confirmadas de las próximas 24 h sin recordatorio enviado → envía email y marca `reminder_sent_at`.

## 7. Seguridad

- **RLS en todas las tablas.** Paciente: solo sus citas y su perfil. Profesional: sus citas, sus reglas, sus notas. Admin: todo excepto `session_notes` (privacidad clínica: solo el autor las lee).
- Mutaciones vía Server Actions con validación de negocio en el servidor (Zod para inputs); el cliente nunca decide qué está permitido.
- `service_role` key solo en el servidor (cron, operaciones administrativas puntuales); nunca expuesta al cliente.
- Los roles `professional` y `admin` se asignan solo desde administración (no hay auto-registro con esos roles).

## 8. Manejo de errores

- Slot tomado en carrera: mensaje claro y recarga de horarios disponibles.
- Fallo de email: la cita no se revierte; el envío se registra y puede reintentarse (el email es best-effort, la reserva es la fuente de verdad).
- Sesión expirada en el wizard: se conserva la selección y se retoma tras el login.

## 9. Testing

Vitest sobre la lógica pura extraída a funciones sin IO: generación de slots (reglas ± excepciones ± citas), ventana de cancelación, solapamientos, formateo de fechas en zona `America/Santiago`. Smoke test manual guiado por seed de datos (profesionales y horarios de ejemplo).

## 10. Deployment

Repo GitHub → Vercel (framework preset Next.js). Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`. `vercel.json` define el cron de recordatorios. Migraciones y seed reproducibles con Supabase CLI.
