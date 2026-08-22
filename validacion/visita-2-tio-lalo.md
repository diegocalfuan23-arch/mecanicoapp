# Segunda visita a Tío Lalo — viernes 21 de agosto de 2026

(Postergada desde el jueves 20 — Tío Lalo estaba topado de pega, sin
relación con la app. Confirmado por chat.)

Desde la primera visita se construyeron 11 funciones nuevas, casi todas
salidas de lo que él mismo pidió. Él no conoce ninguna.

Esta visita tiene dos objetivos, en este orden:

1. **Saber si usó la app.** Todo lo demás depende de esa respuesta.
2. **Mostrarle lo que salió de lo que él pidió**, y ver cuál le importa
   de verdad cuando la tiene delante.

---

## Resultado de la visita (21-08-2026)

Ya había usado la app de verdad antes de esta visita (ver la sección
"Lo que ya sabemos" más abajo) — llegó a la reunión con 4 órdenes
reales cargadas, clientes distintos, montos distintos. La visita
confirmó que la sigue usando y salieron pedidos nuevos, anotados al
vuelo durante la conversación:

**El asistente por voz sí lo usó y le sirvió — validación directa:**

> "Buscaba la patente y la IA me leyó todo lo anotado del vehículo."

Es la confirmación exacta de lo que pidió en la primera visita ("IA
operacional") y que se construyó como el botón "Preguntar" de solo
lectura. Funcionó como se pensó. Además pidió más: "Dictarse sería
práctico" — quiere dictar, no solo consultar. Hoy el dictado por voz
ya existe en varios campos (síntoma, descripción al cerrar) — falta
confirmar si se refiere a algo que no encontró o a extender el dictado
a más lugares.

**Editar una orden después de cerrada / no cerrarla de inmediato:**

> "Encontré otras cosas aparte del diagnóstico" → "No se cierre el
> trabajo de inmediato" → "Editar de órdenes de trabajo"

Le pasó en el trabajo real: diagnosticó algo, después encontró un
problema adicional, y quiso agregarlo sin que la orden quedara cerrada
todavía. Hoy `cerrarOrden` deja el trabajo en estado "terminado" sin
vuelta atrás fácil. Esto es un caso de uso real, con ejemplo concreto
(un retén de cigüeñal con fuga, encontrado aparte del diagnóstico
inicial) — vale la pena revisar el flujo de "orden en proceso, se
agrega más" antes de cerrarla del todo.

**Reingreso del mismo vehículo / varias visitas en el tiempo:**

> "Reingresar vehículo" → "Cuando llegue de nuevo" → "Agregar segundo
> chequeo" → "Ingresar más visitas" → "2da, tercera, 4ta, 5ta"

Parece pedir una forma más fluida de abrir una nueva orden para un
vehículo que ya pasó antes por el taller, sin tener que cargar todo de
cero — el historial ya existe (ficha del vehículo), pero el flujo de
"abrir una orden nueva para un auto conocido" podría no ser obvio
desde ahí. Confirmar en la próxima conversación qué paso específico le
costó.

**Tío Lalo tiene ayudantes — dato nuevo, cambia el perfil del taller:**

> "Roles" → "Agregar equipo de trabajo"

Confirmado (22-08-2026): "los roles son para sus ayudantes,
netamente". Hasta ahora se pensaba a Tío Lalo como taller de una sola
persona — no lo es. Esto conecta directo con la limitación ya conocida
(una cuenta = un taller, sin usuarios separados por persona) que se
había anotado como posible problema solo para talleres grandes tipo
Senna. **Ya no es exclusivo de talleres grandes**: si Tío Lalo también
lo necesita, es un problema más transversal de lo pensado. Sube de
prioridad.

**Imprimir órdenes de trabajo — coincide con Senna:**

> "Imprimir órdenes de trabajo"

Segundo taller que lo pide, de forma independiente. Con Senna había
quedado como "necesidad de un solo taller, no construir todavía". Con
esta segunda mención (aunque sin el mismo detalle del diagrama de
daños que pidió Senna), vale la pena revisar esa decisión.

**Decisión (22-08-2026): imprimir queda como función de un plan
superior/pago, no del plan base.** Los dos talleres que lo pidieron
(Senna, Tío Lalo con ayudantes) son perfiles más grandes o
establecidos, no el taller de una sola persona sin estructura. Con
esto se separa: el plan base sigue enfocado en lo que ya valida bien
(historial, deudas, repuestos con ganancia), y la impresión se guarda
para cuando exista una definición de planes por nivel de taller.

**Sin contexto claro, a confirmar:**

- "Clic para ver vehículos" — posible fricción de navegación, no
  quedó claro qué buscaba exactamente.

## 0. Lo que ya sabemos sin preguntarle

**Sí la probó, solo.** La cuenta la creó él, no nosotros. Todo la
madrugada del 7 de agosto, en seis minutos seguidos:

| Hora | Qué hizo |
|---|---|
| 00:41 | Creó la cuenta ("Tío lalo", Eduardo reyes) |
| 00:46 | Registró un auto real: WB7466, Sanyong Musso |
| 00:47 | Abrió la orden OT-1 |

Es la validación más concreta que hay hasta ahora: abrió la app por su
cuenta, sin nadie mirando, y llegó hasta abrir una orden de trabajo.

**Dónde se detuvo:** la OT-1 quedó sin síntoma y sin kilometraje, en
estado "en proceso". Los dos campos son opcionales, así que la app lo
dejó seguir. Puede ser que solo estuviera mirando cómo funciona, o que
no supiera qué poner sin el auto delante.

Eso convierte la primera pregunta en algo mucho más específico que
"¿la probaste?".

## 1. Antes de mostrar nada (5 min)

Ya sabemos que la abrió. La pregunta no es si la usó, sino qué pasó
después — y hay que hacerla sin que suene a reclamo.

- "Vi que alcanzaste a meter el Musso. ¿Cómo te fue?"
- "Dejaste la orden abierta sin llenar. ¿Qué pasó ahí — no supiste qué
  poner, te faltó tiempo, o solo estabas mirando?"
- "¿La volviste a abrir después de esa noche?"

Esa segunda pregunta es la más valiosa de toda la visita: el punto
exacto donde alguien se detiene dice más que cualquier opinión.

Si dice que no la volvió a abrir, averigua por qué sin justificarte:

- "¿En qué momento del día la habrías abierto, si la hubieras abierto?"
- "¿Qué tendría que pasar para que la usaras mañana?"

**Dos explicaciones técnicas a descartar sin sugerirlas.** Si dice algo
como "no pude entrar" o "no encontré por dónde", ahí recién se
menciona que ahora existe recuperar la clave sola (`/recuperar`). No
adelantarlo antes: si se le ofrece la salida técnica antes de que la
mencione él, no se sabe si de verdad era eso o si solo la tomó porque
estaba disponible.

El link no es el problema — se lo mandamos por este mismo WhatsApp y
lo sigue teniendo ahí. Si el bloqueo fue técnico, es más probable que
haya sido la contraseña que el enlace.

**Importante para esta visita — `/recuperar` hoy no manda el correo a
cualquiera.** Se agregó `RESEND_API_KEY` a producción recién el
16-08-2026 (antes ni siquiera existía ahí, así que si lo intentó antes
de esa fecha, no había forma de que funcionara). Pero incluso ahora,
Resend con dominio de pruebas (`onboarding@resend.dev`) **solo entrega
a la propia cuenta de Resend** — el correo de Tío Lalo no lo recibiría
igual. Falta comprar un dominio y verificarlo para que ande de verdad.
Si en la visita dice que no pudo entrar, no prometerle que `/recuperar`
le va a servir todavía — resolverlo ahí mismo cambiándole la
contraseña a mano o por WhatsApp, no derivarlo a esa pantalla.

Después, pídele que te muestre en su teléfono, no que te cuente:

- "Muéstrame qué hiciste, tal cual."
- Anota dónde se traba, qué botón busca y no encuentra, qué palabra usa
  él que la app no usa.

## 2. Lo que salió de lo que él pidió (10 min)

Mostrar solo lo que él mencionó. No es una demo de todo: cada cosa que
muestres es una que dijo en la primera visita.

| Lo que dijo | Qué mostrarle |
|---|---|
| "La memoria" (cómo lleva las deudas) | **Pagos** — quién debe, hace cuántos días |
| Fotos del estado y del tablero | **Ingresar vehículo** — sacar varias seguidas |
| "Se pide cancelar cuando es importación" | Estado **"Esperando repuesto"** |
| Cobro por ir a comprar el repuesto | Campo de **cargo por traslado** al cerrar |
| "Eso sí, IA operacional" | **Asistente** — preguntarle por voz |
| Ver reparaciones de otros talleres | **Historial compartido** (ver abajo) |

Déjalo tocar. No expliques de más.

## 3. El historial compartido (5 min)

Esto es lo más delicado de la visita, porque cambia según cómo se lo
plantees. Él pidió ver reparaciones hechas en otros talleres.

Lo construido:

- Se busca por **patente exacta** (no por marca ni modelo).
- Se ve **qué se le hizo**, nunca cuánto cobró el otro taller.
- Solo si **el dueño del auto autorizó**, con una casilla en la ficha.

Preguntas:

- "¿Le preguntarías a tus clientes si autorizan esto?"
- "¿Te sirve ver qué le hicieron sin ver cuánto cobraron?"
- "Al revés: ¿te molestaría que otro taller vea lo que tú le hiciste a
  un auto?"

Esa última es la que importa. Si le incomoda, la función completa está
en duda por más que él la haya pedido.

## 4. Lo que quedó sin aclarar (10 min)

Esto es lo más valioso de la visita y no requiere mostrar nada.

**"Atender clientes" — lo que más tiempo le quita.** Fue la respuesta a
la pregunta más importante del guion pasado y quedó en dos palabras.

- "Cuando dices que atender clientes te quita tiempo, ¿cómo es eso?"
- "¿Es que llegan varios a la vez? ¿Que hay que explicarles lo mismo
  muchas veces? ¿Que discuten el precio?"
- "¿Qué pasaría si no los atendieras tú?"

**Inventario — aclarado, y ya construido.** No era control de stock. Lo
que le duele es **qué se compró, para qué auto y cuánto costó**, para
cobrarlo con margen y recuperar al menos el pasaje de ir a buscarlo.

Construido: al cerrar la orden se agregan los repuestos uno por uno —
qué se compró, cuántos, cuánto costó, cuánto se cobra y dónde se
compró. La app calcula la ganancia y avisa en rojo si se pierde plata.

Qué mostrarle y preguntar:

- Mostrarle el formulario con un repuesto cargado y la línea de
  ganancia.
- "¿Así lo anotarías, o es mucho detalle para el día a día?"
- "¿Te ha pasado cobrar un repuesto y darte cuenta después de que te
  quedaste corto?"
- "Lo de 'dónde se compró', ¿te sirve o sobra?"

Lo que sigue sin existir y hay que preguntarle si lo echa de menos:
saber **si tiene algo guardado** en el taller (stock real). Dijo que no
lleva, pero conviene confirmarlo ahora que ve lo otro funcionando.

**Reparaciones compartidas.** Nunca quedó claro entre quiénes.

- "Lo de las reparaciones compartidas, ¿cómo funciona? ¿Con quién las
  compartes?"

**"No se puede cobrar menos que otras aplicaciones."**

- "¿Qué aplicaciones? ¿Has visto otras parecidas?"

## 5. Precio y cierre (5 min)

En la visita pasada dijo entre $7.000 y $20.000, hasta $30.000. Vale la
pena confirmarlo ahora que vio más:

- "La otra vez dijiste que pagarías unos X al mes. ¿Sigue pareciéndote
  razonable con lo que viste hoy?"
- "¿Conoces otro mecánico al que le sirva?"

---

## Qué anotar durante la visita

- Cada palabra que use él y que la app no use — ese es el lenguaje que
  debería tener la interfaz.
- En qué pantalla se traba o duda.
- Qué función le hace decir "ah, eso sí" — y cuál pasa sin comentario.

## Cómo leer el resultado

Ya sabemos que la abrió solo y llegó a registrar un auto. Lo que falta
saber es si volvió.

- **Si la usó solo esa noche** — la app no entró en su rutina. Antes de
  construir cualquier otra cosa hay que entender qué se lo impidió: la
  hora en que trabaja, que no la tiene a mano, o que llenar la orden es
  más lento que su cuaderno.
- **Si la siguió usando pero solo una parte** — esa parte es el
  producto. El resto probablemente sobra.
- **Si le entusiasma algo que no construimos** — es la señal más útil de
  todas.

Y algo que vale la pena reconocer: que un mecánico cree su cuenta y
registre un auto real sin nadie mirando ya es más de lo que consigue la
mayoría de los MVP. El siguiente escalón no es gustar, es volver.
