import Link from "next/link";
import { getSessionProfile } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getSessionProfile();
  const accountHref = !session ? "/login" : session.profile.role === "patient" ? "/mi-cuenta" : "/panel";
  const accountLabel = !session ? "Iniciar sesión" : session.profile.role === "patient" ? "Mi cuenta" : "Panel";
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-heading text-2xl text-sage-dark">Magnolia</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/equipo" className="hover:text-sage-dark">Nuestro equipo</Link>
          <Link href="/contacto" className="hover:text-sage-dark">Contacto</Link>
          <Link href={accountHref} className="hover:text-sage-dark">{accountLabel}</Link>
          <Link href="/reservar" className="rounded-full bg-sage px-5 py-2 text-white hover:bg-sage-dark">Reservar hora</Link>
        </nav>
      </div>
    </header>
  );
}
