import Link from "next/link";
import { BotonVolver } from "@/components/boton-volver";
import { LogoAuth } from "@/components/logo-auth";

export const metadata = {
  title: "Ayuda — MecanicoApp",
};

const TEMAS = [
  { id: "registrarse", texto: "Cómo crear una cuenta" },
  { id: "iniciar-sesion", texto: "Cómo iniciar sesión" },
  { id: "recuperar-contrasena", texto: "Cómo recuperar la contraseña" },
];

/**
 * Manual de usuario público — pensado para quien todavía no logra
 * entrar a la app (registro, login, recuperar clave), así que no
 * puede depender de nada dentro del panel. Una sola página con
 * secciones, no artículos separados: son solo 3 temas hoy, dividirlos
 * en rutas propias sería más para navegar que para leer.
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
            Lo básico para empezar a usar MecanicoApp.
          </p>
        </div>

        <nav className="mt-8 flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          {TEMAS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="text-[14px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              {t.texto}
            </a>
          ))}
        </nav>

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
