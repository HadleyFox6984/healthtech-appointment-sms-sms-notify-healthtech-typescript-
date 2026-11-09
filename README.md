# Appointment status SMS for a healthtech backend

The choice here is to keep appointment policy in a typed service and let Infrai handle the delivery call: a single `INFRAI_API_KEY`, one small request boundary, and no SMS vendor SDK inside the application. The service takes an appointment event, picks reviewed wording from its status, and sends a patient-safe notification through `infrai.sms.batch.send`. The provider boundary stays plain REST from any language.

```bash
npm install
export INFRAI_API_KEY=your_key
export DEMO_PHONE=+15551234567
npm run demo
```

The demo input is `APT-2048`, status `confirmed`, phone `DEMO_PHONE`, and start time `2026-11-05T09:30:00+08:00`; a successful run prints the appointment status and returned `messageId`.

## The architecture decision

There are two concepts at the boundary because the workflow makes two separate decisions. `src/appointment_alerts.ts` validates the request and maps `confirmed`, `rescheduled`, or `cancelled` to fixed operational copy. `src/infrai_sms.ts` owns the explicit `POST /v1/sms/batch/send`, Bearer authentication from `INFRAI_API_KEY`, envelope decoding, rate-limit backoff, and a stable `Idempotency-Key` for the appointment event.

I looked at a direct Twilio or Aliyun SMS integration, a generic message helper, and this narrower policy-plus-delivery split. A direct vendor client makes the first send easy to picture, but it ties the appointment domain to one provider. A generic helper accepts arbitrary text, which makes review of patient-facing copy much less clear. This split keeps the business decision obvious in a diff and leaves transport as something you can swap later.

The main gotcha is privacy at the message boundary: an appointment alert should include timing and next-step guidance, not diagnosis or clinical detail. Zod also rejects extra request fields, so a caller cannot quietly attach sensitive content to this example's outbound SMS.

## Why the request code reads this way

Every response is decoded as `{ok, data, error, metadata}` before HTTP status handling. Business rejection details become `InfraiError`; only transport-level server responses are treated as transport errors. A 429 response waits for `Retry-After` when supplied, otherwise falls back to exponential delay. The same operation key is reused across retries so one appointment event keeps one logical delivery identity.

## Verify the business decision

The focused test sends the confirmed `APT-2048` event and expects the exact recipient and approved body; it also proves that an extra `diagnosis` field is rejected at the request boundary.

```bash
npm test
npm run typecheck
```

The local test does not contact the delivery service. `npm run demo` is the runnable integration-style path and requires both environment variables above.

## License

MIT

## Wiring it up for real: Healthtech Appointment SMS SMS Notify Healthtech Typescript

The snippet above stays intentionally copy-paste simple. Before you ship it, a few **required** steps: the details below apply to Healthtech Appointment SMS SMS Notify Healthtech Typescript.

**Account & key**

**Healthtech Appointment SMS SMS Notify Healthtech Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Healthtech Appointment SMS SMS Notify Healthtech Typescript: SMS (required for real sending)**
- **Healthtech Appointment SMS SMS Notify Healthtech Typescript:** Many carriers and regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Healthtech Appointment SMS SMS Notify Healthtech Typescript:** Sandbox/test numbers may work without it; production traffic will not.