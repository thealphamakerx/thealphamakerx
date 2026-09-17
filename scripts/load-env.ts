// Side-effect module: loads .env.local (then .env) before anything that reads
// process.env at import time. `dotenv/config` alone only reads `.env`, which
// this project doesn't have — the app's vars live in .env.local.
//
// Import this FIRST in a script; ESM evaluates imports in source order, so
// putting it above `../src/lib/auth.ts` is what makes DATABASE_URL present by
// the time that module initialises.
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });
