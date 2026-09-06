"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { obtenerInvitacion, aceptarInvitacion } from "@/app/panel/equipo/acciones";
import { MarcoAuth, Campo } from "@/components/marco-auth";
import { FuerzaClave } from "@/components/fuerza-clave";

const ETIQUETA_ROL: Record<string, string> = {
  jefe_taller: "Jefe de taller",
  mecanico: "Mecánico",
};

const esquema = Yup.object({
  clave: Yup.string()
    .min(8, "Al menos 8 caracteres")
    .required("Escribe una contraseña"),
  repetir: Yup.string()
    .oneOf([Yup.ref("clave")], "Las contraseñas no coinciden")
    .required("Repite la contraseña"),
});

export default function Invitacion() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState<{
    nombre: string;
    email: string;
    rol: string;
    tallerNombre: string;
  } | null>(null);
  const [errorInvitacion, setErrorInvitacion] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  useEffect(() => {
    obtenerInvitacion(token).then((res) => {
      setCargando(false);
      if (!res.ok) {
        setErrorInvitacion(res.error ?? "Esta invitación no es válida.");
        return;
      }
      setDatos(res.invitacion);
    });
  }, [token]);

  const form = useFormik({
    initialValues: { clave: "", repetir: "" },
    validationSchema: esquema,
    onSubmit: async (valores) => {
      setErrorServidor(null);
      const res = await aceptarInvitacion(token, { clave: valores.clave });
      if (res?.error) {
        setErrorServidor(res.error);
        return;
      }
      router.push("/entrar");
    },
  });

  if (cargando) return null;

  if (errorInvitacion || !datos) {
    return (
      <MarcoAuth
        titulo="Invitación no válida"
        bajada={errorInvitacion ?? "Esta invitación no existe."}
        pie={
          <Link
            href="/entrar"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Ir a entrar
          </Link>
        }
      >
        <p className="text-[14px] text-muted-foreground">
          Pídele a quien te invitó que te mande un enlace nuevo.
        </p>
      </MarcoAuth>
    );
  }

  return (
    <MarcoAuth
      titulo={`Únete a ${datos.tallerNombre}`}
      bajada={`Te invitaron como ${ETIQUETA_ROL[datos.rol] ?? datos.rol}. Crea tu contraseña para entrar.`}
      pie={
        <Link
          href="/entrar"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Ya tengo cuenta
        </Link>
      }
    >
      <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-[13px] text-muted-foreground">Tu correo</p>
          <p className="text-[15px] font-medium">{datos.email}</p>
        </div>

        <Campo
          etiqueta="Contraseña"
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
          {form.isSubmitting ? "Creando cuenta…" : "Crear mi cuenta"}
        </button>
      </form>
    </MarcoAuth>
  );
}
