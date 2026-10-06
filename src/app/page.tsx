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

/** Misma ficha del hero, tachada — el "antes" es el mismo objeto a mano, no una tabla de texto aparte. */
const antes = [
  "Patente: ________",
  "Qué se hizo: ________",
  "Repuestos: ________",
  "Debe: $______ (¿desde cuándo?)",
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Contrato de dirección (impeccable) — comentario HTML real,
          no JSX: debe sobrevivir en el markup emitido para auditoría
          (`grep` del build), no solo en el código fuente. */}
      <div
        dangerouslySetInnerHTML={{
          __html:
            "<!-- impeccable:direction\n" +
            "THESIS: La orden de trabajo es el producto — se demuestra desde el primer viewport en vez de describirse con un eslogan, y el \"antes\" es la misma ficha a mano, tachada.\n" +
            "OWN-WORLD: Ámbar/naranja de señalética de taller sobre blanco puro (claro) o negro-galpón cálido (oscuro) — paleta ya establecida en globals.css, sin cambios.\n" +
            "STORY: El dueño de taller entiende en un vistazo que esto reemplaza su cuaderno con una ficha real de orden de trabajo — patente, qué se hizo, cuánto debe — y decide probarlo gratis.\n" +
            "FIRST VIEWPORT: Izquierda título + bajada + CTA; derecha una ficha de orden real flotando sobre su versión tachada a mano.\n" +
            "FORM: Candidata 3 de la lista estructural propia (orden de trabajo como protagonista), seed ba8d0282, índice asignado 3.\n" +
            "FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.\n" +
            "-->",
        }}
      />
      {/* Datos estructurados (Schema.org): le dice a Google qué es el
          producto, para quién, y que tiene un plan gratis — puede
          mejorar cómo se ve el resultado en la búsqueda (rich
          snippets), no solo ayudar a entender el texto. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "MecanicoApp",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web, Android, iOS",
            description:
              "Software de gestión para talleres mecánicos en Chile: historial por patente, control de repuestos, fiados al día y recordatorios por WhatsApp.",
            url: "https://mecanicoapp.com",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "CLP",
              description: "Plan Prueba gratis, sin tarjeta",
            },
            audience: {
              "@type": "Audience",
              audienceType: "Talleres mecánicos independientes en Chile",
            },
          }),
        }}
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">
          Mecanico<span className="text-acento">App</span>
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
            href="/ayuda"
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Ayuda
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
        {/* HERO: la orden de trabajo real es el sujeto, no un eslogan
            flotando sobre nada. La ficha a mano (tachada) vive detrás,
            desplazada — la tarjeta digital es lo que queda al frente. */}
        <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-28">
          <div className="flex flex-col items-start gap-7 text-left">
            <span className="rounded-full border border-border px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Para talleres mecánicos en Chile
            </span>
            <h1 className="text-balance text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              El cuaderno del taller,
              <br />
              ahora en tu celular.
            </h1>
            <p className="max-w-md text-balance text-lg leading-relaxed text-muted-foreground">
              Cada orden de trabajo queda con su historial por patente, sus
              repuestos y lo que el cliente debe. Sin planillas ni cuadernos
              que se pierden.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="rounded-lg bg-primary px-6 py-4 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Probar gratis
              </Link>
              <Link
                href="#funciones"
                className="rounded-lg border border-border px-6 py-4 font-medium transition-colors hover:bg-card"
              >
                Ver qué hace
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm px-4 pt-6 lg:mx-0 lg:px-0 lg:pt-8">
            {/* La ficha a mano — el "antes", desplazada y tachada detrás
                de la tarjeta real. Es el mismo objeto, dos versiones. El
                padding del contenedor (en vez de inset negativo en la
                propia tarjeta) le da espacio real a la rotación/offset
                sin que se corte contra el borde del viewport en móvil. */}
            <div
              aria-hidden
              className="absolute top-0 left-0 w-[calc(100%-2rem)] -rotate-3 rounded-xl border border-dashed border-border bg-card/60 p-6 opacity-70 lg:w-full"
            >
              <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                Orden de trabajo — a mano
              </p>
              <ul className="mt-4 flex flex-col gap-2.5 text-[13px] text-muted-foreground">
                {antes.map((linea) => (
                  <li key={linea} className="relative">
                    {linea}
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-destructive/50" />
                  </li>
                ))}
              </ul>
            </div>

            {/* La ficha real, al frente — mismos campos, con datos
                reales de la app (estado, patente, ítems, fiado). */}
            <div className="relative rounded-xl border border-border bg-card p-6 shadow-xl shadow-foreground/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Orden de trabajo
                  </p>
                  <p className="mt-1 font-mono text-xl font-semibold tracking-wide">
                    BXFS19
                  </p>
                </div>
                <span className="rounded-full bg-acento/15 px-3 py-1 text-[12px] font-medium text-acento">
                  En proceso
                </span>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Chevrolet Spark · Rosa Muñoz
              </p>

              <div className="mt-5 flex flex-col gap-2 border-t border-border pt-5 text-[14px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Cambio de pastillas delanteras
                  </span>
                  <span className="font-medium">$18.000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Mano de obra freno
                  </span>
                  <span className="font-medium">$12.000</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                <span className="text-[13px] text-muted-foreground">
                  Debe desde el 12 de agosto
                </span>
                <span className="font-mono text-lg font-semibold text-acento">
                  $30.000
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="funciones" className="border-t border-border py-24">
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
            <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              {funciones.map((f) => (
                <div key={f.titulo} className="bg-background p-6">
                  <h3 className="text-lg font-medium">{f.titulo}</h3>
                  <p className="mt-2 text-muted-foreground">{f.resumen}</p>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
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
              className="mt-8 inline-block rounded-lg bg-primary px-6 py-4 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Empezar ahora
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} MecanicoApp</span>
          <div className="flex items-center gap-4">
            <Link
              href="/ayuda"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Ayuda
            </Link>
            <Link
              href="/privacidad"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Privacidad
            </Link>
            <span>Hecho en Chile</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
