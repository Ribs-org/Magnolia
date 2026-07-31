import Link from "next/link";
import Image from "next/image";

const NAV = [
  { href: "/#quienes-somos", label: "Quiénes somos" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#equipo", label: "Equipo" },
  { href: "/#contacto", label: "Contacto" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-plum/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center" aria-label="Centro de Salud Magnolia">
          <Image
            src="/brand/logo-magnolia.png"
            alt="Centro de Salud Magnolia"
            width={240}
            height={109}
            priority
            className="h-12 w-auto"
          />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hidden text-ink/75 transition hover:text-plum sm:block">
              {item.label}
            </Link>
          ))}
          <Link
            href="/#agenda"
            className="rounded-full bg-plum px-5 py-2 text-white shadow-sm transition hover:bg-plum-dark active:translate-y-px"
          >
            Agendar hora
          </Link>
        </nav>
      </div>
    </header>
  );
}
