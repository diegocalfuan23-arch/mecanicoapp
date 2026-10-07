import Link from "next/link";

const funciones = [
  {
    titulo: "Historial por patente",
    detalle:
      "Qué se cambió, cuándo, qué repuestos llevó y cuánto se cobró. Cuando el cliente vuelve y pregunta si eso ya lo arreglaron, tienes la respuesta.",
  },
  {
    titulo: "Fiados al día",
    detalle:
      "El trabajo salió y el cliente paga después. Anótalo aquí en vez del cuaderno, y deja de perder plata por no acordarte.",
  },
  {
    titulo: "Repuestos y stock",
    detalle:
      "Cada repuesto que ocupas en un trabajo se descuenta solo. Te avisa antes de que te quedes sin lo que más rota.",
  },
  {
    titulo: "El cliente vuelve solo",
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

            <div className="mt-16 flex flex-col gap-24">
              {/* 1. Historial por patente — el buscador real y lo que
                  responde, no una tarjeta describiéndolo. */}
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {funciones[0].titulo}
                  </h3>
                  <p className="mt-3 max-w-md text-muted-foreground">
                    {funciones[0].detalle}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                    <svg
                      viewBox="0 0 20 20"
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    >
                      <path
                        d="M9 15A6 6 0 109 3a6 6 0 000 12zM13.5 13.5L17 17"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="font-mono text-[15px] font-medium">
                      BXFS19
                    </span>
                  </div>
                  <ul className="mt-4 flex flex-col divide-y divide-border border-t border-border">
                    <li className="flex items-center justify-between py-2.5 text-[13px]">
                      <span className="text-muted-foreground">
                        12 ago — Cambio de pastillas delanteras
                      </span>
                      <span className="font-medium">$30.000</span>
                    </li>
                    <li className="flex items-center justify-between py-2.5 text-[13px]">
                      <span className="text-muted-foreground">
                        3 may — Cambio de aceite y filtro
                      </span>
                      <span className="font-medium">$22.000</span>
                    </li>
                    <li className="flex items-center justify-between py-2.5 text-[13px]">
                      <span className="text-muted-foreground">
                        14 ene — Alineación y balanceo
                      </span>
                      <span className="font-medium">$15.000</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 2. Fiados al día — lista de deuda real, orden invertido
                  (visual a la izquierda) para no repetir el ritmo. */}
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className="rounded-xl border border-border bg-card p-5 lg:order-1">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Quién debe
                  </p>
                  <ul className="mt-3 flex flex-col divide-y divide-border">
                    <li className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-[14px] font-medium">Rosa Muñoz</p>
                        <p className="text-[12px] text-muted-foreground">
                          Desde el 12 de agosto
                        </p>
                      </div>
                      <span className="font-mono text-[14px] font-semibold text-acento">
                        $30.000
                      </span>
                    </li>
                    <li className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-[14px] font-medium">Pedro Soto</p>
                        <p className="text-[12px] text-muted-foreground">
                          Desde el 2 de septiembre
                        </p>
                      </div>
                      <span className="font-mono text-[14px] font-semibold text-acento">
                        $45.000
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="lg:order-2">
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {funciones[1].titulo}
                  </h3>
                  <p className="mt-3 max-w-md text-muted-foreground">
                    {funciones[1].detalle}
                  </p>
                </div>
              </div>

              {/* 3. Repuestos y stock — un ítem bajando de stock, con
                  el aviso de reposición que dispara. */}
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {funciones[2].titulo}
                  </h3>
                  <p className="mt-3 max-w-md text-muted-foreground">
                    {funciones[2].detalle}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium">
                        Pastillas de freno delanteras
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        Costo $8.500 · Venta $18.000
                      </p>
                    </div>
                    <span className="font-mono text-lg font-semibold text-destructive">
                      2
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                    <div className="h-full w-[15%] rounded-full bg-destructive/70" />
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-[12px] font-medium text-destructive">
                    Quedan 2 — avisar al proveedor
                  </p>
                </div>
              </div>

              {/* 4. El cliente vuelve solo — el mensaje real que le
                  llegaría, como burbuja de WhatsApp. */}
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className="rounded-xl border border-border bg-card p-5 lg:order-1">
                  <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    <svg viewBox="0 0 20 20" className="size-4 text-success" aria-hidden>
                      <path
                        d="M10 2.5a7.5 7.5 0 00-6.5 11.2L2.5 17.5l3.9-1a7.5 7.5 0 109.6-14z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                    </svg>
                    WhatsApp
                  </div>
                  <div className="mt-3 max-w-[85%] rounded-lg rounded-tl-none bg-background p-3 text-[13px] leading-relaxed">
                    Hola Rosa! Han pasado 6 meses desde tu último servicio en
                    el taller (cambio de pastillas). ¿Quieres que te agendemos
                    una revisión?
                  </div>
                </div>
                <div className="lg:order-2">
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {funciones[3].titulo}
                  </h3>
                  <p className="mt-3 max-w-md text-muted-foreground">
                    {funciones[3].detalle}
                  </p>
                </div>
              </div>
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
