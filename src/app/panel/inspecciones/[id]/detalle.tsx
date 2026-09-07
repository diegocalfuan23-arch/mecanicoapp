"use client";

import { fecha as formatoFecha } from "@/lib/formato";
import {
  EQUIPAMIENTO,
  SECCIONES_DETALLE,
  requiereAlerta,
} from "@/lib/checklist-inspeccion";

type Inspeccion = {
  id: string;
  numero: number;
  clienteNombre: string | null;
  clienteTelefono: string | null;
  patente: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  combustible: string | null;
  kilometraje: number | null;
  transmision: string | null;
  traccion: string | null;
  permisoCirculacion: string | null;
  revisionTecnica: string | null;
  seguroObligatorio: string | null;
  otrosEquipamientos: string | null;
  fotos: string[];
  videos: string[];
  documentos: string[];
  observaciones: string | null;
  conclusiones: string | null;
  contactoNombre: string | null;
  contactoDireccion: string | null;
  fechaInspeccion: Date | null;
  fecha: Date;
  items: { seccion: string; clave: string; valor: string }[];
};

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | number | null }) {
  if (!valor) return null;
  return (
    <div>
      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </dt>
      <dd className="text-[14px]">{valor}</dd>
    </div>
  );
}

export function DetalleInspeccion({ inspeccion }: { inspeccion: Inspeccion }) {
  const mapa = new Map(
    inspeccion.items.map((i) => [`${i.seccion}:${i.clave}`, i.valor])
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Cliente y vehículo
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato etiqueta="Cliente" valor={inspeccion.clienteNombre} />
          <Dato etiqueta="Teléfono" valor={inspeccion.clienteTelefono} />
          <Dato etiqueta="Patente" valor={inspeccion.patente} />
          <Dato
            etiqueta="Vehículo"
            valor={[inspeccion.marca, inspeccion.modelo, inspeccion.anio]
              .filter(Boolean)
              .join(" ")}
          />
          <Dato etiqueta="Combustible" valor={inspeccion.combustible} />
          <Dato
            etiqueta="Kilometraje"
            valor={
              inspeccion.kilometraje
                ? `${inspeccion.kilometraje.toLocaleString("es-CL")} km`
                : null
            }
          />
          <Dato etiqueta="Transmisión" valor={inspeccion.transmision} />
          <Dato etiqueta="Tracción" valor={inspeccion.traccion} />
        </dl>
      </div>

      {(inspeccion.permisoCirculacion ||
        inspeccion.revisionTecnica ||
        inspeccion.seguroObligatorio) && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
            Documentos del vehículo
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <Dato
              etiqueta="Permiso de circulación"
              valor={inspeccion.permisoCirculacion}
            />
            <Dato
              etiqueta="Revisión técnica"
              valor={inspeccion.revisionTecnica}
            />
            <Dato
              etiqueta="Seguro obligatorio"
              valor={inspeccion.seguroObligatorio}
            />
          </dl>
        </div>
      )}

      <div>
        <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Equipamiento / accesorios
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {EQUIPAMIENTO.filter((item) =>
            mapa.has(`Equipamiento:${item.clave}`)
          ).map((item) => {
            const valor = mapa.get(`Equipamiento:${item.clave}`)!;
            return (
              <div
                key={item.clave}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px]"
              >
                <span>{item.etiqueta}</span>
                <span
                  className={
                    requiereAlerta(valor)
                      ? "font-medium text-acento"
                      : "text-muted-foreground"
                  }
                >
                  {valor}
                </span>
              </div>
            );
          })}
        </div>
        {inspeccion.otrosEquipamientos && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            {inspeccion.otrosEquipamientos}
          </p>
        )}
      </div>

      <div>
        <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Detalle de inspección
        </h2>
        <div className="mt-4 flex flex-col gap-6">
          {SECCIONES_DETALLE.map((sec) => {
            const conValor = sec.items.filter((item) =>
              mapa.has(`${sec.titulo}:${item.clave}`)
            );
            if (conValor.length === 0) return null;
            return (
              <div key={sec.titulo}>
                <h3 className="mb-2 text-[14px] font-medium">{sec.titulo}</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {conValor.map((item) => {
                    const valor = mapa.get(`${sec.titulo}:${item.clave}`)!;
                    return (
                      <div
                        key={item.clave}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px]"
                      >
                        <span>{item.etiqueta}</span>
                        <span
                          className={
                            requiereAlerta(valor)
                              ? "font-medium text-acento"
                              : "text-muted-foreground"
                          }
                        >
                          {valor}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(inspeccion.fotos.length > 0 ||
        inspeccion.videos.length > 0 ||
        inspeccion.documentos.length > 0) && (
        <div>
          <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
            Archivos adjuntos
          </h2>
          {inspeccion.fotos.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {inspeccion.fotos.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt="Evidencia de la inspección"
                  className="size-24 rounded-lg border border-border object-cover"
                />
              ))}
            </div>
          )}
          {inspeccion.videos.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {inspeccion.videos.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[13px] text-acento hover:underline"
                  >
                    {url.split("/").pop()}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {inspeccion.documentos.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {inspeccion.documentos.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[13px] text-acento hover:underline"
                  >
                    {url.split("/").pop()}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(inspeccion.observaciones || inspeccion.conclusiones) && (
        <div className="rounded-xl border border-border bg-card p-6">
          {inspeccion.observaciones && (
            <>
              <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
                Observaciones
              </h2>
              <p className="mt-2 text-[14px]">{inspeccion.observaciones}</p>
            </>
          )}
          {inspeccion.conclusiones && (
            <>
              <h2 className="mt-4 text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
                Conclusiones
              </h2>
              <p className="mt-2 text-[14px]">{inspeccion.conclusiones}</p>
            </>
          )}
        </div>
      )}

      {(inspeccion.contactoNombre ||
        inspeccion.contactoDireccion ||
        inspeccion.fechaInspeccion) && (
        <div>
          <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
            Inspeccionado por
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <Dato etiqueta="Persona de contacto" valor={inspeccion.contactoNombre} />
            <Dato etiqueta="Dirección" valor={inspeccion.contactoDireccion} />
            <Dato
              etiqueta="Fecha"
              valor={
                inspeccion.fechaInspeccion
                  ? formatoFecha(inspeccion.fechaInspeccion)
                  : null
              }
            />
          </dl>
        </div>
      )}
    </div>
  );
}
