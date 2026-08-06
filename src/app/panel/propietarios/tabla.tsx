"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { guardarPropietario } from "./acciones";
import { pesos } from "@/lib/formato";

type Propietario = {
  id: string;
  nombre: string;
  telefono: string | null;
  notas: string | null;
  autos: number;
  deuda: number;
};

const esquema = Yup.object({
  nombre: Yup.string()
    .trim()
    .min(2, "Escribe el nombre completo")
    .required("El nombre es obligatorio"),
});

function Formulario({ onListo }: { onListo: () => void }) {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const form = useFormik({
    initialValues: { nombre: "", telefono: "", notas: "" },
    validationSchema: esquema,
    onSubmit: async (valores) => {
      setErrorServidor(null);
      const res = await guardarPropietario(valores);
      if (res?.error) {
        setErrorServidor(res.error);
        return;
      }
      form.resetForm();
      onListo();
      router.refresh();
    },
  });

  const err = (c: keyof typeof form.values) =>
    form.touched[c] ? (form.errors[c] as string | undefined) : undefined;

  const campo = (
    name: keyof typeof form.values,
    etiqueta: string,
    props?: React.InputHTMLAttributes<HTMLInputElement>
  ) => (
    <div>
      <label className="block">
        <span className="mb-2 block text-[13px] font-medium">{etiqueta}</span>
        <input
          name={name}
          value={form.values[name]}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          {...props}
          className={`w-full rounded-lg border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:ring-1 ${
            err(name)
              ? "border-destructive/70 focus:border-destructive focus:ring-destructive/30"
              : "border-border focus:border-primary/60 focus:ring-primary/30"
          }`}
        />
      </label>
      {err(name) && (
        <p className="mt-2 text-[12px] text-destructive">{err(name)}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {campo("nombre", "Nombre", { placeholder: "Juan Pérez", autoFocus: true })}
        {campo("telefono", "Teléfono", {
          placeholder: "+56 9 1234 5678",
          inputMode: "tel",
        })}
      </div>
      {campo("notas", "Notas", { placeholder: "Lo que quieras recordar" })}

      {errorServidor && (
        <p className="text-[13px] text-destructive" role="alert">
          {errorServidor}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="submit"
          disabled={form.isSubmitting}
          className="rounded-lg bg-primary px-6 py-4 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {form.isSubmitting ? "Guardando…" : "Registrar propietario"}
        </button>
        <button
          type="button"
          onClick={onListo}
          className="rounded-lg border border-border px-6 py-4 font-medium transition-colors hover:bg-card"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function TablaPropietarios({
  propietarios,
}: {
  propietarios: Propietario[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const filtrados = busqueda.trim()
    ? propietarios.filter((p) => {
        const q = busqueda.trim().toLowerCase();
        return (
          p.nombre.toLowerCase().includes(q) || p.telefono?.includes(q)
        );
      })
    : propietarios;

  if (abierto) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-medium">Nuevo propietario</h2>
        <div className="mt-6">
          <Formulario onListo={() => setAbierto(false)} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o teléfono"
          className="w-full rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 sm:max-w-sm"
        />
        <button
          onClick={() => setAbierto(true)}
          className="shrink-0 rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Registrar propietario
        </button>
      </div>

      {filtrados.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {propietarios.length === 0
              ? "Todavía no hay propietarios registrados."
              : "Ninguno coincide con esa búsqueda."}
          </p>
          {propietarios.length === 0 && (
            <button
              onClick={() => setAbierto(true)}
              className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Registrar el primero
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Tarjetas en el teléfono, tabla desde tablet. */}
          <ul className="mt-6 flex flex-col gap-4 sm:hidden">
            {filtrados.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{p.nombre}</span>
                  {p.deuda > 0 ? (
                    <span className="font-medium text-acento">
                      {pesos(p.deuda)}
                    </span>
                  ) : (
                    <span className="text-[13px] text-muted-foreground">
                      Al día
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[13px] text-muted-foreground">
                  {p.autos} {p.autos === 1 ? "auto" : "autos"}
                  {p.notas ? ` · ${p.notas}` : ""}
                </p>

                {p.telefono && (
                  <a
                    href={`https://wa.me/${p.telefono.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
                  >
                    Escribirle
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="scroll-discreto mt-6 hidden overflow-x-auto rounded-xl border border-border sm:block">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-card">
                {["Nombre", "Teléfono", "Autos", "Debe", "Notas"].map((c) => (
                  <th
                    key={c}
                    className="px-4 py-4 text-left font-medium whitespace-nowrap text-muted-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-card/50"
                >
                  <td className="px-4 py-4 font-medium whitespace-nowrap">
                    {p.nombre}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {p.telefono ? (
                      <a
                        href={`https://wa.me/${p.telefono.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 hover:text-muted-foreground"
                      >
                        {p.telefono}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{p.autos}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {p.deuda > 0 ? (
                      <span className="font-medium text-acento">
                        {pesos(p.deuda)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Al día</span>
                    )}
                  </td>
                  <td className="max-w-xs truncate px-4 py-4 text-muted-foreground">
                    {p.notas ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </>
  );
}
