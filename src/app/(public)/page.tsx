import Link from "next/link";
import { CalendarDays, MailCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Specialty } from "@/lib/types";

type TeamPreviewMember = {
  id: string;
  slug: string;
  specialty: Specialty;
  photo_url: string | null;
  full_name: string;
};

const SPECIALTY_LABEL: Record<Specialty, string> = {
  psychologist: "Psicología",
  psychiatrist: "Psiquiatría",
};

const STEPS = [
  {
    icon: UserRound,
    title: "Elige a tu profesional",
    description: "Revisa perfiles de psicólogos y psiquiatras y encuentra a quien más te acomode.",
  },
  {
    icon: CalendarDays,
    title: "Escoge día y hora",
    description: "Consulta disponibilidad real en línea y agenda en el horario que prefieras.",
  },
  {
    icon: MailCheck,
    title: "Confirma y recibe tu email",
    description: "Te enviamos la confirmación y los detalles de tu sesión, presencial o en línea.",
  },
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professionals")
    .select("id, slug, specialty, photo_url, full_name")
    .eq("is_active", true)
    .limit(4);
  const team = (data ?? []) as TeamPreviewMember[];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream py-24 sm:py-32">
        <svg
          aria-hidden
          viewBox="-100 -100 200 200"
          className="pointer-events-none absolute -top-32 -right-32 h-[34rem] w-[34rem] text-lilac/40"
        >
          <path
            fill="currentColor"
            d="M45.7,-58.5C59.9,-49.3,72.2,-35.9,76.4,-20.5C80.6,-5.1,76.7,12.3,68.6,26.9C60.5,41.5,48.2,53.3,33.6,60.9C19,68.5,2.1,71.9,-14.4,70.2C-30.9,68.5,-47,61.7,-58.1,49.8C-69.2,37.9,-75.3,20.9,-76.1,3.2C-76.9,-14.5,-72.4,-32.9,-61.5,-46C-50.6,-59.1,-33.3,-66.9,-16.4,-68.5C0.5,-70.1,17.7,-65.5,45.7,-58.5Z"
          />
        </svg>
        <svg
          aria-hidden
          viewBox="-100 -100 200 200"
          className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] text-sage/25"
        >
          <path
            fill="currentColor"
            d="M39.9,-51.6C52.1,-42.9,62.4,-31.1,67.4,-16.9C72.4,-2.7,72.1,14,65.4,27.8C58.7,41.6,45.6,52.5,31,59.5C16.4,66.5,0.3,69.6,-15.9,67.3C-32.1,65,-48.4,57.3,-59.1,44.6C-69.8,31.9,-74.9,14.2,-73.9,-2.8C-72.9,-19.8,-65.8,-36.1,-54.1,-45C-42.4,-53.9,-26.1,-55.4,-10.3,-59.5C5.5,-63.6,17.7,-60.3,39.9,-51.6Z"
          />
        </svg>
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h1 className="font-heading text-4xl leading-[1.1] text-ink sm:text-5xl">
            Un espacio para sentirte mejor
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink/70">
            Psicología y psiquiatría cercanas, con horas presenciales y online. Damos el primer paso contigo.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/reservar"
              className="rounded-full bg-sage px-8 py-3 text-white shadow-sm transition hover:bg-sage-dark"
            >
              Reservar hora
            </Link>
            <Link
              href="/equipo"
              className="rounded-full border border-ink/15 px-8 py-3 text-ink transition hover:border-sage-dark hover:text-sage-dark"
            >
              Conoce al equipo
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-heading text-3xl text-ink">Cómo funciona</h2>
          <div className="mt-14 grid gap-12 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lilac/20 text-sage-dark">
                  <step.icon className="h-6 w-6" aria-hidden />
                </div>
                <p className="mt-5 font-heading text-lg text-ink">{step.title}</p>
                <p className="mt-2 text-sm text-ink/65">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="bg-sage/[0.06] py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-heading text-3xl text-ink">Nuestros servicios</h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <p className="font-heading text-xl text-sage-dark">Psicología</p>
              <p className="mt-3 text-sm text-ink/70">
                Acompañamiento terapéutico para ansiedad, ánimo, duelo y bienestar general, a tu ritmo.
              </p>
              <div className="mt-5 flex gap-2 text-xs text-ink/60">
                <span className="rounded-full bg-sage/10 px-3 py-1">Presencial</span>
                <span className="rounded-full bg-sage/10 px-3 py-1">Online</span>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <p className="font-heading text-xl text-sage-dark">Psiquiatría</p>
              <p className="mt-3 text-sm text-ink/70">
                Evaluación y seguimiento con especialistas, coordinado junto a tu proceso terapéutico.
              </p>
              <div className="mt-5 flex gap-2 text-xs text-ink/60">
                <span className="rounded-full bg-sage/10 px-3 py-1">Presencial</span>
                <span className="rounded-full bg-sage/10 px-3 py-1">Online</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipo preview */}
      {team.length > 0 && (
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center font-heading text-3xl text-ink">Nuestro equipo</h2>
            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => {
                const name = member.full_name;
                return (
                  <Link
                    key={member.id}
                    href={`/equipo/${member.slug}`}
                    className="group text-center"
                  >
                    {member.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo_url}
                        alt={name}
                        className="mx-auto h-28 w-28 rounded-full object-cover"
                      />
                    ) : (
                      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-lilac/25 font-heading text-2xl text-sage-dark">
                        {initialsOf(name)}
                      </div>
                    )}
                    <p className="mt-4 font-heading text-lg text-ink group-hover:text-sage-dark">{name}</p>
                    <p className="text-sm text-ink/60">{SPECIALTY_LABEL[member.specialty]}</p>
                  </Link>
                );
              })}
            </div>
            <div className="mt-12 text-center">
              <Link href="/equipo" className="text-sm font-medium text-sage-dark hover:underline">
                Ver todo el equipo →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="bg-sage py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="font-heading text-3xl">¿Listo para dar el primer paso?</h2>
          <p className="mt-4 text-white/85">
            Agenda tu hora en minutos y comienza a cuidar tu salud mental, a tu ritmo.
          </p>
          <Link
            href="/reservar"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3 text-sage-dark shadow-sm transition hover:bg-cream"
          >
            Reservar hora
          </Link>
        </div>
      </section>
    </>
  );
}
