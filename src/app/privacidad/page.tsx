import Link from "next/link";

export const metadata = {
  title: "Política de privacidad — MecanicoApp",
};

/**
 * Borrador redactado sobre lo que la app hace de verdad, no una
 * plantilla genérica. Debe revisarlo un abogado antes de tener usuarios
 * pagando: acá hay datos de terceros (los clientes del taller) y la ley
 * 21.719 tiene multas de hasta 20.000 UTM.
 */
export default function Privacidad() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="text-[14px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Volver
      </Link>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">
        Política de privacidad
      </h1>
      <p className="mt-2 text-[13px] text-muted-foreground">
        Última actualización: agosto de 2026
      </p>

      <div className="mt-8 flex flex-col gap-8 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-lg font-medium">Quiénes somos</h2>
          <p className="mt-2 text-muted-foreground">
            MecanicoApp es una herramienta para que talleres mecánicos
            lleven el registro de los autos que reparan. Esta política
            explica qué datos guardamos, para qué, y qué puedes hacer con
            ellos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Qué datos guardamos</h2>
          <p className="mt-2 text-muted-foreground">
            <strong className="text-foreground">Del taller:</strong> nombre,
            correo, teléfono y nombre del taller. Son los datos con los que
            se crea la cuenta.
          </p>
          <p className="mt-2 text-muted-foreground">
            <strong className="text-foreground">
              De los autos y sus dueños:
            </strong>{" "}
            patente, marca, modelo, VIN, kilometraje, fotos del estado del
            vehículo, y el nombre y teléfono del dueño. Estos datos los
            ingresa el taller, no el dueño del auto.
          </p>
          <p className="mt-2 text-muted-foreground">
            <strong className="text-foreground">De las reparaciones:</strong>{" "}
            qué se reportó, qué se hizo, repuestos, montos cobrados y estado
            de pago.
          </p>
          <p className="mt-2 text-muted-foreground">
            <strong className="text-foreground">Del asistente por voz:</strong>{" "}
            las preguntas que se le hacen y sus respuestas. El audio se
            transcribe a texto y no se guarda; el texto sí queda en el
            historial de conversaciones.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Para qué los usamos</h2>
          <p className="mt-2 text-muted-foreground">
            Únicamente para que la app funcione: mostrar el historial de
            cada auto, llevar la cuenta de lo que se debe y responder las
            consultas del asistente. No vendemos datos ni los usamos para
            publicidad.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">
            Cuándo se comparte con otro taller
          </h2>
          <p className="mt-2 text-muted-foreground">
            El historial de un auto solo se comparte con otro taller si el
            dueño del vehículo lo autorizó expresamente. Sin esa
            autorización el auto no aparece en las búsquedas de otros
            talleres ni se puede acceder a su ficha.
          </p>
          <p className="mt-2 text-muted-foreground">
            Cuando está autorizado, el otro taller ve qué se le hizo al auto
            —fecha, síntoma, descripción del trabajo y fotos— pero{" "}
            <strong className="text-foreground">
              nunca los montos cobrados
            </strong>{" "}
            ni el estado de pago.
          </p>
          <p className="mt-2 text-muted-foreground">
            La autorización se puede retirar cuando se quiera, desmarcándola
            en la ficha del vehículo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Con quién más se comparte</h2>
          <p className="mt-2 text-muted-foreground">
            Usamos servicios de terceros para que la app funcione: Neon
            (base de datos), Vercel (servidor), UploadThing (fotos) y OpenAI
            (transcripción de voz y asistente). Cada uno trata los datos
            solo para prestar su servicio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Tus derechos</h2>
          <p className="mt-2 text-muted-foreground">
            La ley 21.719 te da derecho a acceder a tus datos,
            rectificarlos, suprimirlos, oponerte a su tratamiento y
            llevártelos a otro servicio.
          </p>
          <p className="mt-2 text-muted-foreground">
            Desde <strong className="text-foreground">Mi cuenta</strong>{" "}
            puedes descargar todo lo que guardamos y eliminar tu cuenta con
            todos sus datos, sin pedírselo a nadie. El borrado es inmediato
            y definitivo: se eliminan los registros y también las fotos
            guardadas en el servicio de almacenamiento.
          </p>
          <p className="mt-2 text-muted-foreground">
            Si eres dueño de un auto registrado por un taller y quieres que
            tus datos se corrijan o se borren, pídeselo al taller donde
            atiendes tu vehículo, o escríbenos y lo gestionamos. Respondemos
            dentro de los plazos que fija la ley.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">
            Responsabilidad sobre los datos de los clientes
          </h2>
          <p className="mt-2 text-muted-foreground">
            El taller es responsable de los datos que ingresa sobre sus
            clientes: debe tener su autorización para registrarlos y para
            compartir el historial del vehículo. MecanicoApp actúa como
            encargado del tratamiento, guardando esos datos por cuenta del
            taller.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Contacto</h2>
          <p className="mt-2 text-muted-foreground">
            Para cualquier consulta sobre tus datos, escríbenos a{" "}
            <a
              href="mailto:diegocalfuan23@gmail.com"
              className="underline underline-offset-4 hover:text-foreground"
            >
              diegocalfuan23@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
