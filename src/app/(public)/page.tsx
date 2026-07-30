import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock3, MailCheck, MapPin, Phone, UserRound } from "lucide-react";
import { CENTER_ADDRESS, CENTER_EMAIL, CENTER_PHONE } from "@/lib/constants";

const RESERVO_AGENDA_URL = "https://agendamiento.reservo.cl/makereserva/agenda/a0Cvn180b0IBWl6u4X36ZBy5J5B0hM";

const STEPS = [
  {
    icon: UserRound,
    title: "Elige a tu profesional",
    description: "Revisa la agenda de psicólogos y psiquiatras y encuentra a quien más te acomode.",
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

export default function HomePage() {
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
              Psicología y psiquiatría, presencial y online, en un ambiente cercano. Agenda tu hora en minutos.
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

      {/* Servicios */}
      <section id="servicios" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-heading text-4xl text-ink">Nuestros servicios</h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            <div className="rounded-3xl border border-plum/10 bg-white p-8 shadow-sm shadow-plum/5">
              <p className="font-heading text-2xl text-plum">Psicología</p>
              <p className="mt-3 leading-relaxed text-ink/70">
                Acompañamiento terapéutico para ansiedad, ánimo, duelo y bienestar general, a tu ritmo.
              </p>
              <div className="mt-6 flex gap-2 text-xs font-medium text-plum">
                <span className="rounded-full bg-petal/70 px-3 py-1">Presencial</span>
                <span className="rounded-full bg-petal/70 px-3 py-1">Online</span>
              </div>
            </div>
            <div className="rounded-3xl border border-plum/10 bg-white p-8 shadow-sm shadow-plum/5">
              <p className="font-heading text-2xl text-plum">Psiquiatría</p>
              <p className="mt-3 leading-relaxed text-ink/70">
                Evaluación y seguimiento con especialistas, coordinado junto a tu proceso terapéutico.
              </p>
              <div className="mt-6 flex gap-2 text-xs font-medium text-plum">
                <span className="rounded-full bg-petal/70 px-3 py-1">Presencial</span>
                <span className="rounded-full bg-petal/70 px-3 py-1">Online</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-20 bg-white py-20 sm:py-24">
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
                  <p className="mt-1 text-ink/70">Lunes a viernes: 9:00 a 19:00</p>
                  <p className="text-ink/70">Sábado: 9:00 a 13:00</p>
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
