import { getSetting } from "@/lib/settings";
import { CENTER_ADDRESS, CENTER_EMAIL, CENTER_NAME, CENTER_PHONE } from "@/lib/constants";

export async function SiteFooter() {
  const [address, phone, email] = await Promise.all([
    getSetting("center_address"),
    getSetting("center_phone"),
    getSetting("center_email"),
  ]);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-sage-dark text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-3">
        <div>
          <p className="font-heading text-2xl">{CENTER_NAME}</p>
          <p className="mt-3 text-sm text-cream/75">
            Un espacio cálido para tu bienestar emocional, con psicología y psiquiatría a un clic de distancia.
          </p>
        </div>
        <div>
          <p className="font-heading text-lg">Contacto</p>
          <ul className="mt-3 space-y-2 text-sm text-cream/75">
            <li>{address ?? CENTER_ADDRESS}</li>
            <li>
              <a href={`tel:${phone ?? CENTER_PHONE}`} className="hover:text-cream">
                {phone ?? CENTER_PHONE}
              </a>
            </li>
            <li>
              <a href={`mailto:${email ?? CENTER_EMAIL}`} className="hover:text-cream">
                {email ?? CENTER_EMAIL}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-heading text-lg">Horario de atención</p>
          <ul className="mt-3 space-y-2 text-sm text-cream/75">
            <li>Lunes a viernes: 9:00 – 19:00</li>
            <li>Sábado: 9:00 – 13:00</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/15 px-4 py-6 text-center text-xs text-cream/60">
        © {year} {CENTER_NAME}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
