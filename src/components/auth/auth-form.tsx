"use client";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

type Field = { name: string; label: string; type?: string; placeholder?: string };
export function AuthForm({ action, fields, submitLabel }: {
  action: (prev: unknown, fd: FormData) => Promise<{ error?: string } | void>;
  fields: Field[]; submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action as never, undefined) as [{ error?: string; ok?: boolean } | undefined, (fd: FormData) => void, boolean];
  const next = useSearchParams().get("next") ?? "";
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {fields.map(f => (
        <div key={f.name} className="space-y-1">
          <label htmlFor={f.name} className="text-sm font-medium">{f.label}</label>
          <input id={f.name} name={f.name} type={f.type ?? "text"} placeholder={f.placeholder}
                 className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm" required />
        </div>
      ))}
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-sage-dark">Si el correo existe, te enviamos un link de recuperación.</p>}
      <button disabled={pending} className="w-full rounded-md bg-sage px-4 py-2 text-white hover:bg-sage-dark disabled:opacity-50">
        {pending ? "Un momento…" : submitLabel}
      </button>
    </form>
  );
}
