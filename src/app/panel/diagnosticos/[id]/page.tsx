import Link from "next/link";
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/panel/diagnosticos"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver
        </Link>
        <span className="text-[13px] text-muted-foreground">
          DX-{diagnostico.numero} ·{" "}
          <span className="font-mono">{diagnostico.patente}</span>
        </span>
      </div>

      <DetalleDiagnostico diagnostico={diagnostico} ordenes={ordenes} />
    </>
  );
}
