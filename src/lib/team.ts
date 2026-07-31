/**
 * Equipo de profesionales del centro (fuente: agenda Reservo).
 *
 * `photo`: ruta bajo /public (ej: "/equipo/shirley-jones.jpg"); null muestra
 * un avatar con iniciales hasta que el cliente envíe la fotografía.
 * `bio`: reseña breve opcional; se muestra solo si existe.
 */
export type TeamMember = {
  name: string;
  specialty: string;
  photo: string | null;
  bio?: string;
};

export const TEAM: TeamMember[] = [
  { name: "Dra. Shirley Jones B.", specialty: "Psiquiatría", photo: null },
  { name: "Dra. Verónica Ramírez Corsi", specialty: "Psiquiatría", photo: null },
  { name: "Dra. Natalia Franco Yañez", specialty: "Psiquiatría", photo: null },
  { name: "Dra. Constanza Echeverría R.", specialty: "Psiquiatría", photo: null },
  { name: "Dra. Victoria Collins Silva", specialty: "Psiquiatría", photo: null },
  { name: "Dra. Constanza González", specialty: "Psiquiatría", photo: null },
  { name: "Luz Franco Yañez", specialty: "Psicología", photo: null },
  { name: "Felipe Castillo", specialty: "Psicología de adultos", photo: null },
  { name: "José Luis Cortés", specialty: "Psicología", photo: null },
  { name: "Daniela Espinosa", specialty: "Psicología", photo: null },
  { name: "Sue Jones", specialty: "Terapia ocupacional", photo: null },
];
