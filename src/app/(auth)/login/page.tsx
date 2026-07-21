import { Suspense } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Iniciar sesión" };
export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl">Iniciar sesión</h1>
      <Suspense>
        <AuthForm action={signIn} submitLabel="Entrar" fields={[
          { name: "email", label: "Email", type: "email" },
          { name: "password", label: "Contraseña", type: "password" },
        ]} />
      </Suspense>
      <p className="mt-4 text-sm">¿No tienes cuenta? <Link className="underline" href="/registro">Regístrate</Link></p>
      <p className="mt-1 text-sm"><Link className="underline" href="/recuperar">Olvidé mi contraseña</Link></p>
    </div>
  );
}
