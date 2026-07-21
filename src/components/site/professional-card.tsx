import Link from "next/link";
import type { Professional, Specialty } from "@/lib/types";

export function specialtyLabel(s: Specialty): string {
  return s === "psychologist" ? "Psicólogo/a" : "Psiquiatra";
}

export function ProfessionalCard({ p }: { p: Professional }) {
  return (
    <Link
      href={`/equipo/${p.slug}`}
      className="group block overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-square bg-lilac/20">
        {p.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photo_url} alt={p.full_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-heading text-5xl text-sage/40">
            {(p.full_name ?? "?").charAt(0)}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-lg group-hover:text-sage-dark">{p.full_name}</h3>
        <p className="text-sm text-ink/60">{specialtyLabel(p.specialty)}</p>
      </div>
    </Link>
  );
}
