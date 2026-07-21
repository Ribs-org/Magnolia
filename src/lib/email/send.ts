import "server-only";
import { Resend } from "resend";

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[email simulado] to=${opts.to} subject=${opts.subject}`);
      return;
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: process.env.EMAIL_FROM ?? "Magnolia <onboarding@resend.dev>", ...opts });
  } catch (e) {
    console.error("[email] fallo al enviar:", e); // best-effort: nunca propagar
  }
}
