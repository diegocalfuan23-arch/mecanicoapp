import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { enviarRecuperacion } from "@/lib/correo";

// Vercel entrega los dominios sin protocolo ("mi-app.vercel.app"), y una
// variable escrita a mano puede venir igual. Normalizamos antes de usarla.
function conProtocolo(valor: string) {
  const limpio = valor.trim().replace(/\/+$/, "");
  return /^https?:\/\//.test(limpio) ? limpio : `https://${limpio}`;
}

// VERCEL_PROJECT_PRODUCTION_URL es el dominio estable de producción.
// VERCEL_URL cambia en cada despliegue de vista previa.
const urlBase = process.env.BETTER_AUTH_URL
  ? conProtocolo(process.env.BETTER_AUTH_URL)
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? conProtocolo(process.env.VERCEL_PROJECT_PRODUCTION_URL)
    : "http://localhost:3000";

const origenes = [urlBase];
if (process.env.VERCEL_URL) {
  origenes.push(conProtocolo(process.env.VERCEL_URL));
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
    sendResetPassword: async ({ user, url }) => {
      await enviarRecuperacion({
        para: user.email,
        nombre: user.name?.split(" ")[0] ?? "",
        url,
      });
    },
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
