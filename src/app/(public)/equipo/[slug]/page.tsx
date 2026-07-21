import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { specialtyLabel } from "@/components/site/professional-card";
import type { Professional } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

const getProfessional = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professionals")
    .select(
      "id, slug, specialty, photo_url, full_name, bio, modalities, session_duration_min, session_price, is_active"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data as Professional | null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProfessional(slug);
  if (!p) return { title: "Profesional no encontrado" };
  return { title: p.full_name };
}

export default async function ProfessionalPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProfessional(slug);
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="grid gap-10 md:grid-cols-[280px_1fr]">
        <div className="aspect-square overflow-hidden rounded-xl bg-lilac/20">
          {p.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photo_url} alt={p.full_name} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="text-3xl">{p.full_name}</h1>
          <p className="mt-1 text-ink/60">{specialtyLabel(p.specialty)}</p>
          <div className="mt-3 flex gap-2 text-xs">
            {p.modalities.includes("in_person") && (
              <span className="rounded-full bg-sage/10 px-3 py-1 text-sage-dark">Presencial</span>
            )}
            {p.modalities.includes("online") && (
              <span className="rounded-full bg-lilac/20 px-3 py-1">Online</span>
            )}
          </div>
          <p className="mt-6 whitespace-pre-line leading-relaxed">{p.bio}</p>
          <p className="mt-4 text-sm text-ink/70">
            Sesión de {p.session_duration_min} min · ${p.session_price.toLocaleString("es-CL")}
          </p>
          <Link
            href={`/reservar?profesional=${p.slug}`}
            className="mt-8 inline-block rounded-full bg-sage px-8 py-3 text-white hover:bg-sage-dark"
          >
            Reservar con {p.full_name.split(" ")[0]}
          </Link>
        </div>
      </div>
    </div>
  );
}
