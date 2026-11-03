import test from "node:test";
import assert from "node:assert/strict";
import { AppointmentRequest, buildAppointmentNotification } from "./appointment_alerts.js";

test("confirmed appointment renders approved patient-safe notification", () => {
  const input = AppointmentRequest.parse({
    appointmentId: "APT-2048",
    patientPhone: "+15551234567",
    status: "confirmed",
    startsAt: "2026-11-05T09:30:00+08:00",
  });
  assert.deepEqual(buildAppointmentNotification(input), {
    to: "+15551234567",
    body: "Appointment APT-2048: Your appointment is confirmed. Start: 2026-11-05T09:30:00+08:00.",
  });
  assert.throws(() => AppointmentRequest.parse({ ...input, diagnosis: "ignored" }));
});
