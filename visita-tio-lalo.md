# Visita a Tío Lalo — 2026-08-06

Notas de Boris, cruzadas con el guion de validación para ver qué
pregunta generó cada respuesta. Estado de cada tema: **construido**,
**registrado sin construir**, o **fuera de alcance**.

---

## Sección 3 del guion — Fiados y cobro

> "¿Cómo llevas la cuenta de quién te debe y cuánto?"

- **La memoria.** Respuesta directa a la pregunta central de la
  sección: no usa cuaderno ni celular para las deudas, todo vive en su
  cabeza. Esto es la validación más fuerte de toda la visita — confirma
  que el problema de "no recuerdo el historial de deuda" es real, no
  una suposición nuestra. *(justifica toda la sección Pagos)*

- **Clientes de confianza / clientes que no pagan más** (registrado,
  no construido). Dos categorías que él ya distingue mentalmente:
  - "Tío Lalo no me pagó" — clientes que se van y no vuelven.
  - Clientes de confianza que "pagan deudas que había olvidado", a
    veces meses después.
  - Construido parcialmente: en Pagos, las deudas de más de 30 días
    ahora se destacan visualmente (antes estaban en texto chico gris).
    No se construyó ninguna marca de "confianza" — sigue siendo
    criterio suyo, no de la app.

- **Saber qué clientes son "cacho", por la patente** (registrado, no
  construido). Pidió poder identificar rápido, buscando por patente,
  si el dueño de ese auto es un cliente problemático. Relacionado
  directo con el punto anterior — falta validar cómo lo marcaría y qué
  pasa si el auto cambia de dueño.

## Sección 4 del guion — Repuestos e inventario

> "¿Llevas algún control de qué repuestos tienes en el taller?"

- **Se compra y se deja la boleta pegada en cada vehículo** (construido:
  las fotos cumplen ese rol — es evidencia física, no inventario real).
  No lleva stock ni control de qué tiene disponible; el repuesto se
  compra sobre la marcha para cada trabajo. Esto es la respuesta que
  esperábamos como señal de alerta: confirma que el inventario formal
  (`parte`/`parte_usada`, ya en el schema) sigue sin validar y no debe
  construirse todavía.

- **Cobro por ir a comprar repuestos** (construido: campo manual). No
  vino de la sección 4 sino que salió espontáneo, ligado al punto
  anterior:
  - Se cobra al menos el pasaje, o un porcentaje sobre el valor de la
    compra.
  - El porcentaje no es fijo: más alto en repuestos baratos, más bajo
    en caros (20% sobre $60.000 no es lo mismo que sobre $1.000.000 —
    sería absurdo cobrar $200.000 solo por ir a comprar la pieza). Es
    su criterio caso a caso, no una fórmula — por eso el campo
    `cargoTraslado` en "cerrar orden" quedó manual, sin cálculo
    automático.
  - Mano de obra de referencia: $7.000–$20.000. Se suma el IVA al
    cobrar.

- **"Entro a un trabajo a reparar el vehículo que queda acá. Buscar el
  repuesto en desarmadores"** (registrado, sin construir). Describe su
  flujo real: mientras un auto queda esperando, él sale a buscar el
  repuesto en desarmadurías. Es más evidencia de que no hay stock
  propio — todo es sobre pedido.

- **Se pide cancelar lo anterior cuando es importación** (registrado).
  Condición de pago distinta para pedidos especiales: si el repuesto es
  importado, cobra el trabajo anterior antes de partir el nuevo. No es
  el flujo normal.
  - Construido (parcialmente relacionado): el estado **"Esperando
    repuesto"** en Órdenes — cuando el repuesto es de importación, el
    auto se va del taller y vuelve cuando llega. La orden queda visible
    marcada como en pausa, con el detalle de qué se espera.

- **Reparaciones compartidas** (registrado, sin definir). No quedó
  claro entre quién se divide el costo — ¿otro taller?, ¿el cliente y
  un tercero? Preguntar el caso concreto antes de diseñar nada.

- **Repuestos acorde al cliente — pide que no sean de tan mala calidad**
  (registrado, baja prioridad). No es "el más barato", es evitar el
  peor. Podría ser una preferencia en la ficha del cliente o vehículo,
  pero no se ha validado que haga falta anotarlo.

## Sección 5 del guion — El tiempo

> "Aparte de reparar autos, ¿qué es lo que más tiempo te quita?"

- **Lo que más tiempo quita es atender clientes, y también cobrar.**
  Esta era la pregunta marcada como más importante del guion. La
  respuesta principal ("atender clientes") contradice la suposición
  inicial de que el dolor principal era administrativo (fiados,
  historial, repuestos) — pero agregó que el cobro en sí también le
  quita tiempo, lo cual sí conecta directo con la sección de fiados:
  no es solo que no recuerda cuánto le deben, es que el proceso de
  cobrar (ir, insistir, esperar) consume tiempo real. Sigue sin
  repreguntarse qué significa "atender" en concreto: ¿mucha gente
  simultánea?, ¿explicar el mismo diagnóstico varias veces?, ¿negociar
  precio? Repreguntar en la próxima visita antes de asumir una
  solución.

## Sección 7 del guion — Reacción y precio

> "¿Pagarías algo por esto? ¿Cuánto te parecería razonable?"

- **Pagaría entre $7.000 y $20.000, hasta $30.000 como tope.** Es la
  respuesta directa a la pregunta de precio — no confundir con el
  rango de mano de obra de la sección 4, que es el mismo número pero
  para otra cosa (lo que él cobra a sus clientes por ir a buscar un
  repuesto). Este es lo que él pagaría por usar la app. Buena señal:
  dio un número concreto sin que se lo anclara. Falta confirmar si es
  mensual o por otro período — el guion no lo especificó al preguntar
  y no quedó registrado en el chat.

## Fuera del guion — temas que él sacó espontáneos

Estos no respondían a ninguna pregunta planeada; los mencionó por su
cuenta, lo cual en general es buena señal de que le importan de
verdad.

- **Estado del vehículo por fotos** (construido). Foto de cada costado
  y del tablero (panel sinóptico — luces e indicadores) al ingresar el
  auto. El motivo concreto: dejar constancia de cómo llegó el auto
  para que, si el cliente reclama después por una luz de advertencia o
  un daño que ya traía, la foto lo respalde en vez de discutir de
  memoria. Conectado con uploadthing, subida real de imágenes desde el
  formulario de "Abrir orden".

- **"Eso sí, IA operacional"** (construido: primera versión, solo
  lectura). Esperaba que, al buscar una patente, la IA le mostrara
  datos del auto — incluyendo reparaciones hechas en **otros
  talleres**, no solo el suyo (ver más abajo, historial compartido).
  Lo que se construyó: un botón "Preguntar" por voz en Buscar patente
  — dicta algo como "¿cuánto debe la BXFS19?" y responde con el dato
  real. Es de solo lectura por diseño: usa las mismas funciones que ya
  usa el buscador (`buscarVehiculos`, `fichaVehiculo`), nunca modifica
  nada ni ejecuta consultas libres.
  - Lo que **no** se construyó todavía: que la IA registre una orden
    completa a partir de un audio largo (extraer síntoma, montos,
    repuestos de una sola vez). La primera versión de "registrar por
    audio" solo transcribe texto plano a un campo — no interpreta ni
    extrae datos estructurados, porque es más fácil que falle
    silencioso y más caro de construir bien.

- **Historial compartido entre talleres** (idea grande, no se
  construye). Parte de la "IA operacional": esperaba ver reparaciones
  de **otros talleres**, no solo el propio. Es un cambio de
  arquitectura, no una función suelta — hoy los datos están aislados
  por `tallerId`. Implica decidir quién puede escribir en la ficha de
  un auto, si un taller ve lo que otro cobró, cómo evitar historial
  falso, y consentimiento del dueño del vehículo. No es un cambio de
  UI, es cambiar el producto de "cuaderno digital de un taller" a
  "historial vehicular compartido". Vale la pena validar con más
  talleres si todos lo querrían o es curiosidad puntual de él.

- **Registrar por audio** (construido: primera versión). La idea que
  más le gustó en general — dictar en vez de escribir, con las manos
  ocupadas o sucias. Micrófono conectado en "Qué reporta el cliente" y
  "Qué se hizo" en Órdenes, vía Whisper.

- **Reportes de plata** (registrado, no construido). Quiere ver
  ganancias, gastos e ingresos por semana y por mes, con la división
  entre costo de insumos y mano de obra. Ya existe la data en la base
  (`trabajo.manoObra`, `trabajo.repuestos`) — falta solo la pantalla
  de resumen. Candidato natural para la próxima iteración, sin
  necesidad de cambios de modelo de datos.

- **Muchos mecánicos miden el tiempo de trabajo** (registrado, sin
  aclarar). No quedó claro si es algo que él quiere para su taller o
  una observación general del rubro que hizo de pasada. Repreguntar
  directo: "¿tú medirías cuánto te demoras en cada pega?"

- **Reputación de talleres — "hay talleres que son chantas"** (fuera
  de alcance). Quiere poder calificar talleres. Es un producto
  distinto — marketplace o reputación entre talleres —, no una función
  del MVP de un taller individual. No se construye.

- **Múltiples usuarios** (registrado, arquitectura a futuro). El
  taller no es solo él. Hoy la cuenta es de un único usuario
  (better-auth, sin roles). Cambio de modelo de datos cuando se
  valide que hace falta, no una pantalla suelta.

- **"En los talleres se intenta pagar lo menos posible" / "tampoco se
  puede cobrar menos que otras aplicaciones"** (registrado, sin
  construir). Sonó a una referencia de precio de mercado para el
  cobro de mano de obra o para el precio del servicio de la app misma
  — no quedó claro cuál de los dos. Repreguntar en la próxima visita.

---

## Cobertura del guion

| Sección | Cubierta en la charla | Construido de esto |
|---|---|---|
| 1. Abrir | Sí (no quedó anotado en el chat, probablemente respondida) | — |
| 2. Historial del auto | No hay nota directa — falta confirmar si se preguntó | Historial por patente ya existía antes de la visita |
| 3. Fiados y cobro | Sí, con fuerza ("la memoria") | Antigüedad de deuda visible en Pagos |
| 4. Repuestos e inventario | Sí | Fotos como evidencia, cargo de traslado, estado "esperando repuesto" |
| 5. El tiempo | Sí ("atender clientes" + cobrar) | Sin construir — falta repreguntar el detalle |
| 6. Mostrar la app | No hay registro de reacciones en el chat | — |
| 7. Objeciones y precio | Sí — pagaría $7.000–$20.000, tope $30.000 | — |
| 8. Cerrar | No hay nota de referidos ni seguimiento agendado | — |

**Vacío más importante:** no quedó registrado nada de las secciones
6 y 8 — es decir, no sabemos qué le pareció la app al verla en el
celular, ni si quedó algo agendado para seguimiento o referidos. La
sección 7 (precio) sí se cubrió y con una respuesta fuerte: un número
concreto sin ancla, $7.000–$20.000 con tope en $30.000. Vale la pena
confirmar con Boris si la sección 6 se alcanzó a hacer y no se anotó,
o si la visita se cortó antes de llegar ahí.
