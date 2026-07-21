/**
 * Seed de datos de demo para Magnolia.
 *
 * Uso: npm run seed  (requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY)
 *
 * Idempotente: antes de crear cada entidad busca si ya existe (por email o profesional)
 * y la omite si corresponde, así se puede correr varias veces sin duplicar datos.
 *
 * Usa @supabase/supabase-js directamente con la service role key (no el helper
 * "server-only" de src/lib/supabase/admin.ts, que solo puede importarse desde
 * código de servidor de Next.js).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local. Copia .env.example y complétalo."
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Role = "patient" | "professional" | "admin";
type Modality = "in_person" | "online";
type RuleModality = Modality | "both";
type Specialty = "psychologist" | "psychiatrist";

async function findUserByEmail(email: string) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureUser(params: {
  email: string;
  password: string;
  fullName: string;
  rut: string;
  phone: string;
  role: Role;
}): Promise<string> {
  const existing = await findUserByEmail(params.email);
  if (existing) {
    console.log(`↷ usuario ya existe, se omite: ${params.email}`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: { full_name: params.fullName, rut: params.rut, phone: params.phone },
  });
  if (error || !data.user) throw error ?? new Error(`createUser sin resultado para ${params.email}`);

  // El trigger on_auth_user_created crea la fila en profiles con role='patient' por defecto.
  if (params.role !== "patient") {
    const { error: updErr } = await admin.from("profiles").update({ role: params.role }).eq("id", data.user.id);
    if (updErr) throw updErr;
  }

  console.log(`✓ usuario creado: ${params.email} (role=${params.role})`);
  return data.user.id;
}

async function ensureProfessional(params: {
  profileId: string;
  fullName: string;
  slug: string;
  specialty: Specialty;
  bio: string;
  modalities: Modality[];
  sessionDurationMin: number;
  sessionPrice: number;
  meetingUrl?: string;
}): Promise<string> {
  const { data: existing, error: findErr } = await admin
    .from("professionals")
    .select("id")
    .eq("profile_id", params.profileId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) {
    console.log(`↷ profesional ya existe, se omite: ${params.slug}`);
    return existing.id;
  }

  const { data, error } = await admin
    .from("professionals")
    .insert({
      profile_id: params.profileId,
      full_name: params.fullName,
      slug: params.slug,
      specialty: params.specialty,
      bio: params.bio,
      modalities: params.modalities,
      session_duration_min: params.sessionDurationMin,
      session_price: params.sessionPrice,
      meeting_url: params.meetingUrl ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error(`insert professionals sin resultado para ${params.slug}`);

  console.log(`✓ profesional creado: ${params.slug}`);
  return data.id;
}

async function ensureAvailabilityRules(
  professionalId: string,
  slug: string,
  rules: { weekday: number; startTime: string; endTime: string; modality: RuleModality }[]
) {
  const { data: existing, error } = await admin
    .from("availability_rules")
    .select("id")
    .eq("professional_id", professionalId)
    .limit(1);
  if (error) throw error;
  if (existing && existing.length > 0) {
    console.log(`↷ reglas de disponibilidad ya existen, se omiten: ${slug}`);
    return;
  }

  const { error: insErr } = await admin.from("availability_rules").insert(
    rules.map((r) => ({
      professional_id: professionalId,
      weekday: r.weekday,
      start_time: r.startTime,
      end_time: r.endTime,
      modality: r.modality,
    }))
  );
  if (insErr) throw insErr;
  console.log(`✓ reglas de disponibilidad creadas: ${slug} (${rules.length})`);
}

async function main() {
  console.log("Seed Magnolia — iniciando...\n");

  // ---------- Admin ----------
  await ensureUser({
    email: "admin@magnolia.cl",
    password: "magnolia-admin-1234",
    fullName: "Admin Magnolia",
    rut: "11.111.111-1",
    phone: "+56 9 1111 1111",
    role: "admin",
  });

  // ---------- Profesionales ----------
  const carolinaFullName = "Carolina Méndez";
  const carolinaProfileId = await ensureUser({
    email: "carolina.mendez@magnolia.cl",
    password: "magnolia-pro-1234",
    fullName: carolinaFullName,
    rut: "12.345.678-9",
    phone: "+56 9 2222 2222",
    role: "professional",
  });
  const carolinaId = await ensureProfessional({
    profileId: carolinaProfileId,
    fullName: carolinaFullName,
    slug: "carolina-mendez",
    specialty: "psychologist",
    bio:
      "Psicóloga clínica con más de 10 años de experiencia en terapia de adultos. Se especializa en ansiedad, duelo y procesos de cambio vital. Su enfoque combina terapia cognitivo-conductual con un espacio cálido y sin juicios.",
    modalities: ["in_person", "online"],
    sessionDurationMin: 50,
    sessionPrice: 45000,
  });
  await ensureAvailabilityRules(carolinaId, "carolina-mendez", [
    { weekday: 1, startTime: "09:00", endTime: "13:00", modality: "both" },
    { weekday: 2, startTime: "09:00", endTime: "13:00", modality: "both" },
    { weekday: 3, startTime: "09:00", endTime: "13:00", modality: "both" },
    { weekday: 4, startTime: "09:00", endTime: "13:00", modality: "both" },
    { weekday: 5, startTime: "09:00", endTime: "13:00", modality: "both" },
  ]);

  const javierFullName = "Javier Ríos";
  const javierProfileId = await ensureUser({
    email: "javier.rios@magnolia.cl",
    password: "magnolia-pro-1234",
    fullName: javierFullName,
    rut: "13.456.789-0",
    phone: "+56 9 3333 3333",
    role: "professional",
  });
  const javierId = await ensureProfessional({
    profileId: javierProfileId,
    fullName: javierFullName,
    slug: "javier-rios",
    specialty: "psychologist",
    bio:
      "Psicólogo especializado en terapia online para adultos jóvenes, con foco en estrés laboral y regulación emocional. Trabaja con un enfoque breve y orientado a objetivos concretos.",
    modalities: ["online"],
    sessionDurationMin: 50,
    sessionPrice: 40000,
    meetingUrl: "https://meet.google.com/xxx-demo-jrios",
  });
  await ensureAvailabilityRules(javierId, "javier-rios", [
    { weekday: 1, startTime: "14:00", endTime: "19:00", modality: "online" },
    { weekday: 3, startTime: "14:00", endTime: "19:00", modality: "online" },
    { weekday: 5, startTime: "14:00", endTime: "19:00", modality: "online" },
  ]);

  const antoniaFullName = "Antonia Silva";
  const antoniaProfileId = await ensureUser({
    email: "antonia.silva@magnolia.cl",
    password: "magnolia-pro-1234",
    fullName: antoniaFullName,
    rut: "14.567.890-1",
    phone: "+56 9 4444 4444",
    role: "professional",
  });
  const antoniaId = await ensureProfessional({
    profileId: antoniaProfileId,
    fullName: antoniaFullName,
    slug: "antonia-silva",
    specialty: "psychiatrist",
    bio:
      "Psiquiatra con experiencia en evaluación diagnóstica y manejo farmacológico de trastornos del ánimo y ansiedad. Prioriza las consultas presenciales para un seguimiento clínico más completo.",
    modalities: ["in_person"],
    sessionDurationMin: 30,
    sessionPrice: 70000,
  });
  await ensureAvailabilityRules(antoniaId, "antonia-silva", [
    { weekday: 2, startTime: "09:00", endTime: "14:00", modality: "in_person" },
    { weekday: 4, startTime: "09:00", endTime: "14:00", modality: "in_person" },
  ]);

  // ---------- Paciente demo ----------
  await ensureUser({
    email: "paciente@ejemplo.cl",
    password: "magnolia-paciente-1234",
    fullName: "Paciente Ejemplo",
    rut: "15.678.901-2",
    phone: "+56 9 5555 5555",
    role: "patient",
  });

  console.log("\nSeed completado.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\nError en el seed:", e);
    process.exit(1);
  });
