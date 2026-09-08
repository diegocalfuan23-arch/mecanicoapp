"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pesos, fecha as formatoFecha } from "@/lib/formato";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModalNuevoProveedor } from "@/components/buscador-proveedor";
import type { CompraLista, ProveedorOpcion } from "./acciones";

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  anulada: "Anulada",
};

const COLOR_ESTADO: Record<string, string> = {
  pendiente: "bg-muted-foreground/15 text-muted-foreground",
  pagada: "bg-success/15 text-success",
  anulada: "bg-destructive/15 text-destructive",
};

export function VistaCompras({
  compras,
  proveedores,
}: {
  compras: CompraLista[];
  proveedores: ProveedorOpcion[];
}) {
  const router = useRouter();
  const [pestana, setPestana] = useState<"compras" | "proveedores">("compras");
  const [busqueda, setBusqueda] = useState("");
  const [creandoProveedor, setCreandoProveedor] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const comprasFiltradas = compras.filter((c) => {
    if (!q) return true;
    const nombre = (c.proveedorNombreReal || c.proveedorNombre || "").toLowerCase();
    return (
      String(c.numero).includes(q) ||
      (c.folio || "").toLowerCase().includes(q) ||
      nombre.includes(q)
    );
  });

  const proveedoresFiltrados = proveedores.filter((p) => {
    if (!q) return true;
    return (
      p.nombre.toLowerCase().includes(q) ||
      (p.documento || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.telefono || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      {creandoProveedor && (
        <ModalNuevoProveedor
          onCerrar={() => setCreandoProveedor(false)}
          onCreado={() => router.refresh()}
        />
      )}

      <div className="flex rounded-lg border border-border p-1">
        <button
          type="button"
          onClick={() => setPestana("compras")}
          className={`rounded-md px-4 py-2 text-[14px] font-medium transition-colors ${
            pestana === "compras"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Compras
        </button>
        <button
          type="button"
          onClick={() => setPestana("proveedores")}
          className={`rounded-md px-4 py-2 text-[14px] font-medium transition-colors ${
            pestana === "proveedores"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Proveedores
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={
            pestana === "compras"
              ? "Buscar por número, folio o proveedor…"
              : "Buscar por nombre o RUT…"
          }
          className="sm:w-80"
        />
        {pestana === "compras" ? (
          <Link
            href="/panel/compras/nueva"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            + Nueva compra
          </Link>
        ) : (
          <Button onClick={() => setCreandoProveedor(true)}>
            + Nuevo proveedor
          </Button>
        )}
      </div>

      {pestana === "compras" ? (
        comprasFiltradas.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border py-16 text-center">
            <p className="font-medium">Sin compras registradas</p>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Registra tu primera compra para cargar stock o llevar el
              control de gastos.
            </p>
          </div>
        ) : (
          <div className="scroll-discreto mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border bg-card">
                  {["N°", "Proveedor", "Folio", "Fecha", "Estado", "Total"].map((c) => (
                    <th
                      key={c}
                      className="px-4 py-3 text-left font-medium whitespace-nowrap text-muted-foreground"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comprasFiltradas.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-card/50"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      C-{c.numero}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {c.proveedorNombreReal || c.proveedorNombre || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {c.folio || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatoFecha(c.fecha)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-1 text-[12px] font-medium ${COLOR_ESTADO[c.estado]}`}
                      >
                        {ETIQUETA_ESTADO[c.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap tabular-nums">
                      {pesos(c.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : proveedoresFiltrados.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-medium">Sin proveedores</p>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Crea proveedores para asociarlos a tus compras.
          </p>
        </div>
      ) : (
        <div className="scroll-discreto mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-card">
                {["Nombre", "Email", "Teléfono"].map((c) => (
                  <th
                    key={c}
                    className="px-4 py-3 text-left font-medium whitespace-nowrap text-muted-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proveedoresFiltrados.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-card/50"
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {p.nombre}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {p.email || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {p.telefono || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
