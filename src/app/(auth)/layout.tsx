import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Acceso", template: "%s | Magnolia" },
  description: "Inicia sesión o crea tu cuenta en Magnolia.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-cream px-4 py-12">
      <Link href="/" className="font-heading text-xl text-sage-dark">
        Magnolia
      </Link>
      {children}
    </div>
  );
}
