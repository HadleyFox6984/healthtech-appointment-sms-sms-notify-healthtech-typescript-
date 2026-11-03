import { z } from "zod";
import { sendAppointmentSMS } from "./infrai_sms.js";

export const AppointmentRequest = z.object({
  appointmentId: z.string().min(1),
  patientPhone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  status: z.enum(["confirmed", "rescheduled", "cancelled"]),
  startsAt: z.string().datetime({ offset: true }),
}).strict();

export type AppointmentRequest = z.infer<typeof AppointmentRequest>;

const copy: Record<AppointmentRequest["status"], string> = {
  confirmed: "Your appointment is confirmed.",
  rescheduled: "Your appointment time has changed. Please contact your care team.",
  cancelled: "Your appointment was cancelled. Please contact your care team.",
};

export function buildAppointmentNotification(input: AppointmentRequest): { to: string; body: string } {
  return {
    to: input.patientPhone,
    body: `Appointment ${input.appointmentId}: ${copy[input.status]} Start: ${input.startsAt}.`,
  };
}

export async function notifyAppointment(raw: unknown) {
  const input = AppointmentRequest.parse(raw);
  const operationId = `appointment:${input.appointmentId}:${input.status}:${input.startsAt}`;
  const delivery = await sendAppointmentSMS(buildAppointmentNotification(input), operationId);
  return { appointmentId: input.appointmentId, status: input.status, messageId: delivery.message_id };
}

if (process.argv[1]?.endsWith("appointment_alerts.ts")) {
  const phone = process.env.DEMO_PHONE;
  if (!phone) throw new Error("DEMO_PHONE is required");
  const result = await notifyAppointment({
    appointmentId: "APT-2048",
    patientPhone: phone,
    status: "confirmed",
    startsAt: "2026-11-05T09:30:00+08:00",
  });
  console.log(result);
}
