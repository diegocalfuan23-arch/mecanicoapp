import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

// En Vercel la URL de producción llega en VERCEL_PROJECT_PRODUCTION_URL
// y la del despliegue actual en VERCEL_URL (cambia en cada preview).
const urlBase =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const origenes = [urlBase];
if (process.env.VERCEL_URL) {
  origenes.push(`https://${process.env.VERCEL_URL}`);
}

export const auth = betterAuth({
  baseURL: urlBase,
  trustedOrigins: origenes,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      taller: { type: "string", required: false, input: true },
      telefono: { type: "string", required: false, input: true },
      plan: { type: "string", required: false, input: false },
    },
  },
  plugins: [nextCookies()],
});
