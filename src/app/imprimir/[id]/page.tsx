import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { datosParaImprimir } from "@/app/panel/ordenes/acciones";
import { BotonImprimir } from "./boton-imprimir";
import { pesos, fecha } from "@/lib/formato";
import { ZONAS_AUTO, TIPOS_DANO, marcasDesdeDanos } from "@/lib/zonas-auto";
import { ACCESORIOS_AUTO, NIVELES_COMBUSTIBLE } from "@/lib/accesorios-auto";

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
            <p>N° OT-{orden.numero}</p>
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
          <div className="flex items-center gap-6">
            <DiagramaAutoImpreso danos={orden.danos} />
            <ul className="text-[12px] text-muted-foreground">
              {TIPOS_DANO.map((t) => (
                <li key={t.id}>
                  {t.letra} — {t.etiqueta}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Combustible y accesorios al recibir */}
        <div className="grid gap-4 border-b border-foreground/30 py-4 sm:grid-cols-2">
          <Campo
            etiqueta="Nivel de combustible"
            valor={
              NIVELES_COMBUSTIBLE.find((n) => n.id === orden.combustible)
                ?.etiqueta ?? ""
            }
          />
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Accesorios que trae
            </p>
            <p className="mt-1">
              {orden.accesorios.length > 0
                ? orden.accesorios
                    .map(
                      (id) =>
                        ACCESORIOS_AUTO.find((a) => a.id === id)?.etiqueta
                    )
                    .filter(Boolean)
                    .join(", ")
                : "No especifica"}
            </p>
          </div>
        </div>

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
 * Vista superior del auto con las marcas hechas al abrir la orden. Si
 * no se marcó nada en pantalla, queda en blanco para completar a mano.
 */
function DiagramaAutoImpreso({ danos }: { danos: string[] }) {
  const marcas = marcasDesdeDanos(danos);

  return (
    <svg
      viewBox="0 0 120 200"
      className="h-32 w-auto shrink-0"
      aria-label="Diagrama del vehículo, vista superior"
    >
      <rect
        x="20"
        y="4"
        width="80"
        height="192"
        rx="26"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {ZONAS_AUTO.map((z) => {
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
