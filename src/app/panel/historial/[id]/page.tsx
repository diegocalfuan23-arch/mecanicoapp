import Link from "next/link";
import { notFound } from "next/navigation";
import { fichaVehiculo } from "../acciones";
import { pesos, fecha } from "@/lib/formato";

const ESTADO_TEXTO: Record<string, string> = {
  ingresado: "Ingresado",
  en_proceso: "En proceso",
  esperando_repuesto: "Esperando repuesto",
  terminado: "Terminado",
  entregado: "Entregado",
};

export default async function FichaVehiculo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ficha = await fichaVehiculo(id);

  if (!ficha) notFound();

  const { datos, trabajos, gastado, debe, verMontos, esPropio } = ficha;

  const especificaciones = [
    ["Tipo", datos.tipo],
    ["Motor", datos.motor],
    ["Color", datos.color],
    ["Ejes", datos.ejes],
    ["Procedencia", datos.procedencia],
    ["VIN", datos.vin],
  ].filter(([, valor]) => valor);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/panel/historial"
        className="inline-flex items-center gap-2 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
          <path
            d="M12 4l-5 6 5 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Buscar otra patente
      </Link>

      {!esPropio && (
        <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-2 text-[13px] text-muted-foreground">
          Este auto es de otro taller: se ve qué se le hizo, no lo que se
          cobró.
        </p>
      )}

      {/* Identidad del vehículo, con el dueño en la misma cabecera: es
          contexto de quién es el auto, no una cifra que merezca tarjeta
          propia compitiendo con las de abajo. */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">
              {datos.patente}
            </h1>
            <span className="text-lg text-muted-foreground">
              {[datos.marca, datos.modelo, datos.anio]
                .filter(Boolean)
                .join(" ")}
            </span>
          </div>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {datos.propietario ?? "Sin dueño registrado"}
            {datos.copropietario && ` · también retira ${datos.copropietario}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {esPropio && (
            <Link
              href={`/panel/ordenes/nueva?vehiculo=${datos.id}`}
              className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Nueva visita
            </Link>
          )}
          {datos.telefono && (
            <a
              href={`https://wa.me/${datos.telefono.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
            >
              Escribirle
            </a>
          )}
        </div>
      </div>

      {/* En pantalla ancha, los datos del auto quedan a la izquierda y el
          historial a la derecha: antes todo iba apilado en una columna
          angosta y sobraba media pantalla vacía. */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[22rem_1fr] lg:items-start">
      <div className="flex flex-col gap-4">
      <div
        className={`grid gap-4 ${verMontos ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {verMontos && (
          <div className="col-span-2 rounded-xl border border-border bg-card p-6">
            <span className="text-[13px] tracking-wide text-muted-foreground uppercase">
              Debe
            </span>
            {/* El elemento principal de la pantalla: 40÷16 = 2,5. */}
            {(debe ?? 0) > 0 ? (
              <p className="mt-2 text-[30px] leading-none font-bold text-acento sm:text-[40px]">
                {pesos(debe ?? 0)}
              </p>
            ) : (
              <p className="mt-2 text-2xl leading-none font-semibold text-muted-foreground">
                Al día
              </p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6">
          <span className="text-[13px] tracking-wide text-muted-foreground uppercase">
            Visitas
          </span>
          <p className="mt-2 text-2xl leading-none font-semibold">
            {trabajos.length}
          </p>
        </div>

        {verMontos && (
          <div className="rounded-xl border border-border bg-card p-6">
            <span className="text-[13px] tracking-wide text-muted-foreground uppercase">
              Ha gastado
            </span>
            <p className="mt-2 text-2xl leading-none font-semibold">
              {pesos(gastado ?? 0)}
            </p>
          </div>
        )}
      </div>

      {/* Especificaciones: etiqueta arriba y valor abajo, en columnas
          angostas. Antes cada par se estiraba a todo el ancho con
          justify-between, dejando un vacío enorme entre los dos. */}
      {especificaciones.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-6">
            {especificaciones.map(([etiqueta, valor]) => (
              <div key={String(etiqueta)} className="min-w-0">
                <dt className="text-[13px] tracking-wide text-muted-foreground uppercase">
                  {etiqueta}
                </dt>
                <dd
                  className={`mt-1 truncate ${
                    etiqueta === "VIN" ? "font-mono text-[13px]" : "text-[15px]"
                  }`}
                  title={String(valor)}
                >
                  {String(valor)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      </div>

      {/* Lo que se le ha hecho */}
      <div className="min-w-0">
      <h2 className="text-lg font-medium">Lo que se le ha hecho</h2>

      {trabajos.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-muted-foreground">
            Este auto todavía no tiene trabajos registrados.
          </p>
          <Link
            href="/panel/ordenes"
            className="mt-4 inline-block text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Abrir una orden
          </Link>
        </div>
      ) : (
        <ol className="mt-4 border-l border-border">
          {trabajos.map((t, i) => {
            const saldo =
              t.total !== null && t.abonado !== null ? t.total - t.abonado : null;
            // trabajos viene del más reciente al más antiguo: la
            // primera vez que llegó es el último de la lista, no el
            // primero — Tío Lalo pidió verlas numeradas en el orden
            // en que pasaron ("2da, tercera, 4ta...").
            const numeroVisita = trabajos.length - i;

            return (
              <li key={t.id} className="relative pb-6 pl-6 last:pb-0">
                <span className="absolute top-2 -left-[5px] size-2.5 rounded-full bg-border" />

                <div className="flex flex-wrap items-baseline gap-x-4">
                  <span className="text-[15px] font-medium">
                    Visita {numeroVisita}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {fecha(t.fecha)}
                  </span>
                  <span className="font-mono text-[13px] text-muted-foreground">
                    OT-{t.numero}
                  </span>
                  {t.kilometraje && (
                    <span className="text-[13px] text-muted-foreground">
                      {t.kilometraje.toLocaleString("es-CL")} km
                    </span>
                  )}
                  {t.estado !== "entregado" && (
                    <span className="rounded-full bg-foreground/10 px-2 py-1 text-[12px] font-medium">
                      {ESTADO_TEXTO[t.estado]}
                    </span>
                  )}
                  {!t.esPropio && t.tallerNombre && (
                    <span className="rounded-full bg-foreground/10 px-2 py-1 text-[12px] font-medium">
                      {t.tallerNombre}
                    </span>
                  )}
                </div>

                {t.descripcion ? (
                  <p className="mt-2 text-[15px]">{t.descripcion}</p>
                ) : (
                  t.sintoma && (
                    <p className="mt-2 text-[15px]">
                      <span className="text-muted-foreground">Reporta: </span>
                      {t.sintoma}
                    </p>
                  )
                )}

                {t.fotos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {t.fotos.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver la foto completa"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Estado del vehículo al ingresar"
                          className="size-16 rounded-lg border border-border object-cover transition-opacity hover:opacity-80"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {t.total !== null && t.total > 0 && (
                  <p className="mt-2 text-[14px] text-muted-foreground">
                    {pesos(t.total)}
                    {t.manoObra !== null &&
                      t.repuestos !== null &&
                      t.manoObra > 0 &&
                      t.repuestos > 0 && (
                        <span>
                          {" "}
                          · mano de obra {pesos(t.manoObra)} · repuestos{" "}
                          {pesos(t.repuestos)}
                          {t.cargoTraslado !== null &&
                            t.cargoTraslado > 0 &&
                            ` · traslado ${pesos(t.cargoTraslado)}`}
                        </span>
                      )}
                    {t.estadoPago !== "pagado" && saldo !== null && (
                      <span className="font-medium text-foreground">
                        {" "}
                        · debe {pesos(saldo)}
                      </span>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
      </div>
      </div>
    </div>
  );
}
