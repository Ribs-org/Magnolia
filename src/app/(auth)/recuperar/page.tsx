import { Suspense } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Recuperar contraseña" };
export default function RecuperarPage() {
  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl">Recuperar contraseña</h1>
      <Suspense>
        <AuthForm action={requestPasswordReset} submitLabel="Enviar link de recuperación" fields={[
          { name: "email", label: "Email", type: "email" },
        ]} />
      </Suspense>
      <p className="mt-4 text-sm"><Link className="underline" href="/login">Volver a iniciar sesión</Link></p>
    </div>
  );
}
