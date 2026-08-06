import { listarPropietarios } from "./acciones";
import { TablaPropietarios } from "./tabla";

export default async function Propietarios() {
  const propietarios = await listarPropietarios();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Propietarios</h1>
        <p className="mt-2 text-muted-foreground">
          {propietarios.length === 0
            ? "Los dueños de los autos que atiendes."
            : `${propietarios.length} ${propietarios.length === 1 ? "propietario" : "propietarios"}.`}
        </p>
      </div>

      <TablaPropietarios propietarios={propietarios} />
    </>
  );
}
