"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formatInTimeZone } from "date-fns-tz";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchSlotsForRange } from "@/lib/scheduling/fetch-slots";
import { sendEmail } from "@/lib/email/send";
import { bookingCancelledEmail, bookingConfirmedEmail, bookingRescheduledEmail } from "@/lib/email/templates";
import { CENTER_TZ } from "@/lib/constants";
import type { Modality, Specialty } from "@/lib/types";

type ActionResult = { ok: boolean; error?: string };

async function patientEmail(patientId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(patientId);
  return data?.user?.email ?? null;
}

// ---------- Nueva cita (admin) ----------

const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  professionalId: z.string().uuid(),
  startsAt: z.string().datetime(),
  modality: z.enum(["in_person", "online"]),
});

export async function adminCreateAppointment(input: {
  patientId: string;
  professionalId: string;
  startsAt: string;
  modality: Modality;
}): Promise<{ ok: true; appointmentId: string } | { ok: false; error: string }> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  await requireRole(["admin"]);
  const { patientId, professionalId, startsAt, modality } = parsed.data;

  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", patientId)
    .eq("role", "patient")
    .maybeSingle();
  if (!patient) return { ok: false, error: "Paciente no encontrado" };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, full_name, modalities, is_active")
    .eq("id", professionalId)
    .maybeSingle();
  if (!pro || !pro.is_active) return { ok: false, error: "Profesional no disponible" };
  if (!pro.modalities.includes(modality)) return { ok: false, error: "Modalidad no disponible" };

  // El admin puede agendar para hoy: sin anticipación mínima.
  const date = formatInTimeZone(new Date(startsAt), CENTER_TZ, "yyyy-MM-dd");
  const days = await fetchSlotsForRange(professionalId, date, date, { minLeadMinutes: 0 });
  const slot = (days[date] ?? []).find(
    (s) => s.startsAt === new Date(startsAt).toISOString() && s.modality.includes(modality)
  );
  if (!slot) return { ok: false, error: "Esa hora ya no está disponible" };

  const { data: appt, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      professional_id: professionalId,
      starts_at: slot.startsAt,
      ends_at: slot.endsAt,
      modality,
      source: "admin",
    })
    .select("id, meeting_url")
    .single();

  if (error) {
    if (error.code === "23P01") return { ok: false, error: "Ese horario ya está ocupado" };
    console.error("[admin] createAppointment:", error);
    return { ok: false, error: "No se pudo crear la cita. Intenta de nuevo." };
  }

  try {
    const email = await patientEmail(patientId);
    if (email) {
      const tmpl = bookingConfirmedEmail({
        patientName: patient.full_name,
        professionalName: pro.full_name,
        startsAt: slot.startsAt,
        modality,
        meetingUrl: appt.meeting_url,
      });
      await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html });
    }
  } catch (e) {
    console.error("[admin] email:", e);
  }

  revalidatePath("/panel");
  revalidatePath("/panel/pacientes");
  return { ok: true, appointmentId: appt.id };
}

// ---------- Cancelar (centro) ----------

export async function adminCancelAppointment(appointmentId: string): Promise<ActionResult> {
  const parsedId = z.string().uuid().safeParse(appointmentId);
  if (!parsedId.success) return { ok: false, error: "Cita inválida" };
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("*, professional:professionals(full_name)")
    .eq("id", parsedId.data)
    .eq("status", "confirmed")
    .maybeSingle();
  if (!appt) return { ok: false, error: "Cita no encontrada o ya no está confirmada" };

  const { data: patient } = await supabase.from("profiles").select("full_name").eq("id", appt.patient_id).maybeSingle();

  const { data: updated, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled_by_center", cancelled_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .eq("status", "confirmed")
    .select("id");
  if (error) return { ok: false, error: "No se pudo cancelar. Intenta de nuevo." };
  if (!updated || updated.length === 0) {
    return { ok: false, error: "La cita ya no se puede cancelar (su estado cambió). Actualiza la página." };
  }

  try {
    const email = await patientEmail(appt.patient_id);
    if (email) {
      const tmpl = bookingCancelledEmail({
        patientName: patient?.full_name ?? "",
        professionalName: appt.professional?.full_name ?? "",
        startsAt: appt.starts_at,
        cancelledBy: "center",
      });
      await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html });
    }
  } catch (e) {
    console.error("[admin] email:", e);
  }

  revalidatePath("/panel");
  revalidatePath("/panel/pacientes");
  return { ok: true };
}

// ---------- Mover ----------

const moveSchema = z.object({
  appointmentId: z.string().uuid(),
  newStartsAt: z.string().datetime(),
});

export async function adminMoveAppointment(appointmentId: string, newStartsAt: string): Promise<ActionResult> {
  const parsed = moveSchema.safeParse({ appointmentId, newStartsAt });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("*, professional:professionals(full_name)")
    .eq("id", parsed.data.appointmentId)
    .eq("status", "confirmed")
    .maybeSingle();
  if (!appt) return { ok: false, error: "Cita no encontrada o ya no está confirmada" };

  const { data: patient } = await supabase.from("profiles").select("full_name").eq("id", appt.patient_id).maybeSingle();

  const date = formatInTimeZone(new Date(parsed.data.newStartsAt), CENTER_TZ, "yyyy-MM-dd");
  const days = await fetchSlotsForRange(appt.professional_id, date, date, { minLeadMinutes: 0 });
  const slot = (days[date] ?? []).find(
    (s) => s.startsAt === new Date(parsed.data.newStartsAt).toISOString() && s.modality.includes(appt.modality)
  );
  if (!slot) return { ok: false, error: "Esa hora ya no está disponible" };

  const { data: updated, error } = await supabase
    .from("appointments")
    .update({ starts_at: slot.startsAt, ends_at: slot.endsAt })
    .eq("id", parsed.data.appointmentId)
    .eq("status", "confirmed")
    .select("id, meeting_url");

  if (error) {
    if (error.code === "23P01") return { ok: false, error: "Ese horario ya está ocupado" };
    console.error("[admin] moveAppointment:", error);
    return { ok: false, error: "No se pudo mover la cita. Intenta de nuevo." };
  }
  if (!updated || updated.length === 0) {
    return { ok: false, error: "La cita ya no se puede mover (su estado cambió). Actualiza la página." };
  }

  try {
    const email = await patientEmail(appt.patient_id);
    if (email) {
      const tmpl = bookingRescheduledEmail({
        patientName: patient?.full_name ?? "",
        professionalName: appt.professional?.full_name ?? "",
        oldStartsAt: appt.starts_at,
        newStartsAt: slot.startsAt,
        modality: appt.modality,
        meetingUrl: updated[0].meeting_url,
      });
      await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html });
    }
  } catch (e) {
    console.error("[admin] email:", e);
  }

  revalidatePath("/panel");
  revalidatePath("/panel/pacientes");
  return { ok: true };
}

// ---------- Búsqueda de pacientes (para el picker de nueva cita) ----------

const searchPatientsSchema = z.object({ query: z.string().max(200) });

export async function adminSearchPatients(
  query: string
): Promise<{ ok: true; patients: { id: string; full_name: string; rut: string | null; phone: string | null }[] } | { ok: false; error: string }> {
  const parsed = searchPatientsSchema.safeParse({ query });
  if (!parsed.success) return { ok: false, error: "Búsqueda inválida" };
  await requireRole(["admin"]);

  const supabase = await createClient();
  const q = parsed.data.query.trim();
  let request = supabase
    .from("profiles")
    .select("id, full_name, rut, phone")
    .eq("role", "patient")
    .order("full_name", { ascending: true })
    .limit(20);
  if (q) {
    const like = `%${q.replace(/[%,]/g, "")}%`;
    request = request.or(`full_name.ilike.${like},rut.ilike.${like},phone.ilike.${like}`);
  }
  const { data, error } = await request;
  if (error) return { ok: false, error: "No se pudo buscar pacientes" };
  return { ok: true, patients: data ?? [] };
}

// ---------- Pacientes ----------

const createPatientSchema = z.object({
  fullName: z.string().min(1, "Nombre requerido").max(200),
  rut: z.string().max(20).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email("Email inválido"),
});

export async function adminCreatePatient(input: {
  fullName: string;
  rut?: string;
  phone?: string;
  email: string;
}): Promise<{ ok: boolean; error?: string; patientId?: string }> {
  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  await requireRole(["admin"]);

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    email_confirm: true,
    password: randomUUID(),
    user_metadata: {
      full_name: parsed.data.fullName,
      rut: parsed.data.rut ?? null,
      phone: parsed.data.phone ?? null,
    },
  });
  if (error || !data?.user) {
    console.error("[admin] createPatient:", error);
    return { ok: false, error: "No se pudo crear el paciente (¿el email ya está registrado?)" };
  }

  revalidatePath("/panel/pacientes");
  return { ok: true, patientId: data.user.id };
}

// ---------- Profesionales ----------

const upsertProfessionalSchema = z
  .object({
    profileId: z.string().uuid().optional(),
    email: z.string().email("Email inválido").optional(),
    fullName: z.string().min(1, "Nombre requerido").max(200),
    slug: z
      .string()
      .min(2, "URL demasiado corta")
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "URL inválida (usa minúsculas, números y guiones)"),
    specialty: z.enum(["psychologist", "psychiatrist"]),
    bio: z.string().max(4000).default(""),
    modalities: z.array(z.enum(["in_person", "online"])).min(1, "Selecciona al menos una modalidad"),
    sessionDurationMin: z.number().int().min(15).max(180),
    sessionPrice: z.number().int().min(0),
    meetingUrl: z.string().trim().max(500).optional().nullable(),
    photoUrl: z.string().trim().max(500).optional().nullable(),
    isActive: z.boolean(),
  })
  .refine((d) => !!d.profileId || !!d.email, {
    message: "Email requerido para crear un profesional nuevo",
    path: ["email"],
  });

export async function adminUpsertProfessional(input: {
  profileId?: string;
  email?: string;
  fullName: string;
  slug: string;
  specialty: Specialty;
  bio: string;
  modalities: Modality[];
  sessionDurationMin: number;
  sessionPrice: number;
  meetingUrl?: string | null;
  photoUrl?: string | null;
  isActive: boolean;
}): Promise<{ ok: boolean; error?: string; profileId?: string; professionalId?: string }> {
  const parsed = upsertProfessionalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  await requireRole(["admin"]);
  const data = parsed.data;

  // Todas las escrituras a `professionals` (y la lectura/escritura de meeting_url) pasan por el
  // cliente de service-role: la columna meeting_url está revocada para el cliente autenticado y
  // el cambio de rol en `profiles` requiere auth.uid() nulo para saltar el trigger de guarda.
  const admin = createAdminClient();

  let profileId = data.profileId;
  if (!profileId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: data.email!,
      email_confirm: true,
      password: randomUUID(),
      user_metadata: { full_name: data.fullName },
    });
    if (createErr || !created?.user) {
      console.error("[admin] upsertProfessional createUser:", createErr);
      return { ok: false, error: "No se pudo crear el usuario (¿el email ya está registrado?)" };
    }
    profileId = created.user.id;
    const { error: roleErr } = await admin
      .from("profiles")
      .update({ role: "professional", full_name: data.fullName })
      .eq("id", profileId);
    if (roleErr) {
      console.error("[admin] upsertProfessional role:", roleErr);
      return { ok: false, error: "El usuario se creó pero no se pudo asignar el rol de profesional" };
    }
  } else {
    const { error: nameErr } = await admin.from("profiles").update({ full_name: data.fullName }).eq("id", profileId);
    if (nameErr) console.error("[admin] upsertProfessional full_name sync:", nameErr);
  }

  const meetingUrl = data.meetingUrl && data.meetingUrl.length > 0 ? data.meetingUrl : null;
  const photoUrl = data.photoUrl && data.photoUrl.length > 0 ? data.photoUrl : null;

  const { data: pro, error: upsertErr } = await admin
    .from("professionals")
    .upsert(
      {
        profile_id: profileId,
        full_name: data.fullName,
        slug: data.slug,
        specialty: data.specialty,
        bio: data.bio,
        modalities: data.modalities,
        session_duration_min: data.sessionDurationMin,
        session_price: data.sessionPrice,
        meeting_url: meetingUrl,
        photo_url: photoUrl,
        is_active: data.isActive,
      },
      { onConflict: "profile_id" }
    )
    .select("id")
    .single();

  if (upsertErr) {
    if (upsertErr.code === "23505") return { ok: false, error: "Esa URL (slug) ya está en uso por otro profesional" };
    console.error("[admin] upsertProfessional professionals:", upsertErr);
    return { ok: false, error: "No se pudo guardar el profesional" };
  }

  revalidatePath("/panel/profesionales");
  revalidatePath(`/panel/profesionales/${pro.id}`);
  revalidatePath("/equipo");
  revalidatePath(`/equipo/${data.slug}`);
  return { ok: true, profileId, professionalId: pro.id };
}

// ---------- Configuración ----------

const SETTING_KEYS = ["cancellation_window_hours", "center_phone", "center_email", "center_address"] as const;

const updateSettingSchema = z
  .object({
    key: z.enum(SETTING_KEYS),
    value: z.string().min(1, "Valor requerido").max(500),
  })
  .refine((d) => d.key !== "cancellation_window_hours" || (/^\d+$/.test(d.value) && Number(d.value) > 0), {
    message: "Debe ser un número de horas mayor a 0",
    path: ["value"],
  })
  .refine((d) => d.key !== "center_email" || z.string().email().safeParse(d.value).success, {
    message: "Email inválido",
    path: ["value"],
  });

export async function updateSetting(key: string, value: string): Promise<ActionResult> {
  const parsed = updateSettingSchema.safeParse({ key, value });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("settings")
    .update({ value: parsed.data.value })
    .eq("key", parsed.data.key)
    .select("key");
  if (error) {
    console.error("[admin] updateSetting:", error);
    return { ok: false, error: "No se pudo guardar la configuración" };
  }
  if (!updated || updated.length === 0) return { ok: false, error: "Configuración no encontrada" };

  revalidatePath("/panel/configuracion");
  revalidatePath("/reservar");
  revalidatePath("/mi-cuenta/citas");
  return { ok: true };
}
