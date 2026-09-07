"use client";

import { Selector } from "@/components/ui/selector";
import {
  EQUIPAMIENTO,
  SECCIONES_DETALLE,
  OPCIONES_EQUIPAMIENTO,
  OPCIONES_DETALLE,
  requiereAlerta,
  type ItemChecklist,
} from "@/lib/checklist-inspeccion";
import type { ItemChecklistValor } from "./acciones";

function AlertaSiCorresponde({ valor }: { valor?: string }) {
  if (!valor || !requiereAlerta(valor)) return null;
  return (
    <span className="ml-1 text-acento" title="Requiere atención" aria-hidden>
      ⚠
    </span>
  );
}

function FilaItem({
  item,
  seccion,
  opciones,
  valor,
  onCambio,
}: {
  item: ItemChecklist;
  seccion: string;
  opciones: string[];
  valor?: string;
  onCambio: (seccion: string, clave: string, valor: string) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-[13px] font-medium">
        {item.etiqueta}
        <AlertaSiCorresponde valor={valor} />
      </span>
      <Selector
        value={valor ?? ""}
        onChange={(v) => onCambio(seccion, item.clave, v)}
        placeholder="Seleccione una opción"
        opciones={opciones.map((o) => ({ valor: o, texto: o }))}
      />
    </div>
  );
}

/**
 * Checklist fijo de la Inspección pre-compra — a diferencia del
 * checklist libre de Diagnósticos, acá las preguntas son siempre las
 * mismas (ver src/lib/checklist-inspeccion.ts). El estado vive en el
 * formulario padre como un array plano de respuestas; este componente
 * solo pinta las secciones y actualiza/agrega la respuesta de cada ítem.
 */
export function ChecklistInspeccion({
  items,
  onCambio,
}: {
  items: ItemChecklistValor[];
  onCambio: (items: ItemChecklistValor[]) => void;
}) {
  const mapa = new Map(items.map((i) => [`${i.seccion}:${i.clave}`, i.valor]));

  function setValor(seccion: string, clave: string, valor: string) {
    const key = `${seccion}:${clave}`;
    const nuevoMapa = new Map(mapa);
    nuevoMapa.set(key, valor);
    onCambio(
      Array.from(nuevoMapa.entries()).map(([k, v]) => {
        const [sec, cl] = k.split(":");
        return { seccion: sec, clave: cl, valor: v };
      })
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Equipamiento / accesorios
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EQUIPAMIENTO.map((item) => (
            <FilaItem
              key={item.clave}
              item={item}
              seccion="Equipamiento"
              opciones={OPCIONES_EQUIPAMIENTO}
              valor={mapa.get(`Equipamiento:${item.clave}`)}
              onCambio={setValor}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Detalle de inspección
        </h3>
        <div className="mt-4 flex flex-col gap-6">
          {SECCIONES_DETALLE.map((sec) => (
            <div key={sec.titulo}>
              <h4 className="mb-3 text-[14px] font-medium">{sec.titulo}</h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {sec.items.map((item) => (
                  <FilaItem
                    key={item.clave}
                    item={item}
                    seccion={sec.titulo}
                    opciones={OPCIONES_DETALLE}
                    valor={mapa.get(`${sec.titulo}:${item.clave}`)}
                    onCambio={setValor}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
