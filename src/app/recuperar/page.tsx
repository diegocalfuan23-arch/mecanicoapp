"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { authClient } from "@/lib/auth-client";
import { MarcoAuth, Campo } from "@/components/marco-auth";
import { correoTieneCuenta } from "./acciones";
import { toaster } from "@/components/ui/toaster";

const esquema = Yup.object({
  correo: Yup.string()
    .trim()
    .email("Ese correo no parece válido")
    .required("Escribe tu correo"),
});

export default function Recuperar() {
  const [enviado, setEnviado] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const form = useFormik({
    initialValues: { correo: "" },
    validationSchema: esquema,
    onSubmit: async (valores) => {
      setErrorServidor(null);
      const correo = valores.correo.trim();

      // Pedido explícito: avisar de una si el correo no tiene cuenta,
      // en vez del mensaje ambiguo de siempre — se acepta el trade-off
      // de exponer qué correos están registrados (ver acciones.ts).
      const existe = await correoTieneCuenta(correo);
      if (!existe) {
        toaster.add({
          title: "Ese correo no está registrado",
          description: "Revisa que esté bien escrito, o crea una cuenta nueva.",
        });
        return;
      }

      const { error } = await authClient.requestPasswordReset({
        email: correo,
        redirectTo: "/recuperar/cambiar",
      });

      if (error) {
        setErrorServidor("No se pudo enviar el correo. Intenta de nuevo.");
        return;
      }

      setEnviado(true);
    },
  });

  if (enviado) {
    return (
      <MarcoAuth
        titulo="Revisa tu correo"
        bajada={`Le mandamos un enlace a ${form.values.correo.trim()} para cambiar la contraseña. Si no llega en unos minutos, revisa spam.`}
        pie={
          <>
            ¿No llegó? Mira en spam, o{" "}
            <button
              onClick={() => setEnviado(false)}
              className="underline underline-offset-4 hover:text-foreground"
            >
              prueba con otro correo
            </button>
            .
          </>
        }
      >
        <Link
          href="/entrar"
          className="block rounded-lg border border-border px-6 py-4 text-center font-medium transition-colors hover:bg-card"
        >
          Volver a entrar
        </Link>
      </MarcoAuth>
    );
  }

  return (
    <MarcoAuth
      titulo="Recuperar la contraseña"
      bajada="Te mandamos un enlace al correo con el que te registraste."
      pie={
        <>
          ¿Te acordaste?{" "}
          <Link
            href="/entrar"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-4">
        <Campo
          etiqueta="Correo"
          name="correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="tu@correo.cl"
          value={form.values.correo}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.touched.correo ? form.errors.correo : undefined}
        />

        {errorServidor && (
          <p className="text-[13px] text-destructive" role="alert">
            {errorServidor}
          </p>
        )}

        <button
          type="submit"
          disabled={form.isSubmitting}
          className="mt-2 rounded-lg bg-primary px-6 py-4 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {form.isSubmitting ? "Enviando…" : "Mandarme el enlace"}
        </button>
      </form>
    </MarcoAuth>
  );
}
