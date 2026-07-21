"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: FormDataEntryValue | null, fallback: string): string {
  return typeof value === "string" && /^\/(?!\/|\\)/.test(value) ? value : fallback;
}

const credentials = z.object({ email: z.string().email("Email inválido"), password: z.string().min(8, "Mínimo 8 caracteres") });

export async function signIn(_prev: unknown, formData: FormData) {
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email o contraseña incorrectos" };
  redirect(safeNext(formData.get("next"), "/mi-cuenta"));
}

const signUpSchema = credentials.extend({
  full_name: z.string().min(3, "Ingresa tu nombre completo"),
  rut: z.string().min(8, "RUT inválido"),
  phone: z.string().min(8, "Teléfono inválido"),
});

export async function signUp(_prev: unknown, formData: FormData) {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password, full_name, rut, phone } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name, rut, phone } } });
  if (error) {
    console.error("[auth] signUp:", error.message);
    return { error: "No se pudo crear la cuenta. Verifica tus datos o intenta iniciar sesión." };
  }
  redirect(safeNext(formData.get("next"), "/mi-cuenta"));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: unknown, formData: FormData) {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Email inválido" };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/restablecer`,
  });
  return { error: undefined, ok: true as const };
}
