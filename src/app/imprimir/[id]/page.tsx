import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { datosParaImprimir } from "@/app/panel/ordenes/acciones";
import { BotonImprimir } from "./boton-imprimir";
import { pesos, fecha } from "@/lib/formato";

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
  const neto = orden.manoObra + orden.repuestos + orden.cargoTraslado;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:p-0">
      <div className="mb-6 flex justify-end print:hidden">
        <BotonImprimir />
      </div>

      <div className="border border-foreground/30 p-6 text-[13px] text-foreground">
        {/* Encabezado del taller */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/30 pb-4">
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
          <Campo etiqueta="Cliente" valor={orden.propietario ?? ""} />
          <Campo etiqueta="Fono" valor={orden.propietarioTelefono ?? ""} />
        </div>

        {/* Diagrama del auto, para marcar daños a mano al recibirlo */}
        <div className="border-b border-foreground/30 py-4">
          <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Estado del vehículo al ingresar
          </p>
          <div className="flex items-center gap-6">
            <DiagramaAuto />
            <ul className="text-[12px] text-muted-foreground">
              <li>X — Abolladuras</li>
              <li>O — Rayaduras</li>
              <li>D — Quebrado</li>
            </ul>
          </div>
        </div>

        {/* Síntoma, diagnóstico, procedimiento */}
        <div className="grid gap-4 border-b border-foreground/30 py-4 sm:grid-cols-3">
          <Bloque etiqueta="Qué reporta el cliente" texto={orden.sintoma} />
          <Bloque etiqueta="Diagnóstico" texto={orden.diagnostico} />
          <Bloque etiqueta="Qué se hizo" texto={orden.descripcion} />
        </div>

        {/* Detalle de repuestos y mano de obra */}
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-foreground/30 text-left">
              <th className="py-2">Detalle</th>
              <th className="py-2 text-right">Cantidad</th>
              <th className="py-2 text-right">Precio</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {piezas.map((p, i) => (
              <tr key={i} className="border-b border-foreground/10">
                <td className="py-2">{p.nombre}</td>
                <td className="py-2 text-right">{p.cantidad}</td>
                <td className="py-2 text-right">{pesos(p.precioUnitario)}</td>
                <td className="py-2 text-right">
                  {pesos(p.precioUnitario * p.cantidad)}
                </td>
              </tr>
            ))}
            {orden.manoObra > 0 && (
              <tr className="border-b border-foreground/10">
                <td className="py-2" colSpan={3}>
                  Mano de obra
                </td>
                <td className="py-2 text-right">{pesos(orden.manoObra)}</td>
              </tr>
            )}
            {orden.cargoTraslado > 0 && (
              <tr className="border-b border-foreground/10">
                <td className="py-2" colSpan={3}>
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
          <Total etiqueta="Total" valor={orden.total} destacado />
          <Total etiqueta="Abonado" valor={orden.abonado} />
          <Total etiqueta="Saldo" valor={orden.total - orden.abonado} />
        </div>

        {/* Firma */}
        <div className="mt-12 grid grid-cols-2 gap-8 text-center text-[12px]">
          <div>
            <div className="border-t border-foreground/40 pt-2">Técnico</div>
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
      <p>{valor || "—"}</p>
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
      <p className="mt-1 whitespace-pre-wrap">{texto || "—"}</p>
    </div>
  );
}

function Total({
  etiqueta,
  valor,
  destacado,
}: {
  etiqueta: string;
  valor: number;
  destacado?: boolean;
}) {
  return (
    <div
      className={`flex justify-between border-b border-foreground/20 py-1 ${destacado ? "font-semibold" : ""}`}
    >
      <span>{etiqueta}</span>
      <span>{pesos(valor)}</span>
    </div>
  );
}

/** Vista superior en blanco, para marcar daños a mano sobre el papel. */
function DiagramaAuto() {
  return (
    <svg
      viewBox="0 0 120 200"
      className="h-32 w-auto shrink-0"
      aria-label="Diagrama del vehículo, vista superior"
    >
      <rect
        x="20"
        y="10"
        width="80"
        height="180"
        rx="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="20"
        y1="60"
        x2="100"
        y2="60"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1="20"
        y1="140"
        x2="100"
        y2="140"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1="60"
        y1="60"
        x2="60"
        y2="140"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
