export function canPatientModify(startsAt: Date, now: Date, windowHours: number): boolean {
  return startsAt.getTime() - now.getTime() > windowHours * 3_600_000;
}
