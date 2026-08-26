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
import { SERVICIOS_CATALOGO } from "@/lib/servicios-catalogo";

export default async function ImprimirOrden({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  const { id } = await params;
  const resultado = await datosParaImprimir(id);
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
              {SERVICIOS_CATALOGO
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

/** Vista superior del auto con las marcas hechas al abrir la orden. */
function SiluetaSuperiorImpresa({ danos }: { danos: string[] }) {
  const marcas = marcasDesdeDanos(danos);

  return (
    <svg
      viewBox="0 0 120 200"
      className="h-40 w-auto shrink-0"
      aria-label="Diagrama del vehículo, vista superior"
    >
      <path
        d="M 60 2
           C 82 2 96 10 100 30
           L 100 66
           C 108 68 112 74 112 84
           L 112 118
           C 112 128 108 134 100 136
           L 100 170
           C 96 190 82 198 60 198
           C 38 198 24 190 20 170
           L 20 136
           C 12 134 8 128 8 118
           L 8 84
           C 8 74 12 68 20 66
           L 20 30
           C 24 10 38 2 60 2 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {ZONAS_SUPERIOR.map((z) => {
        const marca = marcas.find((m) => m.zona === z.id);
        const tipo = TIPOS_DANO.find((t) => t.id === marca?.tipo);
        return (
          <g key={z.id}>
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              rx="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
              strokeOpacity="0.4"
            />
            {tipo ? (
              <text
                x={z.x + z.w / 2}
                y={z.y + z.h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[13px] font-bold"
              >
                {tipo.letra}
              </text>
            ) : (
              <text
                x={z.x + z.w / 2}
                y={z.y + z.h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-current text-[6px] opacity-40"
              >
                {z.etiquetaCorta}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Vista lateral (perfil) del auto con las marcas hechas al abrir la orden. */
function SiluetaLateralImpresa({ danos }: { danos: string[] }) {
  const marcas = marcasDesdeDanos(danos);

  return (
    <svg
      viewBox="0 0 192 90"
      className="h-24 w-auto shrink-0"
      aria-label="Diagrama del vehículo, vista lateral"
    >
      <path
        d="M 4 66
           L 4 58
           C 4 52 8 48 14 48
           L 22 48
           C 26 34 34 24 46 20
           L 56 18
           C 62 10 72 6 84 6
           L 122 6
           C 136 6 148 12 156 22
           L 168 34
           L 178 38
           C 184 40 188 45 188 51
           L 188 62
           C 188 66 185 68 181 68
           L 170 68
           C 170 59 163 52 154 52
           C 145 52 138 59 138 68
           L 58 68
           C 58 59 51 52 42 52
           C 33 52 26 59 26 68
           L 11 68
           C 7 68 4 68 4 66 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M 60 18
           C 66 12 74 9 84 9
           L 122 9
           C 133 9 143 14 150 22
           L 154 27
           L 68 27
           Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <circle cx="42" cy="68" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="154" cy="68" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {ZONAS_LATERAL.map((z) => {
        const marca = marcas.find((m) => m.zona === z.id);
        const tipo = TIPOS_DANO.find((t) => t.id === marca?.tipo);
        return (
          <g key={z.id}>
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              rx="3"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
              strokeOpacity="0.4"
            />
            {tipo ? (
              <text
                x={z.x + z.w / 2}
                y={z.y + z.h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[11px] font-bold"
              >
                {tipo.letra}
              </text>
            ) : (
              <text
                x={z.x + z.w / 2}
                y={z.y + z.h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-current text-[5px] opacity-40"
              >
                {z.etiquetaCorta}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
