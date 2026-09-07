import { notFound } from "next/navigation";
import { obtenerInspeccion } from "../acciones";
import { DetalleInspeccion } from "./detalle";

export default async function VerInspeccion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inspeccion = await obtenerInspeccion(id);

  if (!inspeccion) notFound();

  return (
    <>
      <p className="mb-4 text-[13px] text-muted-foreground">
        IP-{inspeccion.numero}
        {inspeccion.patente && (
          <>
            {" · "}
            <span className="font-mono">{inspeccion.patente}</span>
          </>
        )}
      </p>

      <DetalleInspeccion inspeccion={inspeccion} />
    </>
  );
}
