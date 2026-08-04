import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

// El cliente habla siempre con su propio origen, así que no necesita baseURL.
// Los campos extra se declaran aquí para no importar la config del servidor:
// hacerlo arrastraría la conexión a la base de datos al bundle del navegador.
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        taller: { type: "string", required: false },
        telefono: { type: "string", required: false },
        plan: { type: "string", required: false },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
