import { Suspense } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Crear cuenta" };
export default function RegistroPage() {
  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl">Crear cuenta</h1>
      <Suspense>
        <AuthForm action={signUp} submitLabel="Crear cuenta" fields={[
          { name: "full_name", label: "Nombre completo" },
          { name: "rut", label: "RUT" },
          { name: "phone", label: "Teléfono" },
          { name: "email", label: "Email", type: "email" },
          { name: "password", label: "Contraseña", type: "password" },
        ]} />
      </Suspense>
      <p className="mt-4 text-sm">¿Ya tienes cuenta? <Link className="underline" href="/login">Inicia sesión</Link></p>
    </div>
  );
}
