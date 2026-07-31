import Link from "next/link";
import { CENTER_ADDRESS, CENTER_EMAIL, CENTER_NAME, CENTER_PHONE } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-plum-dark text-petal">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-3">
        <div>
          <p className="font-heading text-2xl">Centro de Salud {CENTER_NAME}</p>
          <p className="mt-3 text-sm text-petal/75">
            Un espacio cálido para tu bienestar emocional, con psiquiatría, psicología y terapia ocupacional presencial y online.
          </p>
        </div>
        <div>
          <p className="font-heading text-lg">Contacto</p>
          <ul className="mt-3 space-y-2 text-sm text-petal/75">
            <li>{CENTER_ADDRESS}</li>
            <li>
              <a href={`tel:${CENTER_PHONE.replace(/\s/g, "")}`} className="transition hover:text-white">
                {CENTER_PHONE}
              </a>
            </li>
            <li>
              <a href={`mailto:${CENTER_EMAIL}`} className="transition hover:text-white">
                {CENTER_EMAIL}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-heading text-lg">Horario de atención</p>
          <ul className="mt-3 space-y-2 text-sm text-petal/75">
            <li>Lunes a viernes: 6:30 a 22:00</li>
            <li>Sábado: 8:00 a 20:00</li>
            <li>Feriados: 7:00 a 14:00</li>
            <li>Domingo: cerrado</li>
          </ul>
          <Link
            href="/#agenda"
            className="mt-6 inline-block rounded-full border border-petal/40 px-5 py-2 text-sm text-petal transition hover:border-petal hover:text-white"
          >
            Agendar hora
          </Link>
        </div>
      </div>
      <div className="border-t border-petal/15 px-4 py-6 text-center text-xs text-petal/60">
        © {year} Centro de Salud {CENTER_NAME}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
