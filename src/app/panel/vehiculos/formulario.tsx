"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { guardarVehiculo, actualizarVehiculo, buscarPorPatente } from "./acciones";
import { miles, soloDigitos } from "@/lib/formato";
import { Selector } from "@/components/ui/selector";
import { TIPOS_VEHICULO } from "@/lib/tipos-vehiculo";
import { Button } from "@/components/ui/button";

const TIPOS: string[] = [...TIPOS_VEHICULO];

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
  cilindrada: string | null;
  movil: string | null;
  ejes: number | null;
  procedencia: string | null;
  kilometrajeInicial: number | null;
  copropietario: string | null;
  copropietarioTelefono: string | null;
  notas: string | null;
  primeraVez: boolean;
  comparteHistorial: boolean;
  propietario: string | null;
  propietarioTelefono: string | null;
  propietarioEmail: string | null;
  propietarioDireccion: string | null;
  propietarioComuna: string | null;
  propietarioCiudad: string | null;
  esEmpresa: boolean | null;
  empresa: string | null;
  empresaRut: string | null;
};

const texto = (v: string | number | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

export function FormularioVehiculo({
  onListo,
  vehiculo,
  autoguardar = false,
  tieneImpresion = false,
  patenteInicial,
}: {
  onListo: () => void;
  /** Si viene, el formulario edita esa ficha en vez de crear una nueva. */
  vehiculo?: VehiculoEditable;
  /** Guarda solo al salir de cada campo, sin botón "Guardar cambios". */
  autoguardar?: boolean;
  /** Plan Serviteca: agrega cilindrada y patente de móvil/flota. */
  tieneImpresion?: boolean;
  /** Al llegar desde "Historial por patente" sin encontrar el auto. */
  patenteInicial?: string;
}) {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const editando = !!vehiculo;

  const form = useFormik({
    initialValues: {
      patente: texto(vehiculo?.patente) || (patenteInicial ?? ""),
      vin: texto(vehiculo?.vin),
      marca: texto(vehiculo?.marca),
      modelo: texto(vehiculo?.modelo),
      anio: texto(vehiculo?.anio),
      color: texto(vehiculo?.color),
      tipo: texto(vehiculo?.tipo),
      motor: texto(vehiculo?.motor),
      cilindrada: texto(vehiculo?.cilindrada),
      movil: texto(vehiculo?.movil),
      ejes: texto(vehiculo?.ejes),
      procedencia: texto(vehiculo?.procedencia),
      kilometrajeInicial: texto(vehiculo?.kilometrajeInicial),
      propietarioNombre: texto(vehiculo?.propietario),
      propietarioTelefono: texto(vehiculo?.propietarioTelefono),
      copropietario: texto(vehiculo?.copropietario),
      copropietarioTelefono: texto(vehiculo?.copropietarioTelefono),
      primeraVez: vehiculo?.primeraVez ?? true,
      comparteHistorial: vehiculo?.comparteHistorial ?? false,
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

      if (autoguardar) {
        setGuardado(true);
        setTimeout(() => setGuardado(false), 1500);
        router.refresh();
        return;
      }

      form.resetForm();
      onListo();
      router.refresh();
    },
  });

  const err = (campo: keyof typeof form.values) =>
    form.touched[campo] ? (form.errors[campo] as string | undefined) : undefined;

  /**
   * Autocompleta por patente (Plan Serviteca) — solo llena los campos
   * que el mecánico todavía no escribió, para no pisarle algo que ya
   * corrigió a mano.
   */
  async function buscarPatente() {
    setErrorBusqueda(null);
    if (!form.values.patente.trim()) {
      setErrorBusqueda("Escribe la patente primero.");
      return;
    }

    setBuscando(true);
    const res = await buscarPorPatente(form.values.patente);
    setBuscando(false);

    if (!res.ok) {
      setErrorBusqueda(res.error ?? "No se pudo buscar la patente.");
      return;
    }

    for (const [campo, valor] of Object.entries(res.datos)) {
      if (!valor) continue;
      if (form.values[campo as keyof typeof form.values]) continue;
      form.setFieldValue(campo, valor);
    }
  }

  /**
   * En modo autoguardar no hay botón "Guardar": cada onBlur dispara el
   * submit si el campo quedó válido. Si quedó inválido, no se guarda —
   * el error ya se muestra debajo del campo por `err()`.
   */
  async function alSalirDelCampo(
    e: React.FocusEvent<HTMLInputElement>
  ) {
    form.handleBlur(e);
    if (!autoguardar) return;

    const errores = await form.validateForm();
    if (Object.keys(errores).length === 0) form.submitForm();
  }

  /**
   * `conMiles` muestra 3.020.220 mientras se escribe pero guarda los
   * dígitos pelados. No aplica al año, que no lleva separador.
   */
  const campo = (
    name: keyof typeof form.values,
    etiqueta: string,
    extra?: React.InputHTMLAttributes<HTMLInputElement> & { conMiles?: boolean }
  ) => {
    const { conMiles, ...props } = extra ?? {};
    const valor = form.values[name] as string;

    return (
    <div>
      <label className="block">
        <span className="mb-2 block text-[13px] font-medium">{etiqueta}</span>
        <input
          name={name}
          value={conMiles ? miles(valor) : valor}
          onChange={(e) =>
            conMiles
              ? form.setFieldValue(name, soloDigitos(e.target.value))
              : form.handleChange(e)
          }
          onBlur={alSalirDelCampo}
          aria-invalid={!!err(name)}
          {...props}
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
  };

  const selector = (
    name: keyof typeof form.values,
    etiqueta: string,
    opciones: string[]
  ) => (
    <div>
      <span className="mb-2 block text-[13px] font-medium">{etiqueta}</span>
      <Selector
        value={form.values[name] as string}
        onChange={async (v) => {
          await form.setFieldValue(name, v);
          if (autoguardar) form.submitForm();
        }}
        placeholder="Sin especificar"
        opciones={opciones.map((o) => ({ valor: o, texto: o }))}
      />
    </div>
  );

  return (
    <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h3 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          El vehículo
        </h3>

        {tieneImpresion && !editando && (
          <div className="mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={buscarPatente}
              disabled={buscando}
            >
              {buscando ? "Buscando…" : "Buscar por patente"}
            </Button>
            {errorBusqueda && (
              <p className="mt-2 text-[13px] text-destructive">
                {errorBusqueda}
              </p>
            )}
          </div>
        )}

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
          {tieneImpresion &&
            campo("cilindrada", "Cilindrada", { placeholder: "1.6" })}
          {campo("ejes", "Cantidad de ejes", {
            placeholder: "2",
            inputMode: "numeric",
          })}
          {selector("procedencia", "Procedencia", PROCEDENCIAS)}
          {campo("kilometrajeInicial", "Kilometraje", {
            conMiles: true,
            placeholder: "125.000",
            inputMode: "numeric",
          })}
          {tieneImpresion &&
            campo("movil", "Móvil (patente de flota)", {
              placeholder: "Si es distinta a la patente",
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

        {tieneImpresion && vehiculo?.esEmpresa && (
          <p className="mt-4 text-[13px] text-muted-foreground">
            {vehiculo.propietario} es empresa
            {vehiculo.empresa ? ` · ${vehiculo.empresa}` : ""}
            {vehiculo.empresaRut ? ` · ${vehiculo.empresaRut}` : ""}. Se edita
            en Propietarios.
          </p>
        )}
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
          onChange={async (e) => {
            form.handleChange(e);
            if (autoguardar) form.submitForm();
          }}
          className="size-4 accent-primary"
        />
        <span className="text-[15px]">Primera vez en el taller</span>
      </label>

      <div className="rounded-lg border border-border bg-background px-4 py-4">
        <label className="flex items-start gap-4">
          <input
            type="checkbox"
            name="comparteHistorial"
            checked={form.values.comparteHistorial}
            onChange={async (e) => {
              form.handleChange(e);
              if (autoguardar) form.submitForm();
            }}
            className="mt-1 size-4 shrink-0 accent-primary"
          />
          <span className="text-[15px]">
            El dueño autoriza que otros talleres vean el historial de este
            auto
          </span>
        </label>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Pregúntale antes de marcarlo. Si otro taller busca esta patente
          verá qué se le hizo, nunca cuánto se cobró. Se puede desmarcar
          cuando quiera.
        </p>
      </div>

      {campo("notas", "Notas", { placeholder: "Lo que quieras recordar" })}

      {errorServidor && (
        <p className="text-[13px] text-destructive" role="alert">
          {errorServidor}
        </p>
      )}

      {autoguardar ? (
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] text-muted-foreground">
            {form.isSubmitting
              ? "Guardando…"
              : guardado
                ? "Guardado"
                : "Los cambios se guardan solos"}
          </span>
          <Button variant="outline" type="button" onClick={onListo}>
            Volver
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting
              ? "Guardando…"
              : editando
                ? "Guardar cambios"
                : "Registrar vehículo"}
          </Button>
          <Button variant="outline" type="button" onClick={onListo}>
            Cancelar
          </Button>
        </div>
      )}
    </form>
  );
}
