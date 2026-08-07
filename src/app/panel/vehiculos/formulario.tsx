"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { guardarVehiculo, actualizarVehiculo } from "./acciones";

const TIPOS = [
  "Sedán",
  "Hatchback",
  "City car",
  "Mini",
  "Coupé",
  "Cabriolet",
  "Station wagon",
  "Crossover",
  "SUV",
  "Pick up",
  "Furgón",
  "Minibús",
  "Camión",
  "Bus",
  "Moto",
];

const PROCEDENCIAS = [
  "Japonés",
  "Coreano",
  "Chino",
  "Europeo",
  "Americano",
  "Otro",
];

const esquema = Yup.object({
  patente: Yup.string()
    .trim()
    .min(4, "Muy corta para ser una patente")
    .required("La patente es obligatoria"),
  vin: Yup.string()
    .trim()
    .test(
      "largo",
      "El VIN tiene 17 caracteres",
      (v) => !v || v.length === 17
    ),
  anio: Yup.number()
    .typeError("Solo números")
    .min(1900, "Año muy antiguo")
    .max(new Date().getFullYear() + 1, "Año muy adelantado"),
  ejes: Yup.number().typeError("Solo números").min(1).max(10),
  kilometrajeInicial: Yup.number()
    .typeError("Solo números")
    .min(0, "No puede ser negativo"),
});

/** Lo que hace falta para rellenar el formulario al editar. */
export type VehiculoEditable = {
  id: string;
  patente: string;
  vin: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  color: string | null;
  tipo: string | null;
  motor: string | null;
  ejes: number | null;
  procedencia: string | null;
  kilometrajeInicial: number | null;
  copropietario: string | null;
  copropietarioTelefono: string | null;
  notas: string | null;
  primeraVez: boolean;
  compartirMontos: boolean;
  propietario: string | null;
  propietarioTelefono: string | null;
};

const texto = (v: string | number | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

export function FormularioVehiculo({
  onListo,
  vehiculo,
}: {
  onListo: () => void;
  /** Si viene, el formulario edita esa ficha en vez de crear una nueva. */
  vehiculo?: VehiculoEditable;
}) {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const editando = !!vehiculo;

  const form = useFormik({
    initialValues: {
      patente: texto(vehiculo?.patente),
      vin: texto(vehiculo?.vin),
      marca: texto(vehiculo?.marca),
      modelo: texto(vehiculo?.modelo),
      anio: texto(vehiculo?.anio),
      color: texto(vehiculo?.color),
      tipo: texto(vehiculo?.tipo),
      motor: texto(vehiculo?.motor),
      ejes: texto(vehiculo?.ejes),
      procedencia: texto(vehiculo?.procedencia),
      kilometrajeInicial: texto(vehiculo?.kilometrajeInicial),
      propietarioNombre: texto(vehiculo?.propietario),
      propietarioTelefono: texto(vehiculo?.propietarioTelefono),
      copropietario: texto(vehiculo?.copropietario),
      copropietarioTelefono: texto(vehiculo?.copropietarioTelefono),
      primeraVez: vehiculo?.primeraVez ?? true,
      compartirMontos: vehiculo?.compartirMontos ?? false,
      notas: texto(vehiculo?.notas),
    },
    validationSchema: esquema,
    onSubmit: async (valores) => {
      setErrorServidor(null);
      const res = vehiculo
        ? await actualizarVehiculo(vehiculo.id, valores)
        : await guardarVehiculo(valores);

      if (res?.error) {
        setErrorServidor(res.error);
        return;
      }

      form.resetForm();
      onListo();
      router.refresh();
    },
  });

  const err = (campo: keyof typeof form.values) =>
    form.touched[campo] ? (form.errors[campo] as string | undefined) : undefined;

  const campo = (
    name: keyof typeof form.values,
    etiqueta: string,
    extra?: React.InputHTMLAttributes<HTMLInputElement>
  ) => (
    <div>
      <label className="block">
        <span className="mb-2 block text-[13px] font-medium">{etiqueta}</span>
        <input
          name={name}
          value={form.values[name] as string}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          aria-invalid={!!err(name)}
          {...extra}
          className={`w-full rounded-lg border bg-background px-4 py-2 text-[15px] transition-colors outline-none placeholder:text-muted-foreground/50 focus:ring-1 ${
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

  const selector = (
    name: keyof typeof form.values,
    etiqueta: string,
    opciones: string[]
  ) => (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium">{etiqueta}</span>
      <select
        name={name}
        value={form.values[name] as string}
        onChange={form.handleChange}
        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[15px] transition-colors outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
      >
        <option value="">Sin especificar</option>
        {opciones.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h3 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          El vehículo
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {campo("patente", "Patente", {
            placeholder: "ABCD12",
            autoFocus: true,
            style: { textTransform: "uppercase" },
          })}
          {campo("vin", "VIN", {
            placeholder: "17 caracteres",
            style: { textTransform: "uppercase" },
          })}
          {campo("marca", "Marca", { placeholder: "Toyota" })}
          {campo("modelo", "Modelo", { placeholder: "Hilux" })}
          {campo("anio", "Año", { placeholder: "2019", inputMode: "numeric" })}
          {campo("color", "Color", { placeholder: "Plateado" })}
          {selector("tipo", "Tipo de vehículo", TIPOS)}
          {campo("motor", "Motor", { placeholder: "2.4 diésel" })}
          {campo("ejes", "Cantidad de ejes", {
            placeholder: "2",
            inputMode: "numeric",
          })}
          {selector("procedencia", "Procedencia", PROCEDENCIAS)}
          {campo("kilometrajeInicial", "Kilometraje", {
            placeholder: "125000",
            inputMode: "numeric",
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          El dueño
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {campo("propietarioNombre", "Nombre", { placeholder: "Juan Pérez" })}
          {campo("propietarioTelefono", "Teléfono", {
            placeholder: "+56 9 1234 5678",
            inputMode: "tel",
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Copropietario
        </h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Quien acompaña o puede retirar el auto.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {campo("copropietario", "Nombre", { placeholder: "María Pérez" })}
          {campo("copropietarioTelefono", "Teléfono", {
            placeholder: "+56 9 8765 4321",
            inputMode: "tel",
          })}
        </div>
      </div>

      <label className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-4">
        <input
          type="checkbox"
          name="primeraVez"
          checked={form.values.primeraVez}
          onChange={form.handleChange}
          className="size-4 accent-primary"
        />
        <span className="text-[15px]">Primera vez en el taller</span>
      </label>

      <label className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-4">
        <input
          type="checkbox"
          name="compartirMontos"
          checked={form.values.compartirMontos}
          onChange={form.handleChange}
          className="size-4 accent-primary"
        />
        <span className="text-[15px]">
          Autorizo mostrar los montos de este auto a otros talleres
        </span>
      </label>

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
          {form.isSubmitting
            ? "Guardando…"
            : editando
              ? "Guardar cambios"
              : "Registrar vehículo"}
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
