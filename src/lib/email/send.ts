import "server-only";
import { Resend } from "resend";

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[email simulado] to=${opts.to} subject=${opts.subject}`);
      return true;
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Magnolia <onboarding@resend.dev>",
      ...opts,
    });
    if (error) {
      console.error("[email] fallo al enviar:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] fallo al enviar:", e); // best-effort: nunca propagar
    return false;
  }
}
