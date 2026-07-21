import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: { default: "Mi cuenta", template: "%s | Magnolia" },
};

export default async function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["patient"], "/mi-cuenta");

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-heading text-xl text-sage-dark">
              Magnolia
            </Link>
            <span className="hidden text-ink/30 sm:inline">/</span>
            <span className="hidden font-heading text-lg text-ink sm:inline">Mi cuenta</span>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/mi-cuenta/citas" className="text-ink/70 hover:text-sage-dark">
              Mis citas
            </Link>
            <Link href="/reservar" className="text-ink/70 hover:text-sage-dark">
              Reservar nueva hora
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-ink/15 px-4 py-1.5 text-ink/70 transition hover:bg-ink/5 hover:text-ink"
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">{children}</main>
    </div>
  );
}
