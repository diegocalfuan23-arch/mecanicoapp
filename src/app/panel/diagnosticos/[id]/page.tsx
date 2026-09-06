import { notFound } from "next/navigation";
import { obtenerDiagnostico, ordenesParaVincular } from "../acciones";
import { DetalleDiagnostico } from "./detalle";

export default async function VerDiagnostico({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const diagnostico = await obtenerDiagnostico(id);

  if (!diagnostico) notFound();

  const ordenes =
    diagnostico.estado === "pendiente"
      ? await ordenesParaVincular(diagnostico.patente)
      : [];

  return (
    <>
      <p className="mb-4 text-[13px] text-muted-foreground">
        DX-{diagnostico.numero} ·{" "}
        <span className="font-mono">{diagnostico.patente}</span>
      </p>

      <DetalleDiagnostico diagnostico={diagnostico} ordenes={ordenes} />
    </>
  );
}
