"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Selector } from "@/components/ui/selector";
import { Button } from "@/components/ui/button";
import {
  BuscadorCliente,
  type ClienteOpcion,
} from "@/components/buscador-cliente";
import {
  BuscadorVehiculo,
  type VehiculoOpcion,
} from "@/components/buscador-vehiculo";
import {
  COMBUSTIBLES,
  TRANSMISIONES,
  TRACCIONES,
  VIGENCIAS_DOCUMENTO,
} from "@/lib/checklist-inspeccion";
import { crearInspeccion, type ItemChecklistValor } from "../acciones";
import { ChecklistInspeccion } from "../checklist";
import { Evidencia } from "../evidencia";

const campo =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

export function NuevaInspeccion({
  clientes,
  vehiculos,
}: {
  clientes: ClienteOpcion[];
  vehiculos: VehiculoOpcion[];
}) {
  const router = useRouter();

  const [cliente, setCliente] = useState<ClienteOpcion | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoOpcion | null>(null);

  const [combustible, setCombustible] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [transmision, setTransmision] = useState("");
  const [traccion, setTraccion] = useState("");

  const [permisoCirculacion, setPermisoCirculacion] = useState("");
  const [revisionTecnica, setRevisionTecnica] = useState("");
  const [seguroObligatorio, setSeguroObligatorio] = useState("");

  const [otrosEquipamientos, setOtrosEquipamientos] = useState("");
  const [items, setItems] = useState<ItemChecklistValor[]>([]);

  const [fotos, setFotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [documentos, setDocumentos] = useState<string[]>([]);

  const [observaciones, setObservaciones] = useState("");
  const [conclusiones, setConclusiones] = useState("");

  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoDireccion, setContactoDireccion] = useState("");
  const [fechaInspeccion, setFechaInspeccion] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setError(null);
    setEnviando(true);

    const res = await crearInspeccion({
      clienteId: cliente?.id,
      vehiculoId: vehiculo?.id,
      combustible,
      kilometraje,
      transmision,
      traccion,
      permisoCirculacion,
      revisionTecnica,
      seguroObligatorio,
      otrosEquipamientos,
      fotos,
      videos,
      documentos,
      observaciones,
      conclusiones,
      contactoNombre,
      contactoDireccion,
      fechaInspeccion,
      items,
    });

    setEnviando(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push(`/panel/inspecciones/${res.id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Cliente y vehículo
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Selecciona o crea el cliente y el vehículo a inspeccionar.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Cliente
            </span>
            <BuscadorCliente
              clientes={clientes}
              seleccionado={cliente}
              onSeleccionar={setCliente}
              tieneImpresion
            />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Vehículo
            </span>
            <BuscadorVehiculo
              vehiculos={vehiculos}
              seleccionado={vehiculo}
              onSeleccionar={setVehiculo}
              tieneImpresion
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Datos complementarios del vehículo
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Combustible
            </span>
            <Selector
              value={combustible}
              onChange={setCombustible}
              placeholder="Sin especificar"
              opciones={COMBUSTIBLES.map((o) => ({ valor: o, texto: o }))}
            />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Kilometraje
            </span>
            <input
              value={kilometraje}
              onChange={(e) => setKilometraje(e.target.value.replace(/\D/g, ""))}
              placeholder="85.000"
              inputMode="numeric"
              className={campo}
            />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Transmisión
            </span>
            <Selector
              value={transmision}
              onChange={setTransmision}
              placeholder="Sin especificar"
              opciones={TRANSMISIONES.map((o) => ({ valor: o, texto: o }))}
            />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Tracción
            </span>
            <Selector
              value={traccion}
              onChange={setTraccion}
              placeholder="Sin especificar"
              opciones={TRACCIONES.map((o) => ({ valor: o, texto: o }))}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Documentos del vehículo
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Permiso de circulación
            </span>
            <Selector
              value={permisoCirculacion}
              onChange={setPermisoCirculacion}
              placeholder="Sin especificar"
              opciones={VIGENCIAS_DOCUMENTO.map((o) => ({ valor: o, texto: o }))}
            />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Revisión técnica
            </span>
            <Selector
              value={revisionTecnica}
              onChange={setRevisionTecnica}
              placeholder="Sin especificar"
              opciones={VIGENCIAS_DOCUMENTO.map((o) => ({ valor: o, texto: o }))}
            />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Seguro obligatorio
            </span>
            <Selector
              value={seguroObligatorio}
              onChange={setSeguroObligatorio}
              placeholder="Sin especificar"
              opciones={VIGENCIAS_DOCUMENTO.map((o) => ({ valor: o, texto: o }))}
            />
          </div>
        </div>
      </div>

      <ChecklistInspeccion items={items} onCambio={setItems} />

      <div>
        <span className="mb-2 block text-[13px] font-medium">
          Otros equipamientos
        </span>
        <textarea
          value={otrosEquipamientos}
          onChange={(e) => setOtrosEquipamientos(e.target.value)}
          placeholder="Equipamiento extra o comentarios relacionados"
          rows={3}
          className={campo}
        />
      </div>

      <div>
        <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Archivos adjuntos
        </h2>
        <div className="mt-4">
          <Evidencia
            fotos={fotos}
            onCambioFotos={setFotos}
            videos={videos}
            onCambioVideos={setVideos}
            documentos={documentos}
            onCambioDocumentos={setDocumentos}
            onError={setError}
          />
        </div>
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-medium">
          Observaciones
        </span>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Incluye todas las observaciones de la inspección"
          rows={3}
          className={campo}
        />
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-medium">
          Conclusiones
        </span>
        <textarea
          value={conclusiones}
          onChange={(e) => setConclusiones(e.target.value)}
          placeholder="Conclusiones de la inspección"
          rows={3}
          className={campo}
        />
      </div>

      <div>
        <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Inspeccionado por
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Persona de contacto
            </span>
            <input
              value={contactoNombre}
              onChange={(e) => setContactoNombre(e.target.value)}
              placeholder="Nombre"
              className={campo}
            />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Dirección
            </span>
            <input
              value={contactoDireccion}
              onChange={(e) => setContactoDireccion(e.target.value)}
              placeholder="Dirección"
              className={campo}
            />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Fecha y hora
            </span>
            <input
              type="datetime-local"
              value={fechaInspeccion}
              onChange={(e) => setFechaInspeccion(e.target.value)}
              className={campo}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-[13px] text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button type="button" onClick={enviar} disabled={enviando}>
          {enviando ? "Guardando…" : "Crear inspección"}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push("/panel/inspecciones")}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
