import type { Metadata } from "next";
import { getSetting } from "@/lib/settings";
import { CENTER_ADDRESS, CENTER_EMAIL, CENTER_PHONE } from "@/lib/constants";

export const metadata: Metadata = { title: "Contacto" };

export default async function ContactoPage() {
  const [address, phone, email] = await Promise.all([
    getSetting("center_address"),
    getSetting("center_phone"),
    getSetting("center_email"),
  ]);
  const resolvedAddress = address ?? CENTER_ADDRESS;
  const resolvedPhone = phone ?? CENTER_PHONE;
  const resolvedEmail = email ?? CENTER_EMAIL;

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-heading text-4xl text-ink sm:text-5xl">Conversemos</h1>
        <p className="mt-5 text-ink/70">
          Escríbenos o llámanos directamente. Si prefieres, también puedes reservar tu hora en línea.
        </p>
      </div>

      <div className="mt-16 grid gap-10 sm:grid-cols-2">
        <div className="space-y-8">
          <div>
            <p className="font-heading text-lg text-sage-dark">Dirección</p>
            <p className="mt-2 text-ink/75">{resolvedAddress}</p>
          </div>
          <div>
            <p className="font-heading text-lg text-sage-dark">Teléfono</p>
            <a href={`tel:${resolvedPhone}`} className="mt-2 block text-ink/75 hover:text-sage-dark">
              {resolvedPhone}
            </a>
          </div>
          <div>
            <p className="font-heading text-lg text-sage-dark">Email</p>
            <a href={`mailto:${resolvedEmail}`} className="mt-2 block text-ink/75 hover:text-sage-dark">
              {resolvedEmail}
            </a>
          </div>
          <div>
            <p className="font-heading text-lg text-sage-dark">Horario de atención</p>
            <p className="mt-2 text-ink/75">Lunes a viernes: 9:00 – 19:00</p>
            <p className="text-ink/75">Sábado: 9:00 – 13:00</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-sage/10">
          <iframe
            title="Ubicación de Magnolia"
            src={`https://www.google.com/maps?q=${encodeURIComponent(resolvedAddress)}&output=embed`}
            loading="lazy"
            className="h-full min-h-80 w-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
