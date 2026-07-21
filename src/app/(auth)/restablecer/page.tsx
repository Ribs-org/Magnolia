"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";

function validate(password: string, confirm: string): string | null {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (password !== confirm) return "Las contraseñas no coinciden.";
  return null;
}

function isSessionError(error: { status?: number; name?: string; message?: string }): boolean {
  if (error.status === 401 || error.status === 403) return true;
  if (error.name === "AuthSessionMissingError") return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("session") || msg.includes("token") || msg.includes("jwt") || msg.includes("expired");
}

export default function RestablecerPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "expired">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validate(password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setPending(true);
    const supabase = createBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      if (isSessionError(updateError)) {
        setStatus("expired");
      } else {
        setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
      }
      return;
    }
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl">Contraseña actualizada ✔</h1>
        <p className="text-sm text-ink/70">Ya puedes usar tu nueva contraseña la próxima vez que inicies sesión.</p>
        <div className="mt-6 flex flex-col gap-2 text-sm">
          <Link className="underline" href="/mi-cuenta">Ir a mi cuenta</Link>
          <Link className="underline" href="/panel">Ir al panel</Link>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl">Restablecer contraseña</h1>
        <p className="text-sm text-red-700">El link expiró. Solicita uno nuevo.</p>
        <p className="mt-4 text-sm"><Link className="underline" href="/recuperar">Solicitar nuevo link</Link></p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl">Restablecer contraseña</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Nueva contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm" className="text-sm font-medium">Confirmar contraseña</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm"
            required
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          disabled={pending}
          className="w-full rounded-md bg-sage px-4 py-2 text-white hover:bg-sage-dark disabled:opacity-50"
        >
          {pending ? "Un momento…" : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}
