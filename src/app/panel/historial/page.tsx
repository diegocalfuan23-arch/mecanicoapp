import { Buscador } from "./buscador";

export default function Historial() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">
          Historial por patente
        </h1>
        <p className="mt-2 text-muted-foreground">
          Escribe la patente y mira todo lo que le has hecho a ese auto.
        </p>
      </div>

      <Buscador />
    </div>
  );
}
