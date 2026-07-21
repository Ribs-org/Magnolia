import Link from "next/link";
import type { Metadata } from "next";
import { getPanelContext } from "@/lib/panel";
import { signOut } from "@/lib/actions/auth";
import type { Role } from "@/lib/types";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Magnolia" },
};

const NAV_LINKS: { href: string; label: string; roles: Role[] }[] = [
  { href: "/panel", label: "Agenda", roles: ["professional", "admin"] },
  { href: "/panel/disponibilidad", label: "Disponibilidad", roles: ["professional", "admin"] },
  { href: "/panel/pacientes", label: "Pacientes", roles: ["admin"] },
  { href: "/panel/profesionales", label: "Profesionales", roles: ["admin"] },
  { href: "/panel/configuracion", label: "Configuración", roles: ["admin"] },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { profile, role } = await getPanelContext();
  const links = NAV_LINKS.filter((l) => l.roles.includes(role));
  const roleLabel = role === "admin" ? "Administrador/a" : "Profesional";

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="font-heading text-xl text-sage-dark">
            Magnolia <span className="text-ink/40">· Panel</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right leading-tight">
              <p className="text-ink">{profile.full_name}</p>
              <p className="text-xs text-ink/50">{roleLabel}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-ink/15 px-4 py-1.5 text-ink/70 transition hover:bg-ink/5 hover:text-ink"
              >
                Salir
              </button>
            </form>
          </div>
        </div>

        {/* Tabs — visibles solo en mobile; en desktop se usa el sidebar */}
        <nav className="flex gap-1 overflow-x-auto px-4 pb-3 text-sm md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-4 py-1.5 text-ink/70 transition hover:bg-sage/10 hover:text-sage-dark"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:py-10">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="flex flex-col gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-ink/70 transition hover:bg-sage/10 hover:text-sage-dark"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
