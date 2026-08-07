# Visita a Tío Lalo — 2026-08-06

Notas en crudo de la conversación, agrupadas. Lo que se construye esta
semana está marcado; el resto queda para validar con más talleres antes
de decidir.

## Cobro por ir a buscar repuestos (construido: campo manual)

- Se compra el repuesto y se deja la boleta pegada en la ficha del
  vehículo.
- Se cobra un cargo adicional por el viaje a comprar: al menos el
  pasaje, o un porcentaje sobre el valor de la compra.
- Rango de cobro por mano de obra: $7.000–$20.000. Se suma el IVA al
  cobrar.
- El porcentaje no es fijo: es más alto sobre repuestos baratos y más
  bajo sobre caros (ej. 20% sobre uno de $60.000 no es el mismo % que
  sobre uno de $1.000.000 — sería absurdo cobrar $200.000 por ir a
  comprarlo). Él decide el monto caso a caso según su criterio, no una
  fórmula. El campo `cargoTraslado` en "cerrar orden" ya es manual por
  esto mismo — no se automatiza el cálculo.

## Estado del vehículo por fotos (se construye esta semana)

- Foto de cada costado del auto y del tablero al ingresar el vehículo.
- Es evidencia del estado en que llegó — no hay interpretación por IA
  todavía, solo la foto guardada en la orden.

## Historial compartido entre talleres (idea grande, no se construye)

- Al buscar una patente, Tío Lalo espera ver no solo lo que su propio
  taller le hizo al auto, sino también reparaciones hechas en **otros
  talleres**.
- Esto es un cambio de arquitectura, no una función suelta: hoy los
  datos están aislados por taller (cada `tallerId` solo ve lo suyo). Un
  historial compartido implica decidir quién puede escribir en la
  ficha de un auto, si un taller ve lo que otro cobró, cómo se evita
  que alguien inserte historial falso, y consentimiento del dueño del
  vehículo para que su historial sea visible a cualquier taller.
- No se construye hasta pensar el modelo con calma — no es un cambio
  de UI, es un cambio del producto (de "cuaderno digital de un taller"
  a "historial vehicular compartido"). Vale la pena validarlo con más
  talleres antes: ¿lo querrían todos, o solo Tío Lalo por curiosidad?

## Registrar por audio (se construye: primera versión)

- La idea que más le gustó: mandar un audio (mientras tiene las manos
  ocupadas o sucias) y que quede registrado, en vez de escribir.
- Primera versión: grabar audio, transcribirlo a texto, y ese texto
  llena el campo de síntoma o descripción. No se le pide a la IA que
  extraiga montos ni separe mano de obra de repuestos todavía — eso es
  más caro de construir bien y más fácil que falle silenciosamente.

## Clientes conflictivos / de confianza (registrado, no se construye aún)

- Hay clientes que se van sin pagar ("Tío Lalo no me pagó").
- Hay clientes de confianza que pagan deudas viejas que él ya había
  olvidado.
- Hoy esto vive solo en su memoria. Podría ser una marca en la ficha
  del cliente, pero falta validar cómo lo usaría de verdad.

## Reparaciones compartidas (registrado, sin definir)

- Mencionó que a veces el costo de una reparación se divide. No quedó
  claro entre quién (¿otro taller?, ¿el cliente y un tercero?). Preguntar
  el caso concreto la próxima vez antes de diseñar nada.

## Importaciones (registrado)

- Cuando el repuesto es de importación, pide que se cancele lo anterior
  primero. Suena a una condición de pago distinta para pedidos
  especiales — no es el flujo normal.

## Lo que más tiempo le quita: atender clientes

- No fue repuestos, no fue papeleo. Fue "atender clientes".
- Contradice la suposición inicial de que el dolor principal era
  administrativo. Vale la pena repreguntar esto en la próxima visita:
  ¿atender = mucha gente simultánea, explicar el mismo diagnóstico
  varias veces, negociar precio?

## Reportes de plata (registrado, no se construye aún)

- Quiere ver ganancias, gastos e ingresos por semana y por mes.
- División entre costo de insumos y mano de obra.
- Ya existe la data en la base (trabajo.mano_obra, trabajo.repuestos),
  falta la pantalla de resumen. Candidato natural para la próxima
  iteración.

## Calidad de repuestos (registrado)

- Pide repuestos que no sean de la peor calidad — no necesariamente el
  más barato. Podría ser una preferencia en la ficha del cliente o del
  vehículo ("no usar repuestos genéricos"), pero es de baja prioridad.

## Reputación de talleres (fuera de alcance)

- "Hay talleres que son chantas" — quiere poder calificar talleres.
- Esto es un producto distinto (marketplace/reputación entre talleres),
  no una función del MVP de un taller individual. No se construye.

## Múltiples usuarios (registrado, arquitectura a futuro)

- El taller no es solo él. Hoy la cuenta es de un único usuario
  (better-auth, sin roles). Cuando se valide que hace falta, es cambio
  de modelo de datos, no una pantalla suelta.

## Medición de tiempo de trabajo (registrado)

- Comentó que muchos mecánicos miden cuánto se demoran en cada trabajo.
  No quedó claro si es algo que él quiere para su taller o una
  observación general del rubro. Repreguntar.
