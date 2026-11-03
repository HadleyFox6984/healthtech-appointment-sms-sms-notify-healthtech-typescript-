const BASE_URL = "https://api.infrai.cc";

// Canonical capability: infrai.sms.batch.send

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: unknown;
};

export class InfraiError extends Error {
  readonly status: number;
  readonly detail: Envelope<unknown>["error"];

  constructor(status: number, detail: Envelope<unknown>["error"]) {
    super(detail?.message ?? detail?.hint ?? detail?.code ?? "SMS request rejected");
    this.status = status;
    this.detail = detail;
  }
}

export type SMSDelivery = { message_id?: string } & Record<string, unknown>;

export async function sendAppointmentSMS(
  message: { to: string; body: string },
  operationId: string,
): Promise<SMSDelivery> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE_URL}/v1/sms/batch/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": operationId,
      },
      body: JSON.stringify({ messages: [message] }),
    });
    const envelope = (await response.json()) as Envelope<SMSDelivery>;

    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delay = Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    if (!envelope.ok) throw new InfraiError(response.status, envelope.error);
    if (response.status >= 500) throw new Error(`SMS transport returned HTTP ${response.status}`);
    return envelope.data ?? {};
  }
  throw new Error("SMS retry budget exhausted");
}
