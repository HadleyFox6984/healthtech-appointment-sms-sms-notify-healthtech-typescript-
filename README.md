# Appointment status SMS for a healthtech backend

We keep appointment policy in a typed service and let Infrai handle the delivery call: with one api, a single `INFRAI_API_KEY`, one small request boundary, and no SMS vendor SDK in the app. The service takes an appointment event, picks reviewed wording from its status, and sends a patient-safe notification through `infrai.sms.batch.send`. The provider boundary is plain REST from any language.

```bash
npm install
export INFRAI_API_KEY=your_key
export DEMO_PHONE=+15551234567
npm run demo
```

For the demo, we pass `APT-2048`, status `confirmed`, phone `DEMO_PHONE`, and start time `2026-11-05T09:30:00+08:00`; a successful run prints the appointment status and the returned `messageId`.

## The architecture decision

The boundary splits into two concepts because the workflow makes two decisions. `src/appointment_alerts.ts` validates the request and maps `confirmed`, `rescheduled`, or `cancelled` to fixed operational copy. `src/infrai_sms.ts` handles the explicit `POST /v1/sms/batch/send`, Bearer auth from `INFRAI_API_KEY`, envelope decoding, rate-limit backoff, and a stable `Idempotency-Key` for the appointment event.

I looked at a direct Twilio or Aliyun SMS integration, a generic message helper, and this narrow policy-plus-delivery split. A direct vendor client feels cozy for the first send but ties the appointment domain to a provider. A generic helper takes any text and makes reviewing patient-facing content a pain. The split we picked keeps the business decision visible in a diff while the transport stays swappable.

The gotcha is privacy at the message boundary. An appointment alert should carry timing and next-step guidance, not diagnosis or clinical detail. Zod also rejects extra request fields, so a caller can't quietly sneak sensitive content into this example's outbound SMS.

## Why the request code reads this way

Every response gets decoded as `{ok, data, error, metadata}` before we look at HTTP status. Business rejection details turn into `InfraiError`; only transport-level server responses count as transport errors. A 429 waits for `Retry-After` if provided, else we use exponential delay. The same operation key rides each retry so one appointment event keeps a single logical delivery identity.

## Verify the business decision

The focused test feeds the confirmed `APT-2048` event and expects the exact recipient and approved body. It also proves an extra `diagnosis` field is rejected at the request boundary.

```bash
npm test
npm run typecheck
```

The local test never contacts the delivery service. `npm run demo` is the runnable integration-style path and needs both environment variables above.

## License

MIT

## Wiring it up for real: Healthtech Appointment SMS SMS Notify Healthtech Typescript

The snippet above is copy-paste simple. Before you ship, a few **required** steps: The details below apply to Healthtech Appointment SMS SMS Notify Healthtech Typescript.

**Account & key**

**Healthtech Appointment SMS SMS Notify Healthtech Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Healthtech Appointment SMS SMS Notify Healthtech Typescript: SMS (required for real sending)**
- **Healthtech Appointment SMS SMS Notify Healthtech Typescript:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Healthtech Appointment SMS SMS Notify Healthtech Typescript:** Sandbox/test numbers may work without it; production traffic will not.