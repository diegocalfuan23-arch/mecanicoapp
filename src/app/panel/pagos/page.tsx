import {
  listarDeudas,
  resumenDeuda,
  listarCobros,
  cobradoDelMes,
} from "./acciones";
import { VistasPagos } from "./vistas";

export default async function Pagos() {
  const [deudas, resumen, cobros, mes] = await Promise.all([
    listarDeudas(),
    resumenDeuda(),
    listarCobros(),
    cobradoDelMes(),
  ]);

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

      <VistasPagos
        deudas={deudas}
        cobros={cobros}
        pendiente={resumen.pendiente}
        cobrado={mes.monto}
      />
    </>
  );
}
