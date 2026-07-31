import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock3, MailCheck, MapPin, Phone, UserRound } from "lucide-react";
import { CENTER_ADDRESS, CENTER_EMAIL, CENTER_PHONE } from "@/lib/constants";
import { getTeam } from "@/lib/team";

// ISR: el equipo se edita desde /panel/equipo (revalidatePath al guardar).
export const revalidate = 300;

const RESERVO_AGENDA_URL = "https://agendamiento.reservo.cl/makereserva/agenda/a0Cvn180b0IBWl6u4X36ZBy5J5B0hM";

const SERVICES = [
  {
    title: "Psiquiatría",
    description: "Evaluación y tratamiento infantojuvenil y de adultos, con seguimiento coordinado con tu proceso terapéutico.",
    modalities: ["Presencial", "Telemedicina"],
  },
  {
    title: "Psicología",
    description: "Psicoterapia para adolescentes y adultos: ansiedad, ánimo, duelo y bienestar general, a tu ritmo.",
    modalities: ["Teleconsulta"],
  },
  {
    title: "Terapia ocupacional",
    description: "Acompañamiento para recuperar autonomía y bienestar en las actividades de la vida diaria.",
    modalities: ["Presencial", "Teleconsulta"],
  },
  {
    title: "Psicodiagnóstico",
    description: "Evaluación psicológica integral que orienta el diagnóstico y el plan de tratamiento.",
    modalities: [],
  },
];

const STEPS = [
  {
    icon: UserRound,
    title: "Elige a tu profesional",
    description: "Revisa la agenda de nuestros especialistas y encuentra a quien más te acomode.",
  },
  {
    icon: CalendarDays,
    title: "Escoge día y hora",
    description: "Consulta la disponibilidad real en línea y agenda el horario que prefieras.",
  },
  {
    icon: MailCheck,
    title: "Recibe tu confirmación",
    description: "Te llega un correo con los detalles de tu sesión, presencial u online.",
  },
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter((part) => part.length > 1 && !part.includes("."))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function HomePage() {
  const team = (await getTeam()).filter((member) => member.visible);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-petal/60 via-cream to-cream">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24">
          <div className="max-w-xl">
            <h1 className="font-heading text-5xl leading-[1.1] text-ink sm:text-6xl">
              Un espacio para <em className="text-plum">sentirte mejor</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink/70">
              Psiquiatría, psicología y terapia ocupacional para niños, adolescentes y adultos, presencial y por teleconsulta.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="#agenda"
                className="rounded-full bg-plum px-8 py-3 text-white shadow-sm transition hover:bg-plum-dark active:translate-y-px"
              >
                Agendar hora
              </Link>
              <Link
                href="#servicios"
                className="rounded-full border border-plum/25 px-8 py-3 text-plum transition hover:border-plum hover:bg-petal/40"
              >
                Ver servicios
              </Link>
            </div>
          </div>
          {/* Isotipo oficial en marco de arco, eco de la cápsula del logo */}
          <div className="relative mx-auto w-64 sm:w-72 lg:w-80">
            <div aria-hidden className="absolute -inset-8 rounded-full bg-petal/60 blur-2xl" />
            <div className="relative overflow-hidden rounded-t-full rounded-b-[3rem] border border-plum/15 bg-white shadow-lg shadow-plum/10">
              <Image
                src="/brand/isotipo-magnolia.png"
                alt="Flor de magnolia, símbolo del centro"
                width={640}
                height={640}
                priority
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quiénes somos */}
      <section id="quienes-somos" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="font-heading text-4xl text-ink">Quiénes somos</h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/70">
            Somos un centro de salud mental en Las Condes, formado por psiquiatras, psicólogos y
            terapeutas ocupacionales que acompañan a niños, adolescentes y adultos.
          </p>
          <p className="mt-4 leading-relaxed text-ink/70">
            Creemos en un trato cercano y sin apuro: cada persona avanza a su propio ritmo, con un
            plan coordinado entre especialistas, en consulta presencial o teleconsulta.
          </p>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-heading text-4xl text-ink">Nuestros servicios</h2>
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <div key={service.title} className="rounded-3xl border border-plum/10 bg-white p-8 shadow-sm shadow-plum/5">
                <p className="font-heading text-2xl text-plum">{service.title}</p>
                <p className="mt-3 leading-relaxed text-ink/70">{service.description}</p>
                {service.modalities.length > 0 && (
                  <div className="mt-6 flex gap-2 text-xs font-medium text-plum">
                    {service.modalities.map((modality) => (
                      <span key={modality} className="rounded-full bg-petal/70 px-3 py-1">
                        {modality}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section id="equipo" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-heading text-4xl text-ink">Nuestro equipo</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-ink/70">
            Especialistas en psiquiatría, psicología y terapia ocupacional, disponibles en la agenda en línea.
          </p>
          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {team.map((member) => (
              <div key={member.id} className="text-center">
                {member.photo_url ? (
                  <Image
                    src={member.photo_url}
                    alt={member.name}
                    width={224}
                    height={224}
                    className="mx-auto h-28 w-28 rounded-full border border-plum/10 object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-plum/10 bg-petal/50 font-heading text-3xl text-plum">
                    {initialsOf(member.name)}
                  </div>
                )}
                <p className="mt-4 font-heading text-lg leading-snug text-ink">{member.name}</p>
                <p className="mt-1 text-sm text-plum">{member.specialty}</p>
                {member.bio && <p className="mt-2 text-sm leading-relaxed text-ink/65">{member.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-heading text-4xl text-ink">Cómo funciona</h2>
          <div className="mt-14 grid gap-12 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-petal/70 text-plum">
                  <step.icon className="h-6 w-6" aria-hidden />
                </div>
                <p className="mt-5 font-heading text-xl text-ink">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agenda Reservo */}
      <section id="agenda" className="scroll-mt-20 bg-gradient-to-b from-cream to-petal/40 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-4xl text-ink">Agenda tu hora</h2>
            <p className="mt-4 text-ink/70">
              Elige profesional, día y horario. La confirmación llega directo a tu correo.
            </p>
          </div>
          <div className="mt-12 overflow-hidden rounded-3xl border border-plum/10 bg-white shadow-lg shadow-plum/10">
            <iframe
              title="Agenda en línea de Centro de Salud Magnolia"
              src={RESERVO_AGENDA_URL}
              width="100%"
              height={700}
              loading="lazy"
              className="block w-full border-0"
            />
          </div>
          <p className="mt-4 text-right text-xs text-ink/50">
            <a
              href="https://agendamiento.reservo.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-plum"
            >
              Powered by Reservo
            </a>
          </p>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-heading text-4xl text-ink">Visítanos o escríbenos</h2>
          <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="flex gap-4">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-plum" aria-hidden />
                <div>
                  <p className="font-medium text-ink">Dirección</p>
                  <p className="mt-1 text-ink/70">{CENTER_ADDRESS}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-plum" aria-hidden />
                <div>
                  <p className="font-medium text-ink">Teléfono</p>
                  <a
                    href={`tel:${CENTER_PHONE.replace(/\s/g, "")}`}
                    className="mt-1 block text-ink/70 transition hover:text-plum"
                  >
                    {CENTER_PHONE}
                  </a>
                  <a
                    href={`mailto:${CENTER_EMAIL}`}
                    className="mt-1 block text-ink/70 transition hover:text-plum"
                  >
                    {CENTER_EMAIL}
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock3 className="mt-1 h-5 w-5 shrink-0 text-plum" aria-hidden />
                <div>
                  <p className="font-medium text-ink">Horario de atención</p>
                  <p className="mt-1 text-ink/70">Lunes a viernes: 6:30 a 22:00</p>
                  <p className="text-ink/70">Sábado: 8:00 a 20:00</p>
                  <p className="text-ink/70">Feriados: 7:00 a 14:00</p>
                  <p className="text-ink/70">Domingo: cerrado</p>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-plum/10 bg-petal/30">
              <iframe
                title="Ubicación de Centro de Salud Magnolia"
                src={`https://www.google.com/maps?q=${encodeURIComponent(CENTER_ADDRESS)}&output=embed`}
                loading="lazy"
                className="h-full min-h-96 w-full border-0"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
