import { listarDeudas, resumenDeuda } from "./acciones";
import { ListaDeudas } from "./lista";
import { pesos } from "@/lib/formato";

export default async function Pagos() {
  const [deudas, resumen] = await Promise.all([listarDeudas(), resumenDeuda()]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Pagos</h1>
        <p className="mt-2 text-muted-foreground">
          {resumen.cuantos === 0
            ? "Los trabajos que salieron sin pagar aparecen acá."
            : `${resumen.cuantos} ${resumen.cuantos === 1 ? "trabajo" : "trabajos"} sin saldar.`}
        </p>
      </div>

      {resumen.pendiente > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <span className="text-[13px] tracking-wide text-muted-foreground uppercase">
            Te deben en total
          </span>
          <p className="mt-2 text-[30px] leading-none font-bold sm:text-[40px] text-acento">
            {pesos(resumen.pendiente)}
          </p>
        </div>
      )}

      <ListaDeudas deudas={deudas} />
    </>
  );
}
