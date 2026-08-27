import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { datosParaImprimir } from "@/app/panel/ordenes/acciones";
import { BotonImprimir } from "./boton-imprimir";
import { pesos, fecha } from "@/lib/formato";
import {
  ZONAS_SUPERIOR,
  ZONAS_LATERAL,
  TIPOS_DANO,
  marcasDesdeDanos,
} from "@/lib/zonas-auto";
import {
  NIVELES_COMBUSTIBLE,
  accesoriosParaTipo,
  esAccesorioLibre,
  textoAccesorioLibre,
} from "@/lib/accesorios-auto";
import { listarServicios } from "@/app/panel/servicios/acciones";

export default async function ImprimirOrden({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  const { id } = await params;
  const [resultado, catalogoServicios] = await Promise.all([
    datosParaImprimir(id),
    listarServicios(),
  ]);
  if (!resultado) notFound();

  const { orden, piezas } = resultado;
  const neto =
    orden.manoObra +
    orden.manoObraFreno +
    orden.repuestos +
    orden.cargoTraslado;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:p-0">
      <div className="mb-6 flex justify-end print:hidden">
        <BotonImprimir />
      </div>

      <div className="border border-foreground/30 p-6 text-[13px] text-foreground">
        {/* Encabezado del taller */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/30 pb-4">
          <div className="flex items-start gap-4">
            {orden.tallerLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orden.tallerLogo}
                alt=""
                className="size-14 rounded-lg object-contain"
              />
            )}
            <div>
              <p className="text-lg font-semibold">
                {orden.taller ?? "Taller"}
              </p>
              {orden.tallerRut && <p>RUT: {orden.tallerRut}</p>}
              {orden.tallerDireccion && <p>{orden.tallerDireccion}</p>}
              <p>
                {[orden.tallerTelefono, orden.tallerEmail]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">ORDEN DE TRABAJO</p>
            <p>N° OT: {orden.numero}</p>
            {orden.propietarioNumero && (
              <p>N° Cliente: {orden.propietarioNumero}</p>
            )}
            <p>{fecha(orden.fecha)}</p>
          </div>
        </div>

        {/* Vehículo y cliente */}
        <div className="grid grid-cols-2 gap-4 border-b border-foreground/30 py-4 sm:grid-cols-4">
          <Campo etiqueta="Patente" valor={orden.patente} />
          <Campo
            etiqueta="Marca / Modelo"
            valor={[orden.marca, orden.modelo].filter(Boolean).join(" ")}
          />
          <Campo etiqueta="Año" valor={orden.anio ?? ""} />
          <Campo etiqueta="Color" valor={orden.color ?? ""} />
          <Campo
            etiqueta="Kilometraje"
            valor={
              orden.kilometraje
                ? `${orden.kilometraje.toLocaleString("es-CL")} km`
                : ""
            }
          />
          <Campo etiqueta="Motor" valor={orden.motor ?? ""} />
          <Campo etiqueta="Cilindrada" valor={orden.cilindrada ?? ""} />
          <Campo etiqueta="VIN / Chasis" valor={orden.vin ?? ""} />
          <Campo etiqueta="Móvil" valor={orden.movil ?? ""} />
          <Campo
            etiqueta="Cliente"
            valor={
              orden.propietarioNumero
                ? `${orden.propietario ?? ""} · #${orden.propietarioNumero}`
                : (orden.propietario ?? "")
            }
          />
          <Campo etiqueta="Fono" valor={orden.propietarioTelefono ?? ""} />
          <Campo etiqueta="E-mail" valor={orden.propietarioEmail ?? ""} />
          <Campo etiqueta="Dirección" valor={orden.propietarioDireccion ?? ""} />
          <Campo etiqueta="Comuna" valor={orden.propietarioComuna ?? ""} />
          <Campo etiqueta="Ciudad" valor={orden.propietarioCiudad ?? ""} />
          {orden.esEmpresa && (
            <>
              <Campo etiqueta="Empresa" valor={orden.empresa ?? ""} />
              <Campo etiqueta="RUT empresa" valor={orden.empresaRut ?? ""} />
            </>
          )}
          {orden.ordenadoPor && (
            <Campo etiqueta="Quién ordenó el trabajo" valor={orden.ordenadoPor} />
          )}
          {orden.ordenadoPorFono && (
            <Campo etiqueta="Fono de quién ordenó" valor={orden.ordenadoPorFono} />
          )}
        </div>

        {/* Diagrama del auto: marcado al abrir la orden, o en blanco para
            completar a mano si no se marcó nada en pantalla. */}
        <div className="border-b border-foreground/30 py-4">
          <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Estado del vehículo al ingresar
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <SiluetaSuperiorImpresa danos={orden.danos} />
            <SiluetaLateralImpresa danos={orden.danos} />
            <ul className="text-[12px] text-muted-foreground">
              {TIPOS_DANO.map((t) => (
                <li key={t.id}>
                  {t.letra} — {t.etiqueta}
                </li>
              ))}
            </ul>
          </div>
          {marcasDesdeDanos(orden.danos).some((m) => m.detalle) && (
            <ul className="mt-2 flex flex-col gap-0.5 text-[12px]">
              {marcasDesdeDanos(orden.danos)
                .filter((m) => m.detalle)
                .map((m) => {
                  const zona =
                    ZONAS_SUPERIOR.find((z) => z.id === m.zona) ??
                    ZONAS_LATERAL.find((z) => z.id === m.zona);
                  return (
                    <li key={m.zona}>
                      <span className="text-muted-foreground">
                        {zona?.etiqueta}:{" "}
                      </span>
                      {m.detalle}
                    </li>
                  );
                })}
            </ul>
          )}
          {orden.danoOtro && (
            <p className="mt-2 text-[12px]">
              <span className="text-muted-foreground">Otro daño: </span>
              {orden.danoOtro}
            </p>
          )}
        </div>

        {/* Combustible y accesorios al recibir — checklist Sí/No, como
            la recepción de vehículos en papel: sirve de respaldo ante
            un reclamo al retirar ("no traía la rueda de repuesto"). */}
        <div className="border-b border-foreground/30 py-4">
          <Campo
            etiqueta="Nivel de combustible"
            valor={
              NIVELES_COMBUSTIBLE.find((n) => n.id === orden.combustible)
                ?.etiqueta ?? ""
            }
          />
          <p className="mt-3 mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Accesorios que trae
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
            {accesoriosParaTipo(orden.tipo).map((a) => (
              <label key={a.id} className="flex items-center gap-2">
                <span className="flex size-3.5 items-center justify-center border border-foreground/50 text-[9px] leading-none">
                  {orden.accesorios.includes(a.id) ? "✓" : ""}
                </span>
                {a.etiqueta}
              </label>
            ))}
            {orden.accesorios.filter(esAccesorioLibre).map((a) => (
              <label key={a} className="flex items-center gap-2">
                <span className="flex size-3.5 items-center justify-center border border-foreground/50 text-[9px] leading-none">
                  ✓
                </span>
                {textoAccesorioLibre(a)}
              </label>
            ))}
          </div>
        </div>

        {/* Servicios realizados — checklist del catálogo, Plan Serviteca
            (pedido por Senna), aparte del texto libre de más abajo. */}
        {orden.serviciosRealizados.length > 0 && (
          <div className="border-b border-foreground/30 py-4">
            <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Servicios realizados
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {catalogoServicios
                .filter((s) => orden.serviciosRealizados.includes(s.id))
                .map((s) => (
                  <p key={s.id}>
                    <span className="text-muted-foreground">{s.codigo}</span>{" "}
                    {s.etiqueta}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Síntoma, diagnóstico, procedimiento */}
        <div className="grid gap-4 border-b border-foreground/30 py-4 sm:grid-cols-3">
          <Bloque etiqueta="Qué reporta el cliente" texto={orden.sintoma} />
          <Bloque etiqueta="Diagnóstico" texto={orden.diagnostico} />
          <Bloque etiqueta="Qué se hizo" texto={orden.descripcion} />
        </div>

        {orden.observaciones && (
          <div className="border-b border-foreground/30 py-4">
            <Bloque etiqueta="Observaciones" texto={orden.observaciones} />
          </div>
        )}

        {/* Detalle de repuestos y mano de obra */}
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-foreground/30 text-left">
              <th className="py-2">Código</th>
              <th className="py-2">Detalle</th>
              <th className="py-2 text-right">Cantidad</th>
              <th className="py-2 text-right">Precio</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {piezas.map((p, i) => (
              <tr key={i} className="border-b border-foreground/10">
                <td className="py-2">{p.codigo ?? ""}</td>
                <td className="py-2">{p.nombre}</td>
                <td className="py-2 text-right">{p.cantidad}</td>
                <td className="py-2 text-right">{pesos(p.precioUnitario)}</td>
                <td className="py-2 text-right">
                  {pesos(p.precioUnitario * p.cantidad)}
                </td>
              </tr>
            ))}
            {orden.manoObraFreno > 0 && (
              <tr className="border-b border-foreground/10">
                <td className="py-2" colSpan={4}>
                  Mano de obra freno
                </td>
                <td className="py-2 text-right">
                  {pesos(orden.manoObraFreno)}
                </td>
              </tr>
            )}
            {orden.manoObra > 0 && (
              <tr className="border-b border-foreground/10">
                <td className="py-2" colSpan={4}>
                  Mano de obra
                </td>
                <td className="py-2 text-right">{pesos(orden.manoObra)}</td>
              </tr>
            )}
            {orden.cargoTraslado > 0 && (
              <tr className="border-b border-foreground/10">
                <td className="py-2" colSpan={4}>
                  Cargo por traslado
                </td>
                <td className="py-2 text-right">
                  {pesos(orden.cargoTraslado)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totales */}
        <div className="ml-auto mt-4 w-full max-w-64">
          <Total etiqueta="Neto" valor={neto} />
          <Total etiqueta="IVA" valor={orden.iva} />
          <Total etiqueta="Abonado" valor={orden.abonado} />
          <Total etiqueta="Saldo" valor={orden.total - orden.abonado} />
          <div className="mt-2 flex items-baseline justify-between border-t border-foreground/40 pt-2">
            <span className="text-[13px] font-medium">Total</span>
            <span className="text-2xl font-bold">{pesos(orden.total)}</span>
          </div>
        </div>

        {/* Cláusula de autorización — texto genérico, igual para todo
            taller en Plan Serviteca, al estilo de la orden en papel. */}
        <div className="mt-6 border-t border-foreground/30 pt-4 text-[10px] leading-relaxed text-muted-foreground">
          <p>
            Autorizo los trabajos arriba descritos. El taller no responde por
            accesorios no especificados en esta orden al momento de la
            recepción, ni por daños ocasionados por incendios, robos,
            accidentes u otra causa ajena a su voluntad. Todo trabajo
            terminado será cancelado antes de retirar el vehículo. Después de
            48 horas de terminada la reparación y notificado el cliente, se
            cobrará estacionamiento según tarifa del taller.
          </p>
        </div>

        {/* Firma */}
        <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[12px]">
          <div>
            <div className="border-t border-foreground/40 pt-2">
              {orden.tecnico ? `Técnico: ${orden.tecnico}` : "Técnico"}
            </div>
          </div>
          <div>
            <div className="border-t border-foreground/40 pt-2">
              Firma cliente — Acepto presupuesto
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string | number;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </p>
      <p>{valor || "No especifica"}</p>
    </div>
  );
}

function Bloque({
  etiqueta,
  texto,
}: {
  etiqueta: string;
  texto: string | null;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </p>
      <p className="mt-1 whitespace-pre-wrap">{texto || "No especifica"}</p>
    </div>
  );
}

function Total({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="flex justify-between border-b border-foreground/20 py-1">
      <span>{etiqueta}</span>
      <span>{pesos(valor)}</span>
    </div>
  );
}

/**
 * Vista superior del auto con las marcas hechas al abrir la orden —
 * misma ilustración real que el panel interactivo (ver
 * public/diagrama/auto-superior.svg, OpenClipart, dominio público).
 */
function SiluetaSuperiorImpresa({ danos }: { danos: string[] }) {
  const marcas = marcasDesdeDanos(danos);

  return (
    <div className="relative h-40 w-18 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/diagrama/auto-superior.svg"
        alt="Diagrama del vehículo, vista superior"
        className="absolute inset-0 h-full w-full object-contain"
      />
      <svg viewBox="0 0 358.85 789.36" className="absolute inset-0 h-full w-full">
        {ZONAS_SUPERIOR.map((z) => {
          const marca = marcas.find((m) => m.zona === z.id);
          const tipo = TIPOS_DANO.find((t) => t.id === marca?.tipo);
          if (!tipo) return null;
          return (
            <text
              key={z.id}
              x={z.x + z.w / 2}
              y={z.y + z.h / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={Math.min(z.w, z.h) * 0.4}
              className="font-bold"
            >
              {tipo.letra}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Vista lateral (perfil) del auto con las marcas hechas al abrir la
 * orden — misma ilustración real que el panel interactivo (ver
 * public/diagrama/auto-lateral.svg, OpenClipart, dominio público).
 */
function SiluetaLateralImpresa({ danos }: { danos: string[] }) {
  const marcas = marcasDesdeDanos(danos);

  return (
    <div className="relative h-24 w-18.75 shrink-0 sm:w-56">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/diagrama/auto-lateral.svg"
        alt="Diagrama del vehículo, vista lateral"
        className="absolute inset-0 h-full w-full object-contain"
      />
      <svg viewBox="0 0 841.9 269.3" className="absolute inset-0 h-full w-full">
        {ZONAS_LATERAL.map((z) => {
          const marca = marcas.find((m) => m.zona === z.id);
          const tipo = TIPOS_DANO.find((t) => t.id === marca?.tipo);
          if (!tipo) return null;
          return (
            <text
              key={z.id}
              x={z.x + z.w / 2}
              y={z.y + z.h / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={Math.min(z.w, z.h) * 0.4}
              className="font-bold"
            >
              {tipo.letra}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
