import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

export const authPool = new Pool({ connectionString: process.env.DATABASE_URL });

const productionHost = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL;

export const auth = betterAuth({
  database: authPool,
  secret: process.env.BETTER_AUTH_SECRET,
  // Dynamic rather than a fixed string: `next dev` silently falls back to a
  // different port whenever another project already holds 3000 (a real,
  // reproduced problem — hardcoding one port here broke sign-out with
  // "Failed to fetch" the moment the server actually ran on 3001). Resolved
  // from the request's own Host header instead, so it's correct on whatever
  // port the app actually landed on, in dev and in production alike.
  baseURL: {
    allowedHosts: [
      "localhost:*",
      "127.0.0.1:*",
      ...(productionHost ? [new URL(productionHost).host] : []),
    ],
    fallback: productionHost,
    protocol: "auto",
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "CUSTOMER",
        input: false,
      },
    },
  },
  // Enabled by default in production only (Better Auth's own default).
  rateLimit: {
    window: 60,
    max: 20,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
  // Google / OTP / 2FA (context doc §15) are follow-ups once the
  // corresponding provider credentials exist — add socialProviders.google
  // and the emailOtp / twoFactor plugins then.
  plugins: [nextCookies()],
});
