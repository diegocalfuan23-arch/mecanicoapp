"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { authClient } from "@/lib/auth-client";
import { MarcoAuth, Campo } from "@/components/marco-auth";

const esquema = Yup.object({
  correo: Yup.string()
    .trim()
    .email("Ese correo no parece válido")
    .required("Escribe tu correo"),
  clave: Yup.string().required("Escribe tu contraseña"),
});

export default function Entrar() {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const form = useFormik({
    initialValues: { correo: "", clave: "" },
    validationSchema: esquema,
    onSubmit: async (valores) => {
      setErrorServidor(null);

      const { error } = await authClient.signIn.email({
        email: valores.correo.trim(),
        password: valores.clave,
      });

      if (error) {
        setErrorServidor("Correo o contraseña incorrectos.");
        return;
      }

      router.push("/panel");
      router.refresh();
    },
  });

  const err = (campo: keyof typeof form.values) =>
    form.touched[campo] ? form.errors[campo] : undefined;

  return (
    <MarcoAuth
      titulo="Entra a tu taller"
      bajada="Retoma donde quedaste."
      pie={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-foreground hover:text-acento">
            Crea una gratis
          </Link>
        </>
      }
    >
      <form
        onSubmit={form.handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <Campo
          etiqueta="Correo"
          name="correo"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.cl"
          value={form.values.correo}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={err("correo")}
        />
        <Campo
          etiqueta="Contraseña"
          name="clave"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={form.values.clave}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={err("clave")}
        />

        {errorServidor && (
          <p className="text-[13px] text-destructive" role="alert">
            {errorServidor}
          </p>
        )}

        <button
          type="submit"
          disabled={form.isSubmitting}
          className="mt-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {form.isSubmitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </MarcoAuth>
  );
}
