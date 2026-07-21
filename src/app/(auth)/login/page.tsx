import { Suspense } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Iniciar sesión" };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl">Iniciar sesión</h1>
      {error === "link-invalido" && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          El link ya no es válido o expiró. Solicita uno nuevo desde &quot;Olvidé mi contraseña&quot;.
        </p>
      )}
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
