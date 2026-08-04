import Link from "next/link";

const funciones = [
  {
    titulo: "Historial por patente",
    resumen: "Escribes la patente y ves todo lo que le has hecho a ese auto.",
    detalle:
      "Qué se cambió, cuándo, qué repuestos llevó y cuánto se cobró. Cuando el cliente vuelve y pregunta si eso ya lo arreglaron, tienes la respuesta.",
  },
  {
    titulo: "Fiados al día",
    resumen: "Quién te debe, cuánto y desde cuándo.",
    detalle:
      "El trabajo salió y el cliente paga después. Anótalo aquí en vez del cuaderno, y deja de perder plata por no acordarte.",
  },
  {
    titulo: "Repuestos y stock",
    resumen: "Qué tienes, qué usaste y qué hay que reponer.",
    detalle:
      "Cada repuesto que ocupas en un trabajo se descuenta solo. Te avisa antes de que te quedes sin lo que más rota.",
  },
  {
    titulo: "El cliente vuelve solo",
    resumen: "Recordatorio automático por WhatsApp.",
    detalle:
      "A los meses del último servicio le llega el mensaje. Sin que tengas que acordarte ni llamarlo uno por uno.",
  },
];

const antes = [
  ["El historial del auto", "En la memoria o en un cuaderno"],
  ["Los fiados", "Anotados en una hoja suelta"],
  ["El stock de repuestos", "Se descubre cuando falta"],
  ["Que el cliente vuelva", "Llamando uno por uno, si hay tiempo"],
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">
          Mecanico<span className="text-primary">App</span>
        </span>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="#funciones"
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Qué hace
          </Link>
          <Link
            href="#precio"
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Precio
          </Link>
          <Link
            href="/registro"
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Probar gratis
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col items-center gap-7 px-6 py-24 text-center sm:py-32">
          <span className="rounded-full border border-border px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Para talleres independientes
          </span>
          <h1 className="text-balance text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
            El cuaderno del taller,
            <br />
            en tu celular.
          </h1>
          <p className="max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
            Historial de cada auto por patente, los fiados anotados, el stock
            al día y el cliente que vuelve solo. Sin planillas ni cuadernos que
            se pierden.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/registro"
              className="rounded-lg bg-primary px-7 py-3.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Probar gratis
            </Link>
            <Link
              href="#funciones"
              className="rounded-lg border border-border px-7 py-3.5 font-medium transition-colors hover:bg-card"
            >
              Ver qué hace
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-card/40 py-24">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-3xl font-semibold tracking-tight">
              Así se lleva un taller hoy
            </h2>
            <div className="mt-10 divide-y divide-border border-y border-border">
              {antes.map(([que, como]) => (
                <div
                  key={que}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <span className="font-medium">{que}</span>
                  <span className="text-muted-foreground">{como}</span>
                </div>
              ))}
            </div>
            <p className="mt-8 text-lg text-muted-foreground">
              Funciona hasta que se pierde el cuaderno, se olvida un fiado o el
              cliente no vuelve porque nadie le avisó.
            </p>
          </div>
        </section>

        <section id="funciones" className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                Cuatro cosas, bien hechas
              </h2>
              <p className="mt-4 text-muted-foreground">
                No es un sistema contable. Es lo que un taller usa todos los
                días.
              </p>
            </div>
            <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              {funciones.map((f) => (
                <div key={f.titulo} className="bg-background p-7">
                  <h3 className="text-lg font-medium">{f.titulo}</h3>
                  <p className="mt-1.5 text-primary">{f.resumen}</p>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {f.detalle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="precio" className="border-t border-border bg-card/40 py-24">
          <div className="mx-auto max-w-xl px-6 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Pruébalo con tu taller
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Sin tarjeta y sin compromiso. Anota tus primeros trabajos y mira
              si te sirve.
            </p>
            <Link
              href="/registro"
              className="mt-8 inline-block rounded-lg bg-primary px-7 py-3.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Empezar ahora
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} MecanicoApp</span>
          <span>Hecho en Chile</span>
        </div>
      </footer>
    </div>
  );
}
