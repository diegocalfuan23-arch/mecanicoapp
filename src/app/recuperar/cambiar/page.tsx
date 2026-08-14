"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { authClient } from "@/lib/auth-client";
import { MarcoAuth, Campo } from "@/components/marco-auth";
import { FuerzaClave } from "@/components/fuerza-clave";

const esquema = Yup.object({
  clave: Yup.string()
    .min(8, "Al menos 8 caracteres")
    .required("Escribe una contraseña"),
  repetir: Yup.string()
    .oneOf([Yup.ref("clave")], "Las contraseñas no coinciden")
    .required("Repite la contraseña"),
});

function Formulario() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const form = useFormik({
    initialValues: { clave: "", repetir: "" },
    validationSchema: esquema,
    onSubmit: async (valores) => {
      setErrorServidor(null);

      if (!token) {
        setErrorServidor("El enlace no es válido.");
        return;
      }

      const { error } = await authClient.resetPassword({
        newPassword: valores.clave,
        token,
      });

      if (error) {
        setErrorServidor(
          "El enlace venció o ya se usó. Pide uno nuevo."
        );
        return;
      }

      router.push("/entrar");
      router.refresh();
    },
  });

  // Sin token no hay nada que hacer: el enlace llegó mal o se copió a
  // medias desde el correo.
  if (!token) {
    return (
      <MarcoAuth
        titulo="Enlace no válido"
        bajada="El enlace está incompleto o venció. Pide uno nuevo."
        pie={
          <Link
            href="/entrar"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Volver a entrar
          </Link>
        }
      >
        <Link
          href="/recuperar"
          className="block rounded-lg bg-primary px-6 py-4 text-center font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Pedir otro enlace
        </Link>
      </MarcoAuth>
    );
  }

  return (
    <MarcoAuth
      titulo="Nueva contraseña"
      bajada="Escribe la que vas a usar de ahora en adelante."
      pie={
        <Link
          href="/entrar"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Volver a entrar
        </Link>
      }
    >
      <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-4">
        <Campo
          etiqueta="Contraseña nueva"
          name="clave"
          type="password"
          autoComplete="new-password"
          autoFocus
          value={form.values.clave}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.touched.clave ? form.errors.clave : undefined}
          ayuda={<FuerzaClave valor={form.values.clave} />}
        />

        <Campo
          etiqueta="Repítela"
          name="repetir"
          type="password"
          autoComplete="new-password"
          value={form.values.repetir}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.touched.repetir ? form.errors.repetir : undefined}
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
          {form.isSubmitting ? "Guardando…" : "Cambiar la contraseña"}
        </button>
      </form>
    </MarcoAuth>
  );
}

export default function Cambiar() {
  // useSearchParams necesita Suspense para no forzar toda la página a
  // renderizarse en el cliente.
  return (
    <Suspense>
      <Formulario />
    </Suspense>
  );
}
