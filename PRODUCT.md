# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dueños y equipos de talleres mecánicos en Chile, de cualquier tamaño: desde el taller independiente de una o dos personas que hoy lleva todo en un cuaderno, hasta talleres más grandes con equipo (jefe de taller, mecánicos) e inventario propio de repuestos. La app escala con el taller — Plan Taller cubre lo básico operativo, Plan Serviteca agrega inventario/ventas/diagnósticos para talleres más completos, Plan Empresarial es a medida para cadenas.

## Product Purpose

Reemplaza el cuaderno y la memoria del mecánico por un sistema que lleva el historial de cada vehículo por patente, los fiados (quién debe, cuánto, desde cuándo), el stock de repuestos, y recordatorios automáticos para que el cliente vuelva — sin planillas ni cuadernos que se pierden.

## Positioning

Un competidor directo (Bujía, software similar para talleres en Chile) cobra $29.990-$36.990 CLP/mes y no tiene evidencia pública de atención conversacional de IA a clientes finales (solo mensajería saliente/automatizada). MecanicoApp cuesta sustancialmente menos (0,5-1,5 UF/mes ≈ $19.000-$58.000 según plan) y ya tiene un Asistente de IA funcional dentro del panel que responde preguntas del mecánico sobre sus propios datos en tiempo real, con planes para extenderlo a conversaciones con clientes vía WhatsApp. La app fue validada hablando primero con talleres reales (no construida a puertas cerradas) y sigue en fase beta activa recogiendo feedback antes de escalar adquisición.

## Operating Context

- El mecánico (o el dueño) opera principalmente desde el celular, muchas veces con las manos ocupadas o sucias — de ahí funciones como el Asistente por voz.
- Flujo real: llega un vehículo → se busca por patente (autocompletado real vía GetAPI) → se abre una orden de trabajo → se registra qué se hizo, repuestos usados, mano de obra → se cobra (efectivo, fiado, o pagado) → el cliente recibe un recordatorio automático meses después para su próximo servicio.
- Talleres reales validando el producto hablando directo con Diego: Tío Lalo (usuario más activo, Plan Taller/Prueba), Senna (impulsa Plan Serviteca con inventario/equipo), Carserv/Boris (feedback detallado, ya cliente de otro software), Grúas Lautaro.
- Producción real en mecanicoapp.com, desplegado en Vercel, con dominio propio y facturación/cobro aún no automatizado (planes se activan manualmente mientras se valida el producto).

## Capabilities and Constraints

- Construido en Next.js 16 (App Router), Tailwind CSS v4, Drizzle ORM sobre Neon Postgres, TypeScript, React 19 — elección ya existente en el repo.
- Funciones reales hoy: historial por patente (con autocompletado de datos del vehículo vía GetAPI), Órdenes de trabajo, Agenda, Vehículos/Propietarios (CRM básico), Inventario y Compras (Plan Serviteca+), Caja y Pagos (fiados), Equipo con roles e invitaciones, Asistente de IA interno (consulta datos del taller por texto o voz).
- Planes: Taller (0,5 UF/mes), Serviteca (1,5 UF/mes), Empresarial (a medida, sin validar aún). Precios en UF, no pesos fijos, para proteger el margen de la inflación sin renegociar con cada taller.
- Sin cobro automatizado todavía (Mercado Pago/facturación electrónica pendiente de construir) — los planes se activan a mano mientras se completa la fase de validación beta.
- PWA instalable — el mecánico la usa como una app nativa en su celular, no solo como sitio web.

## Brand Commitments

- Nombre: MecanicoApp. Logo de texto: "Mecanico" en color de texto normal + "App" en el acento ámbar/naranja de marca.
- Sistema de color ya establecido y con intención deliberada (ver `src/app/globals.css`): ámbar/naranja como color de marca (acento, botones primarios), pensado como "señalética de taller". Modo claro: fondo blanco puro, referencia explícita a Bujía. Modo oscuro: fondo casi negro con tinte cálido, descrito en el propio código como "aguanta la luz del galpón" — pensado para el ambiente real de un taller.
- Voz: directa, coloquial, en segunda persona, sin jerga corporativa — ej. "El cuaderno del taller, en tu celular", "Historial de cada auto por patente, los fiados anotados". Evita sonar a "sistema contable" o a software corporativo genérico.
- Landing actual (`src/app/page.tsx`) ya tiene estructura de contenido validada: hero, comparación "así se lleva un taller hoy" (antes/después), cuatro funciones destacadas, sección de precio/CTA, footer con Ayuda/Privacidad. El pedido actual es remodelar visualmente esta estructura existente — elevarla a un nivel profesional, no reemplazar el contenido ni el sistema de color.

## Evidence on Hand

- Ningún testimonio, cifra de uso, ni logo de cliente aprobado para uso público todavía — los talleres reales (Tío Lalo, Senna, Carserv, Grúas Lautaro) están validando en privado, sin autorización confirmada para citarlos en marketing público. La landing no debe inventar ni insinuar prueba social que no existe.
- Precio de Bujía conocido y verificable ($29.990-$36.990 CLP/mes, planes Básico/Pro) — citable como contexto de mercado, no como comparación directa en la landing salvo que el usuario lo pida explícitamente.

## Product Principles

1. Validar con conversación real antes de construir — el producto nació de hablar con talleres, no de intuición a puertas cerradas (lección aprendida de un proyecto anterior que no logró ningún cliente pese a tener buen SEO/diseño).
2. La app sirve para cualquier tamaño de taller, no solo el independiente chico — los planes escalan funciones, no cambian el producto base.
3. El mecánico usa esto con las manos ocupadas, en el celular, muchas veces en el taller mismo — cualquier superficie debe sentirse rápida y directa, no burocrática.
4. Precio competitivo frente al mercado conocido (Bujía) es parte de la propuesta, aunque hoy no haya flujo de cobro automatizado para hacerlo valer en producción.
