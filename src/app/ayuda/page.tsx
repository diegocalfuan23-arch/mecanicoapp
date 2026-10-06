import Link from "next/link";
import { BotonVolver } from "@/components/boton-volver";
import { LogoAuth } from "@/components/logo-auth";
import { BuscadorAyuda } from "./buscador";

export const metadata = {
  title: "Ayuda — MecanicoApp",
};

const TEMAS_CUENTA = [
  { id: "registrarse", texto: "Cómo crear una cuenta" },
  { id: "iniciar-sesion", texto: "Cómo iniciar sesión" },
  { id: "recuperar-contrasena", texto: "Cómo recuperar la contraseña" },
];

/**
 * Cómo usar cada módulo — contenido más largo que las descripciones
 * cortas del tour (tour-onboarding.tsx/SECCIONES en navegacion.tsx),
 * pensado para leerse de principio a fin, no solo para orientar un
 * recorrido rápido. `video` queda listo para cuando existan los
 * videos de YouTube — opcional, no bloquea publicar el texto ahora.
 */
const MODULOS = [
  {
    id: "ordenes",
    texto: "Órdenes de trabajo",
    video: null as string | null,
    pasos: [
      "Entra a Órdenes y toca \"Nueva orden\".",
      "Busca al cliente o el vehículo por patente — si no existe, lo creas ahí mismo.",
      "Anota qué se va a hacer: puedes escribirlo en texto libre o elegir del catálogo de Servicios si tu plan lo tiene.",
      "La orden queda con un estado (ingresado, en proceso, esperando repuesto, terminado, entregado) que vas cambiando a medida que avanza el trabajo.",
      "Al cerrarla, registras mano de obra, repuestos usados y el total — eso descuenta stock si usaste Inventario.",
    ],
  },
  {
    id: "vehiculos",
    texto: "Vehículos",
    video: null as string | null,
    pasos: [
      "Entra a Vehículos y toca \"Nuevo vehículo\".",
      "Escribe la patente — en los planes con búsqueda automática, se completan solos marca, modelo, año y color.",
      "Elige el dueño buscándolo entre tus clientes ya registrados, o crea uno nuevo ahí mismo.",
      "Desde la ficha del vehículo ves todo su historial: qué se le ha hecho, cuándo, y cuánto se ha cobrado.",
    ],
  },
  {
    id: "propietarios",
    texto: "Propietarios",
    video: null as string | null,
    pasos: [
      "Acá están todos tus clientes, con su contacto y los vehículos que tienen registrados.",
      "Entra a la ficha de un cliente para ver su historial completo: visitas, gasto total, y si debe algo.",
      "Puedes dejar notas y marcar cuándo conviene contactarlo de nuevo para su próximo servicio.",
    ],
  },
  {
    id: "agenda",
    texto: "Agenda",
    video: null as string | null,
    pasos: [
      "Entra a Agenda y toca el día en que quieres agendar una cita.",
      "Elige el cliente y el vehículo (o anota el contacto si es alguien nuevo), y qué va a hacerse.",
      "La cita queda en el calendario con su hora — puedes cambiar su estado (agendada, confirmada, completada, cancelada) a medida que se acerca la fecha.",
    ],
  },
  {
    id: "historial",
    texto: "Buscar patente",
    video: null as string | null,
    pasos: [
      "Escribe la patente en el buscador — si el vehículo ya pasó por tu taller, ves todo su historial al tiro.",
      "Si nunca lo has atendido pero existe en el sistema, igual puedes ver sus datos técnicos (según lo que el dueño haya compartido).",
      "Si no existe, te ofrece registrarlo directo desde ahí.",
    ],
  },
  {
    id: "presupuestos",
    texto: "Presupuestos",
    video: null as string | null,
    pasos: [
      "Crea un presupuesto igual que una orden, pero sin comprometer el trabajo todavía — es una cotización.",
      "Si el cliente lo acepta, lo conviertes en una orden de trabajo real sin tener que escribir todo de nuevo.",
    ],
  },
  {
    id: "diagnosticos",
    texto: "Diagnósticos",
    video: null as string | null,
    pasos: [
      "Usa esta sección para dejar registrado un diagnóstico técnico de un vehículo — útil cuando el problema no es obvio.",
      "Puedes apoyarte en el Asistente de IA para interpretar códigos de falla o resolver dudas técnicas mientras trabajas.",
    ],
  },
  {
    id: "inspecciones",
    texto: "Inspecciones",
    video: null as string | null,
    pasos: [
      "Usa esta sección antes de comprar o recibir un vehículo usado — es un checklist completo de su estado.",
      "Se guarda con el cliente y el vehículo reales, y queda como respaldo de en qué condiciones llegó.",
    ],
  },
  {
    id: "ventas",
    texto: "Ventas POS",
    video: null as string | null,
    pasos: [
      "Úsala para vender un repuesto o un servicio directo, sin pasar por una orden de trabajo completa — como una caja registradora.",
      "Elige los ítems, el medio de pago, y listo: descuenta stock automáticamente si corresponde.",
    ],
  },
  {
    id: "inventario",
    texto: "Inventario",
    video: null as string | null,
    pasos: [
      "Registra cada repuesto con su costo, precio de venta y stock actual.",
      "Cada vez que un repuesto se usa en una orden o una venta, el stock se descuenta solo.",
      "Puedes definir un mínimo para que te avise antes de quedarte sin stock.",
    ],
  },
  {
    id: "servicios",
    texto: "Servicios",
    video: null as string | null,
    pasos: [
      "Arma tu propio catálogo de servicios y mano de obra, con precios ya definidos.",
      "Al abrir una orden, eliges del catálogo en vez de escribir el precio cada vez.",
    ],
  },
  {
    id: "compras",
    texto: "Compras",
    video: null as string | null,
    pasos: [
      "Registra lo que le compras a tus proveedores.",
      "El stock de Inventario sube automáticamente apenas registras la compra, antes de que la pagues.",
    ],
  },
  {
    id: "equipo",
    texto: "Equipo",
    video: null as string | null,
    pasos: [
      "Invita a quienes trabajan contigo — les llega un link para crear su propia cuenta y contraseña.",
      "Elige su rol (Mecánico, Jefe de taller, o un rol a medida si tu plan lo permite) para decidir qué puede ver y hacer cada uno.",
    ],
  },
  {
    id: "pagos",
    texto: "Pagos",
    video: null as string | null,
    pasos: [
      "Acá ves quién te debe, cuánto, y desde cuándo — los fiados que antes quedaban en la memoria o en una hoja suelta.",
      "Registra un abono cada vez que el cliente paga algo, aunque no sea el total.",
    ],
  },
  {
    id: "caja",
    texto: "Caja",
    video: null as string | null,
    pasos: [
      "Lleva el control de lo que entra y sale en efectivo y otros medios, día por día.",
      "Al final del día, cierras la caja — queda un registro de cuánto hubo y con qué se cuadró.",
    ],
  },
];

/**
 * Manual de usuario público. Dos bloques distintos a propósito: Cuenta
 * (registro/login/recuperar) no depende de tener sesión ni de conocer
 * el panel — por eso usa LogoAuth, igual que las páginas de auth.
 * "Cómo usar cada módulo" es más largo y con buscador porque son 15
 * temas, no 3 — una sola lista sin filtrar sería difícil de escanear.
 */
export default function Ayuda() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <LogoAuth />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8 sm:py-12">
        <BotonVolver />

        <div className="mt-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Centro de ayuda
          </h1>
          <p className="mt-2 text-muted-foreground">
            Cómo crear tu cuenta y cómo usar cada parte de MecanicoApp.
          </p>
        </div>

        <BuscadorAyuda modulos={MODULOS} />

        <div className="mt-16">
          <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
            Tu cuenta
          </h2>
          <nav className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
            {TEMAS_CUENTA.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="text-[14px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {t.texto}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-12">
          <section id="registrarse">
            <h2 className="text-lg font-medium">Cómo crear una cuenta</h2>
            <ol className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1. </span>
                Entra a{" "}
                <Link
                  href="/registro"
                  className="text-foreground underline underline-offset-4 hover:text-acento"
                >
                  mecanicoapp.com/registro
                </Link>
                .
              </li>
              <li>
                <span className="font-medium text-foreground">2. </span>
                Escribe el nombre de tu taller, tu correo y una contraseña de
                al menos 8 caracteres.
              </li>
              <li>
                <span className="font-medium text-foreground">3. </span>
                Listo — entras directo a tu panel, sin tener que confirmar el
                correo antes.
              </li>
            </ol>
            <p className="mt-4 text-[14px] text-muted-foreground">
              Tu cuenta parte en el{" "}
              <span className="text-foreground">Plan Prueba</span>: puedes
              usar la app sin pagar nada mientras decides si te sirve.
            </p>
          </section>

          <section id="iniciar-sesion">
            <h2 className="text-lg font-medium">Cómo iniciar sesión</h2>
            <ol className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1. </span>
                Entra a{" "}
                <Link
                  href="/entrar"
                  className="text-foreground underline underline-offset-4 hover:text-acento"
                >
                  mecanicoapp.com/entrar
                </Link>
                .
              </li>
              <li>
                <span className="font-medium text-foreground">2. </span>
                Escribe el correo y la contraseña con los que te registraste.
              </li>
            </ol>
            <p className="mt-4 text-[14px] text-muted-foreground">
              Si eres parte del equipo de un taller (no el dueño), usa el
              correo y la contraseña que definiste al aceptar la invitación
              — no los del dueño.
            </p>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Si te dice que el correo o la contraseña son incorrectos,
              revisa que no te hayas equivocado de correo (a veces uno tiene
              más de uno) antes de recuperar la contraseña.
            </p>
          </section>

          <section id="recuperar-contrasena">
            <h2 className="text-lg font-medium">
              Cómo recuperar la contraseña
            </h2>
            <ol className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1. </span>
                Entra a{" "}
                <Link
                  href="/recuperar"
                  className="text-foreground underline underline-offset-4 hover:text-acento"
                >
                  mecanicoapp.com/recuperar
                </Link>{" "}
                (o toca &ldquo;Se me olvidó la contraseña&rdquo; en la
                pantalla de inicio de sesión).
              </li>
              <li>
                <span className="font-medium text-foreground">2. </span>
                Escribe el correo con el que te registraste.
              </li>
              <li>
                <span className="font-medium text-foreground">3. </span>
                Te llega un correo con un link — ábrelo y elige tu nueva
                contraseña ahí.
              </li>
            </ol>
            <p className="mt-4 text-[14px] text-muted-foreground">
              Si no te llega el correo en unos minutos, revisa spam. El link
              vence después de un tiempo — si ya pasó, pide uno nuevo.
            </p>
          </section>
        </div>

        <div className="mt-16">
          <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
            Cómo usar cada módulo
          </h2>

          <div className="mt-6 flex flex-col gap-12">
            {MODULOS.map((m) => (
              <section key={m.id} id={m.id}>
                <h3 className="text-lg font-medium">{m.texto}</h3>
                <ol className="mt-4 flex flex-col gap-3 text-[15px] leading-relaxed text-muted-foreground">
                  {m.pasos.map((paso, i) => (
                    <li key={i}>
                      <span className="font-medium text-foreground">
                        {i + 1}.{" "}
                      </span>
                      {paso}
                    </li>
                  ))}
                </ol>
                {m.video && (
                  <a
                    href={m.video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-[13px] text-acento underline underline-offset-4 hover:text-foreground"
                  >
                    Ver video
                  </a>
                )}
              </section>
            ))}
          </div>
        </div>

        <p className="mt-16 border-t border-border pt-6 text-[13px] text-muted-foreground">
          Cómo tratamos los datos está en la{" "}
          <Link
            href="/privacidad"
            className="underline underline-offset-4 hover:text-foreground"
          >
            política de privacidad
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
