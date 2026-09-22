# Cashfree setup and operations

The application now uses Cashfree Hosted Checkout. Orders, payment attempts, refunds, and webhook receipts are separate records. A failed attempt does not cancel an order. Only a verified, captured, matching INR payment grants access. Browser redirects do not grant access.

## 1. Get the Payment Gateway credentials

1. Sign in to the [Cashfree Merchant Dashboard](https://merchant.cashfree.com/).
2. Select the **test/sandbox environment**, then **Payment Gateway → Developers → API Keys**.
3. Copy the **App ID** into `CASHFREE_APP_ID` and the **Secret Key** into `CASHFREE_SECRET_KEY` in `.env.local`.
4. Use **Payment Gateway** keys, not Payouts keys. Never put these keys in a `NEXT_PUBLIC_*` variable or commit `.env.local`.
5. Production uses a separate key pair. Complete account activation, then generate/view production keys using Cashfree's 2FA flow.

See [Cashfree authentication and key generation](https://www.cashfree.com/docs/api-reference/authentication).

The old Razorpay environment variables were removed locally. Revoke the old exposed Razorpay key pair in its dashboard and remove those variables from the deployment provider too.

## 2. Environment variables

| Variable | Local sandbox | Production |
| --- | --- | --- |
| `CASHFREE_ENV` | `sandbox` | `production` |
| `CASHFREE_APP_ID` | Sandbox App ID | Production App ID |
| `CASHFREE_SECRET_KEY` | Sandbox Secret Key | Production Secret Key |
| `CASHFREE_API_VERSION` | `2025-01-01` | `2025-01-01` |
| `CASHFREE_RETURN_ORIGIN` | `http://localhost:3000` (use your actual port) | `https://thealphamakerx.in` |
| `CASHFREE_WEBHOOK_ORIGIN` | Your public HTTPS tunnel origin | `https://thealphamakerx.in` |
| `PAYMENT_RECONCILE_SECRET` | A random server-only token | A separate random server-only token |
| `NEXT_PUBLIC_SITE_URL` | Public site URL used in delivery emails | `https://thealphamakerx.in` |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Existing email service configuration | Verified production sender |

Generate a scheduler token locally with `openssl rand -hex 32`, then store it securely. Restart the dev server after setting the values. Set the production variables on your hosting provider before building/deploying.

Cashfree uses the Payment Gateway Secret Key to verify webhooks; there is no separate Cashfree webhook secret variable in this integration. The API version is deliberately pinned to the documented 2025-01-01 integration, rather than silently following future API defaults.

The buyer's 10-digit Indian mobile number is collected at checkout because Cashfree requires customer phone information. Merchant phone/WhatsApp contact options remain removed. This checkout currently accepts INR and Indian mobile numbers.

## 3. Apply the database migrations before running the new checkout

Generated migrations:

- `migrations/app/20260922T0906_cashfree_payments`
- `migrations/app/20260922T0958_cashfree_refund_attempts`

Both are additive. They retain old orders and legacy gateway IDs, add Cashfree tracking columns, and create payment attempts, refund records, event receipts, and a durable email queue. The migration SQL is exercised in the payment integration tests.

First test on an isolated Neon branch. The Neon CLI needs an authenticated account (`neon auth`) before it can create one. Then configure that branch's `DATABASE_URL` in your development environment. With the intended environment selected:

```bash
DOTENV_CONFIG_PATH=.env.local npx prisma db migrate
DOTENV_CONFIG_PATH=.env.local npx prisma db verify
```

For deployment, use the same migration commands with your deployment environment's `DATABASE_URL`. Run migrations before switching the application to the new release. Do not erase old payment records, reset the schema, or manually mark unpaid orders as paid.

## 4. Whitelist the website and configure webhooks

Follow [Cashfree Hosted Web Checkout](https://www.cashfree.com/docs/payments/online/web/redirect) to whitelist your production domain. Use the sandbox and a public HTTPS tunnel for end-to-end local testing.

In **Payment Gateway → Developers → Webhooks**, configure:

```text
https://thealphamakerx.in/api/webhooks/cashfree
```

For sandbox development, replace the origin with your public tunnel URL and put that same origin in `CASHFREE_WEBHOOK_ORIGIN`.

Select the **2025-01-01** webhook version and subscribe to:

- Payment success: `PAYMENT_SUCCESS_WEBHOOK`
- Payment failure: `PAYMENT_FAILED_WEBHOOK`
- Payment abandonment: `PAYMENT_USER_DROPPED_WEBHOOK`
- Refund updates: `REFUND_STATUS_WEBHOOK`
- Auto-refunds, if available: `AUTO_REFUND_STATUS_WEBHOOK`

Use Cashfree's test delivery and check its delivery logs. A dashboard connectivity test without a real order may be acknowledged as ignored; it does not prove that payment processing works. Complete the sandbox scenarios below as well.

The handler verifies the exact raw body and timestamp using HMAC-SHA256 and a constant-time comparison. It then fetches the current order, attempts and refunds from Cashfree before updating the database. Delivery receipts and state updates commit together under a database row lock. Duplicate or out-of-order events cannot downgrade a successful payment. Failed verification returns 401; transient processing failure returns 503 so Cashfree retries.

Sources: [signature verification](https://www.cashfree.com/docs/payments/online/webhooks/signature-verification), [payment webhook payloads](https://www.cashfree.com/docs/api-reference/payments/latest/payments/webhooks), [refund webhook payloads](https://www.cashfree.com/docs/api-reference/payments/latest/refunds/webhooks).

## 5. Schedule reconciliation every minute

Configure a scheduler to make this request every minute:

```text
POST https://thealphamakerx.in/api/internal/payments/reconcile
Authorization: Bearer <PAYMENT_RECONCILE_SECRET>
```

Store the authorization header in the scheduler's secret store. This endpoint is not public cron access. It processes up to 25 outstanding/recent orders per run, checks gateway status, retries unsubmitted refund requests with the same idempotency key, and retries queued email delivery. Paid orders from the last 180 days are also periodically checked for dashboard-created refunds. Older orders remain available for webhook updates and manual admin sync.

Watch the scheduler's HTTP result and `failed` count. Investigate repeated failures in hosting logs and Cashfree delivery logs. Scale the batch/frequency with order volume. If your host has a short execution limit, use a scheduler/worker with enough runtime; don't rely on browser polling alone. Reconciliation runs sequentially to limit gateway load.

Local polling and request rate limits are per process. A deployment with multiple replicas should enforce shared request limits at the hosting edge. The money-changing operations remain protected by database locks, deterministic order IDs, and Cashfree idempotency keys.

## 6. Admin tracking and refunds

Open **Admin → Orders → an order** to see:

- Order status and separate payment status.
- Gateway order/payment IDs and sandbox/production environment.
- Every payment attempt with time, amount and gateway message.
- Refund IDs, amounts and actual gateway status.
- Webhook, polling, admin and scheduled synchronization activity.

**Sync with Cashfree** fetches the current truth. **Refund full payment** asks for confirmation, reserves one refund ID, then sends the actual refund request. A timeout remains unresolved/processing; it never becomes a completed refund just because the admin clicked a button. The application marks an order refunded and withdraws access only after Cashfree confirms the full refund. Partial refunds made in the Cashfree dashboard are tracked and retain access. Refunds for a different failed/duplicate attempt do not revoke the valid purchase.

Only orders without an active gateway session, or with a verified expired/terminated session, can be cancelled locally. No admin action can fabricate payment success. Orders with multiple successful charges or a late success after cancellation are flagged **Payment needs review**.

A rejected/cancelled refund stays in history. Handle a replacement refund in the Cashfree dashboard and sync the order; the application intentionally does not create a second refund ID automatically after an ambiguous response.

## 7. Verify before enabling live payments

```bash
npm run test:payments
npm run build -- --webpack
```

Automated tests exercise real PostgreSQL semantics through an isolated PGlite database with the generated migration SQL; gateway network calls are mocked. They do not charge cards, contact customers, or modify the configured Neon database.

With sandbox credentials and an isolated migrated database, verify:

1. Successful guest and signed-in checkout; correct amount and download access only after success.
2. Failed payment followed by a retry success on the same order.
3. Close/abandon checkout, reload the page, and return later. Cart remains until verified payment.
4. Delayed/pending payment. Refreshing or losing the network must not show fabricated failure/success.
5. Duplicate success delivery and failed delivery after success. One access notification; no downgrade.
6. Forged signature, mismatched amount/currency, and access to somebody else's order. All rejected.
7. Disable webhook delivery temporarily; confirmation polling and the scheduled job recover status.
8. Full refund, partial refund, rejected refund, and auto-refund of an unrelated attempt.
9. Disable email service temporarily; payment stays confirmed and email delivery retries later.
10. Check Cashfree and admin records agree before switching to the production key pair and production domain.

Live payments are not enabled merely by this code change. Credentials, migrations, domain approval, webhooks, and the scheduler must be configured, followed by sandbox acceptance testing. No real Cashfree transaction was performed during implementation.
