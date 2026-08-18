# Segunda visita a Tío Lalo — ~20 de agosto de 2026

Desde la primera visita se construyeron 11 funciones nuevas, casi todas
salidas de lo que él mismo pidió. Él no conoce ninguna.

Esta visita tiene dos objetivos, en este orden:

1. **Saber si usó la app.** Todo lo demás depende de esa respuesta.
2. **Mostrarle lo que salió de lo que él pidió**, y ver cuál le importa
   de verdad cuando la tiene delante.

---

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
