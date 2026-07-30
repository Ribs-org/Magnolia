import { redirect } from "next/navigation";

// El agendamiento ahora se realiza vía Reservo, embebido en la portada.
export default function ReservarPage() {
  redirect("/#agenda");
}
