"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { authClient } from "@/lib/auth-client";
import { MarcoAuth, Campo } from "@/components/marco-auth";
import { FuerzaClave } from "@/components/fuerza-clave";

const esquema = Yup.object({
  taller: Yup.string()
    .trim()
    .min(2, "Escribe el nombre completo")
    .required("Escribe el nombre de tu taller"),
  nombre: Yup.string()
    .trim()
    .min(2, "Escribe tu nombre completo")
    .required("Escribe tu nombre"),
  correo: Yup.string()
    .trim()
    .email("Ese correo no parece válido")
    .required("Escribe tu correo"),
  clave: Yup.string()
    .min(8, "Necesita al menos 8 caracteres")
    .matches(/[A-Z]/, "Necesita al menos una mayúscula")
    .matches(/[a-z]/, "Necesita al menos una minúscula")
    .matches(/\d/, "Necesita al menos un número")
    .required("Crea una contraseña"),
  repetir: Yup.string()
    .oneOf([Yup.ref("clave")], "Las contraseñas no coinciden")
    .required("Repite la contraseña"),
});

export default function Registro() {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [yaTieneCuenta, setYaTieneCuenta] = useState(false);

  const form = useFormik({
    initialValues: {
      taller: "",
      nombre: "",
      correo: "",
      clave: "",
      repetir: "",
    },
    validationSchema: esquema,
    onSubmit: async (valores) => {
      setErrorServidor(null);

      const { error } = await authClient.signUp.email({
        name: valores.nombre.trim(),
        email: valores.correo.trim(),
        password: valores.clave,
        taller: valores.taller.trim(),
      });

      if (error) {
        // Comparación por si Better Auth cambia levemente el texto entre
        // versiones — antes con igualdad exacta esto se quedaba mudo y
        // mostraba el mensaje en inglés tal cual.
        const yaExiste = error.message
          ?.toLowerCase()
          .includes("already exist");
        setYaTieneCuenta(!!yaExiste);
        setErrorServidor(
          yaExiste
            ? "Ya tienes una cuenta con ese correo."
            : (error.message ?? "No se pudo crear la cuenta.")
        );
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
      titulo="Crea tu cuenta"
      bajada="Anota tus primeros trabajos y mira si te sirve. Sin tarjeta."
      pie={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/entrar" className="text-foreground hover:text-acento">
            Entra aquí
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
          etiqueta="Nombre del taller"
          name="taller"
          type="text"
          autoComplete="organization"
          placeholder="Taller Don Luis"
          value={form.values.taller}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={err("taller")}
        />
        <Campo
          etiqueta="Tu nombre"
          name="nombre"
          type="text"
          autoComplete="name"
          placeholder="Luis Pérez"
          value={form.values.nombre}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={err("nombre")}
        />
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
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={form.values.clave}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={err("clave")}
          ayuda={<FuerzaClave valor={form.values.clave} />}
        />
        <Campo
          etiqueta="Repite la contraseña"
          name="repetir"
          type="password"
          autoComplete="new-password"
          placeholder="La misma de arriba"
          value={form.values.repetir}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={err("repetir")}
        />

        {errorServidor && (
          <p className="text-[13px] text-destructive" role="alert">
            {errorServidor}
            {yaTieneCuenta && (
              <>
                {" "}
                <Link
                  href="/entrar"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Entra aquí
                </Link>{" "}
                o{" "}
                <Link
                  href="/recuperar"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  recupera tu contraseña
                </Link>
                .
              </>
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={form.isSubmitting}
          className="mt-2 rounded-lg bg-primary px-6 py-4 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {form.isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>

        {/* La ley pide informar antes de recoger los datos, no después. */}
        <p className="text-center text-[13px] text-muted-foreground">
          Al crear la cuenta aceptas cómo tratamos los datos, explicado en
          la{" "}
          <Link
            href="/privacidad"
            className="underline underline-offset-4 hover:text-foreground"
          >
            política de privacidad
          </Link>
          .
        </p>
      </form>
    </MarcoAuth>
  );
}
