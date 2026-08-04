import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof crear>;

function crear() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL. Agrega la connection string de Neon en .env.local"
    );
  }
  return drizzle(url, { schema });
}

let instancia: Db | null = null;

// Se conecta al primer uso, no al importar: así el build no necesita la base.
export const db = new Proxy({} as Db, {
  get(_, prop) {
    instancia ??= crear();
    return Reflect.get(instancia, prop, instancia);
  },
});
