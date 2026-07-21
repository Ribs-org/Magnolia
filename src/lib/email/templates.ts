import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { CENTER_ADDRESS, CENTER_NAME, CENTER_TZ } from "@/lib/constants";
import type { Modality } from "@/lib/types";

interface EmailTemplate {
  subject: string;
  html: string;
}

function formatDateEs(iso: string): string {
  const formatted = formatInTimeZone(iso, CENTER_TZ, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function modalityLine(modality: Modality, meetingUrl?: string | null): string {
  if (modality === "online") {
    return meetingUrl
      ? `Es una sesión online. Puedes unirte con este link: <a href="${meetingUrl}" style="color:#465A4B;">${meetingUrl}</a>`
      : "Es una sesión online. Te enviaremos el link antes de la sesión.";
  }
  return `Es una sesión presencial, en nuestra dirección: ${CENTER_ADDRESS}.`;
}

function shell(heading: string, bodyHtml: string): string {
  return `
<div style="background-color:#FAF7F2;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#333333;">
  <div style="max-width:480px;margin:0 auto;background-color:#FFFFFF;border-radius:12px;padding:32px;">
    <h1 style="color:#465A4B;font-size:22px;margin:0 0 16px 0;">${heading}</h1>
    ${bodyHtml}
    <p style="margin-top:32px;color:#465A4B;">— Equipo ${CENTER_NAME}</p>
  </div>
</div>`.trim();
}

export function bookingConfirmedEmail(args: {
  patientName: string;
  professionalName: string;
  startsAt: string;
  modality: Modality;
  meetingUrl?: string | null;
}): EmailTemplate {
  const { patientName, professionalName, startsAt, modality, meetingUrl } = args;
  const when = formatDateEs(startsAt);
  const html = shell(
    "Tu reserva está confirmada",
    `<p>Hola ${patientName},</p>
     <p>Tu sesión con <strong>${professionalName}</strong> quedó confirmada para el <strong>${when}</strong>.</p>
     <p>${modalityLine(modality, meetingUrl)}</p>
     <p>Si necesitas cancelar o reagendar, puedes hacerlo desde tu cuenta.</p>`
  );
  return { subject: "Tu reserva en Magnolia está confirmada", html };
}

export function bookingCancelledEmail(args: {
  patientName: string;
  professionalName: string;
  startsAt: string;
  cancelledBy: "patient" | "center";
}): EmailTemplate {
  const { patientName, professionalName, startsAt, cancelledBy } = args;
  const when = formatDateEs(startsAt);
  const who = cancelledBy === "patient" ? "Cancelaste" : `El equipo de ${CENTER_NAME} canceló`;
  const html = shell(
    "Tu reserva fue cancelada",
    `<p>Hola ${patientName},</p>
     <p>${who} la sesión con <strong>${professionalName}</strong> que estaba agendada para el <strong>${when}</strong>.</p>
     <p>Si fue un error o quieres agendar una nueva hora, puedes hacerlo desde tu cuenta.</p>`
  );
  return { subject: "Tu reserva en Magnolia fue cancelada", html };
}

export function bookingRescheduledEmail(args: {
  patientName: string;
  professionalName: string;
  oldStartsAt: string;
  newStartsAt: string;
  modality: Modality;
  meetingUrl?: string | null;
}): EmailTemplate {
  const { patientName, professionalName, oldStartsAt, newStartsAt, modality, meetingUrl } = args;
  const oldWhen = formatDateEs(oldStartsAt);
  const newWhen = formatDateEs(newStartsAt);
  const html = shell(
    "Tu reserva fue reagendada",
    `<p>Hola ${patientName},</p>
     <p>Tu sesión con <strong>${professionalName}</strong> se movió del ${oldWhen} al <strong>${newWhen}</strong>.</p>
     <p>${modalityLine(modality, meetingUrl)}</p>`
  );
  return { subject: "Tu reserva en Magnolia fue reagendada", html };
}

export function reminderEmail(args: {
  patientName: string;
  professionalName: string;
  startsAt: string;
  modality: Modality;
  meetingUrl?: string | null;
}): EmailTemplate {
  const { patientName, professionalName, startsAt, modality, meetingUrl } = args;
  const when = formatDateEs(startsAt);
  const html = shell(
    "Te esperamos mañana",
    `<p>Hola ${patientName},</p>
     <p>Este es un recordatorio de tu sesión con <strong>${professionalName}</strong>, el <strong>${when}</strong>. Te esperamos mañana.</p>
     <p>${modalityLine(modality, meetingUrl)}</p>`
  );
  return { subject: "Recordatorio: tu sesión en Magnolia es mañana", html };
}
