import { expect, test } from "vitest";
import { canPatientModify } from "@/lib/scheduling/cancellation";

const appt = new Date("2026-08-03T14:00:00Z");
test("allowed when more than window remains", () => {
  expect(canPatientModify(appt, new Date("2026-08-02T13:59:00Z"), 24)).toBe(true);
});
test("blocked inside the window", () => {
  expect(canPatientModify(appt, new Date("2026-08-02T14:01:00Z"), 24)).toBe(false);
});
test("blocked exactly at the boundary", () => {
  expect(canPatientModify(appt, new Date("2026-08-02T14:00:00Z"), 24)).toBe(false);
});
test("blocked after the appointment", () => {
  expect(canPatientModify(appt, new Date("2026-08-04T00:00:00Z"), 24)).toBe(false);
});
