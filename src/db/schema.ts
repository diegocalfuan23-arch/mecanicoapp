import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

/* ── Cuentas y sesiones (Better Auth) ── */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Datos del taller
  taller: text("taller"),
  telefono: text("telefono"),
  // Para el encabezado de la orden de trabajo impresa (Plan Serviteca).
  rut: text("rut"),
  direccion: text("direccion"),
  plan: text("plan").notNull().default("prueba"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Un ayudante que trabaja en el taller pero tiene su propia cuenta
 * para iniciar sesión. El dueño no necesita fila acá: para él,
 * tallerId es directamente su propio user.id (como siempre fue). Un
 * ayudante en cambio ve y trabaja sobre los datos de tallerId, aunque
 * su sesión sea con su propio userId.
 */
export const miembroTaller = pgTable(
  "miembro_taller",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    // jefe_taller · mecanico — el dueño no tiene fila acá (ver arriba),
    // así que solo estos dos valores existen en la práctica. jefe_taller
    // administra el Equipo (invita/quita mecánicos) y ve todo lo demás;
    // mecanico solo opera el día a día (Órdenes, Vehículos, etc.), sin
    // Pagos/Equipo/Inventario/Servicios por defecto.
    rol: text("rol").notNull().default("mecanico"),
    // Override manual sobre el default del rol — pedido real (Carserv):
    // el dueño decide, persona por persona, quién ve Pagos y los
    // precios de costo/venta del inventario, sin tener que ascenderla
    // de rol solo por eso. true por defecto: no le saca acceso a nadie
    // de golpe al desplegar esto.
    vePagos: boolean("ve_pagos").notNull().default(true),
    // Si está seteado, manda sobre `rol`: sus permisos vienen de
    // rolPersonalizado.permisos en vez de los fijos jefe_taller/mecanico
    // — Plan Empresarial. Null en todos los demás planes, así que el
    // comportamiento de Taller/Serviteca queda intacto.
    rolPersonalizadoId: text("rol_personalizado_id").references(
      () => rolPersonalizado.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("miembro_taller_taller_idx").on(t.tallerId)]
);

/**
 * Roles a medida — Plan Empresarial. Cada taller define los suyos
 * (ej. "Contador", "Ayudante de recepción") con un set libre de
 * módulos habilitados, en vez de los dos roles fijos jefe_taller/
 * mecanico. `permisos` guarda un booleano por módulo del sidebar
 * (misma clave que su `href`, ej. "/panel/caja": true) — se lee tal
 * cual, sin migrar filas viejas si mañana se agrega un módulo nuevo:
 * uno ausente en el jsonb simplemente se trata como `false`.
 */
export const rolPersonalizado = pgTable(
  "rol_personalizado",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    permisos: jsonb("permisos").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("rol_personalizado_taller_idx").on(t.tallerId)]
);

/**
 * Invitación a unirse al Equipo de un taller — reemplaza al flujo
 * anterior donde el dueño/jefe definía la contraseña del mecánico a
 * mano. El invitado recibe un link con `token`, crea su propia cuenta
 * y contraseña, y queda vinculado al taller con el rol ya decidido de
 * antemano. `usadaEn` null = todavía pendiente; una invitación usada
 * o vencida no vuelve a servir (se valida al abrir el link).
 */
export const invitacionTaller = pgTable(
  "invitacion_taller",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Quién generó la invitación — el dueño o un jefe_taller — para
    // saber a nombre de quién auditar el alta si hace falta después.
    invitadoPorId: text("invitado_por_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    nombre: text("nombre").notNull(),
    rol: text("rol").notNull().default("mecanico"),
    // Mismo criterio que miembroTaller.rolPersonalizadoId: si viene
    // seteado, manda sobre `rol` al aceptar la invitación.
    rolPersonalizadoId: text("rol_personalizado_id").references(
      () => rolPersonalizado.id,
      { onDelete: "set null" }
    ),
    expiraEn: timestamp("expira_en").notNull(),
    usadaEn: timestamp("usada_en"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("invitacion_taller_taller_idx").on(t.tallerId),
    index("invitacion_taller_token_idx").on(t.token),
  ]
);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ── El taller ── */

export const cliente = pgTable(
  "cliente",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Correlativo por taller para identificar rápido a un cliente
    // frecuente (Cliente #1, #2...) — Plan Serviteca en adelante.
    numero: integer("numero").notNull(),
    nombre: text("nombre").notNull(),
    apellido: text("apellido"),
    // RUT de la persona (o de quien firma, si es empresa) — separado
    // de empresaRut, que es el RUT de la razón social.
    rut: text("rut"),
    // Si viene marcado, `rut` en realidad guarda un pasaporte o DNI
    // extranjero, no un RUT chileno — mismo campo, cambia el formato
    // esperado en vez de duplicar la columna.
    documentoAlternativo: boolean("documento_alternativo")
      .notNull()
      .default(false),
    telefono: text("telefono"),
    email: text("email"),
    direccion: text("direccion"),
    direccionDepto: text("direccion_depto"),
    comuna: text("comuna"),
    ciudad: text("ciudad"),
    // Cuando el auto es de una empresa, no de una persona natural —
    // Plan Serviteca en adelante. Si es empresa, `nombre` pasa a ser
    // la razón social (mismo campo, sigue siendo "quién es" en toda
    // la app) y este campo `empresa` guarda el giro, no el nombre.
    esEmpresa: boolean("es_empresa").notNull().default(false),
    empresa: text("empresa"),
    empresaRut: text("empresa_rut"),
    notas: text("notas"),

    /**
     * Cómo se ha portado con los pagos: confianza · normal · problema.
     *
     * Es un juicio del taller sobre su propio cliente y NO se comparte
     * con nadie: compartirlo sería una lista negra entre talleres, con
     * los problemas legales que eso trae (ley 21.719, datos que afectan
     * la reputación de una persona).
     */
    trato: text("trato").notNull().default("normal"),
    /** Cómo suele pagar: contado · cuotas · fiado. */
    formaPago: text("forma_pago"),

    // Editables a mano por el taller — 1 a 5 estrellas y 0 a 10 (Net
    // Promoter Score). Sin encuesta automática todavía: es un juicio
    // manual del mecánico, no un promedio calculado.
    rating: integer("rating"),
    nps: integer("nps"),

    // Si el cliente quiere avisos del taller por este canal. Se
    // guarda ya, aunque el envío automático por email todavía no
    // existe — el dato queda listo para cuando se conecte.
    // notificarWhatsapp no se persiste todavía: el toggle sigue
    // deshabilitado hasta que haya integración de WhatsApp.
    notificarEmail: boolean("notificar_email").notNull().default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("cliente_taller_idx").on(t.tallerId)]
);

export const vehiculo = pgTable(
  "vehiculo",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // La patente es la llave con la que el mecánico busca todo
    patente: text("patente").notNull(),
    vin: text("vin"),

    marca: text("marca"),
    modelo: text("modelo"),
    anio: integer("anio"),
    color: text("color"),
    // auto · camioneta · SUV · furgón · moto · camión · bus
    tipo: text("tipo"),
    motor: text("motor"),
    // V6, V8, 4 en línea, etc. — distinto de `motor` (cilindrada +
    // combustible en texto libre, ej. "2.4 diésel").
    configuracionMotor: text("configuracion_motor"),
    // Cilindrada, ej. "1.6", "2.0" — Plan Serviteca en adelante.
    cilindrada: text("cilindrada"),
    // Patente del móvil de flota/empresa, distinta de la patente del
    // vehículo si aplica — Plan Serviteca en adelante.
    movil: text("movil"),
    ejes: integer("ejes"),
    // Japonés, coreano, europeo, americano, chino
    procedencia: text("procedencia"),
    // Con cuánto llegó al taller la primera vez
    kilometrajeInicial: integer("kilometraje_inicial"),

    // El dueño se maneja aparte: tiene ficha propia y puede tener varios autos
    propietarioId: text("propietario_id").references(() => cliente.id, {
      onDelete: "set null",
    }),

    // Quien acompaña o puede retirar el auto: hijo, esposa, mamá.
    // Es un dato del vehículo, no una ficha aparte.
    copropietario: text("copropietario"),
    copropietarioTelefono: text("copropietario_telefono"),

    // Primera vez que entra al taller
    primeraVez: boolean("primera_vez").notNull().default(true),

    // El dueño del auto autorizó que otros talleres vean el historial de
    // reparaciones de su vehículo. Sin esto no se comparte nada: la ley
    // 21.719 exige consentimiento del titular de los datos, y el dueño
    // del auto es el titular aunque el usuario de la app sea el taller.
    comparteHistorial: boolean("comparte_historial").notNull().default(false),
    consentimientoFecha: timestamp("consentimiento_fecha"),

    notas: text("notas"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("vehiculo_patente_idx").on(t.tallerId, t.patente),
    // Sin tallerId: para cruzar la misma patente entre distintos talleres.
    index("vehiculo_patente_global_idx").on(t.patente),
    index("vehiculo_vin_idx").on(t.tallerId, t.vin),
    index("vehiculo_propietario_idx").on(t.propietarioId),
  ]
);

export const trabajo = pgTable(
  "trabajo",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    vehiculoId: text("vehiculo_id")
      .notNull()
      .references(() => vehiculo.id, { onDelete: "cascade" }),

    // Número correlativo por taller: OT-1, OT-2…
    numero: integer("numero").notNull(),

    // Quién atendió el trabajo — el dueño o un ayudante del equipo.
    // Sale impreso en la línea de firma en vez de quedar en blanco —
    // Plan Serviteca en adelante.
    tecnicoId: text("tecnico_id").references(() => user.id, {
      onDelete: "set null",
    }),
    // Nombre libre del técnico cuando no tiene cuenta en la app —
    // pedido real: hay talleres donde no todos los que trabajan usan
    // el sistema, pero igual debe quedar registrado quién lo hizo.
    // Mutuamente excluyente con tecnicoId: uno de los dos, no ambos.
    tecnicoNombre: text("tecnico_nombre"),

    // Quien autoriza el trabajo puede no ser el dueño del auto (ej. la
    // esposa, un hijo) — Plan Serviteca en adelante.
    ordenadoPor: text("ordenado_por"),
    ordenadoPorFono: text("ordenado_por_fono"),

    // Lo que el cliente reporta al dejar el auto, con sus palabras
    sintoma: text("sintoma"),
    // Qué se encontró que causa el síntoma — distinto del síntoma
    // (lo que dice el cliente) y de la descripción (lo que se hace).
    diagnostico: text("diagnostico"),
    // Lo que efectivamente se hizo; se completa al cerrar la orden
    descripcion: text("descripcion"),
    kilometraje: integer("kilometraje"),
    // Estado del auto al recibirlo — Plan Serviteca en adelante. Cada
    // marca es {zona, tipo}, tipo: abolladura · rayadura · quebrado.
    // Ver el diagrama del auto en el formulario de abrir orden.
    danos: text("danos").array().notNull().default([]),
    // Daño que no calza con ninguna zona del diagrama (ej. "rueda de
    // auxilio pinchada") — texto libre aparte, Plan Serviteca.
    danoOtro: text("dano_otro"),
    // Porcentaje (0-100) como texto, ej. "65" — Plan Serviteca. Órdenes
    // viejas pueden traer los valores fijos de antes (vacio · 1/4 · 1/2
    // · 3/4 · lleno); ver combustiblePorcentaje() en accesorios-auto.ts
    // para leer ambos formatos sin romper el historial.
    combustible: text("combustible"),
    // Qué accesorios trae el auto al recibirlo, para respaldo ante un
    // reclamo al retirarlo ("no traía la rueda de repuesto"). Cada
    // elemento es el id del accesorio que SÍ trae — ausencia = no trae.
    // Uno que no está en el catálogo fijo se guarda como texto libre
    // con el prefijo "otro:" (ej. "otro:Cadenas de nieve").
    accesorios: text("accesorios").array().notNull().default([]),
    // Nota libre de la orden, aparte de síntoma/diagnóstico/descripción
    // — Plan Serviteca en adelante.
    observaciones: text("observaciones"),
    // Checklist de servicios del catálogo propio del taller (ids de
    // servicioTaller) marcados al cerrar — Plan Serviteca, pedido por
    // Senna. Aparte del texto libre de "descripcion".
    serviciosRealizados: text("servicios_realizados").array().notNull().default([]),

    // ingresado · en_proceso · esperando_repuesto · terminado · entregado
    estado: text("estado").notNull().default("ingresado"),
    fechaEntrega: timestamp("fecha_entrega"),
    // Qué se está esperando y por qué el auto no está en el taller
    // (ej: "amortiguadores, pieza importada, llega en 10 días").
    esperaDetalle: text("espera_detalle"),

    // En pesos, sin decimales
    manoObra: integer("mano_obra").notNull().default(0),
    // Mano de obra específica de frenos, separada de la general — Plan
    // Serviteca en adelante (aparece como línea propia en la cotización).
    manoObraFreno: integer("mano_obra_freno").notNull().default(0),
    repuestos: integer("repuestos").notNull().default(0),
    // Ir a comprar el repuesto tiene costo aparte: al menos el pasaje,
    // o un porcentaje del valor de la compra si es más lejos.
    cargoTraslado: integer("cargo_traslado").notNull().default(0),
    /**
     * El IVA se suma encima de lo cobrado, no viene incluido: mano de
     * obra + repuestos + traslado es el neto, y esto es el 19% que se
     * agrega. Se guarda calculado para que el histórico no cambie si la
     * tasa sube algún día.
     */
    iva: integer("iva").notNull().default(0),
    /** Neto + IVA: lo que efectivamente paga el cliente. */
    total: integer("total").notNull().default(0),

    // URLs de las fotos del auto al ingresar: estado y tablero.
    // Quedan preparadas para cuando se conecte el almacenamiento de
    // archivos; por ahora la columna existe pero no se llena desde la UI.
    fotos: text("fotos").array().notNull().default([]),

    // pagado · fiado · abonado
    estadoPago: text("estado_pago").notNull().default("pagado"),
    abonado: integer("abonado").notNull().default(0),
    fechaPago: timestamp("fecha_pago"),
    // Solo tiene sentido si estadoPago es "pagado": efectivo ·
    // transferencia · debito · credito. La máquina POS de tarjeta no
    // está conectada al sistema — esto es lo que el mecánico marca a
    // mano después de cobrar, igual que hoy marca "pagado" o "fiado".
    metodoPago: text("metodo_pago"),
    // Solo si metodoPago es "credito" — cuántas cuotas eligió el
    // cliente en la máquina POS al momento de pagar.
    cuotas: integer("cuotas"),

    fecha: timestamp("fecha").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("trabajo_vehiculo_idx").on(t.vehiculoId),
    index("trabajo_taller_fecha_idx").on(t.tallerId, t.fecha),
    index("trabajo_pago_idx").on(t.tallerId, t.estadoPago),
  ]
);

export const parte = pgTable(
  "parte",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    codigo: text("codigo"),
    // Distinto de `codigo` ("código de parte", del fabricante) — el
    // SKU es el identificador interno propio del taller.
    sku: text("sku"),
    // Bosch, NGK, Monroe... — Plan Serviteca en adelante.
    marca: text("marca"),
    stock: integer("stock").notNull().default(0),
    stockMinimo: integer("stock_minimo").notNull().default(0),
    costo: integer("costo").notNull().default(0),
    precio: integer("precio").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("parte_taller_idx").on(t.tallerId)]
);

/**
 * Catálogo de servicio y mano de obra — Plan Serviteca. Separado de
 * `parte` porque no tienen stock (no se agotan): un servicio se cobra
 * a precio fijo, la mano de obra se cobra por tarifa × horas. Por eso
 * las columnas de precio/tiempo son distintas según `tipo`, y quedan
 * en null las que no aplican — no es lo mismo que `servicioTaller`
 * (ese es el checklist que se marca al cerrar una orden, sin precio).
 */
export const itemServicio = pgTable(
  "item_servicio",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull(), // servicio · mano_obra
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    costo: integer("costo").notNull().default(0),
    precio: integer("precio"), // solo tipo "servicio"
    duracionMinutos: integer("duracion_minutos"), // solo tipo "servicio"
    tarifaHora: integer("tarifa_hora"), // solo tipo "mano_obra"
    horasPorDefecto: integer("horas_por_defecto"), // solo tipo "mano_obra"
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("item_servicio_taller_idx").on(t.tallerId),
    index("item_servicio_tipo_idx").on(t.tallerId, t.tipo),
  ]
);

/**
 * Catálogo de servicios propio de cada taller — Plan Serviteca. Antes
 * era una lista fija en código (lib/servicios-catalogo.ts), igual
 * para todos los talleres; ahora cada dueño arma la suya, agrupada
 * igual que el checklist en papel (grupo + código + etiqueta).
 * orden ordena tanto los grupos entre sí como los items dentro del
 * mismo grupo — dos filas pueden compartir orden sin problema, solo
 * define un criterio estable de ordenamiento visual.
 */
export const servicioTaller = pgTable(
  "servicio_taller",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    grupo: text("grupo").notNull(),
    codigo: text("codigo").notNull(),
    etiqueta: text("etiqueta").notNull(),
    // Insumo del inventario que este servicio suele usar (ej. "Cambio
    // de aceite motor" → "Aceite 15W40") — solo referencia, no
    // descuenta stock todavía al marcar el servicio.
    parteId: text("parte_id").references(() => parte.id, {
      onDelete: "set null",
    }),
    orden: integer("orden").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("servicio_taller_taller_idx").on(t.tallerId)]
);

export const parteUsada = pgTable(
  "parte_usada",
  {
    id: text("id").primaryKey(),
    trabajoId: text("trabajo_id")
      .notNull()
      .references(() => trabajo.id, { onDelete: "cascade" }),
    parteId: text("parte_id").references(() => parte.id, {
      onDelete: "set null",
    }),
    // Se guarda el nombre por si la parte se borra del inventario
    nombre: text("nombre").notNull(),
    // Código interno del repuesto en la cotización impresa — no es el
    // parteId (que es interno de la app), es el código que el taller
    // usa en su papel — Plan Serviteca en adelante.
    codigo: text("codigo"),
    cantidad: integer("cantidad").notNull().default(1),
    // Lo que se le cobra al cliente por unidad
    precioUnitario: integer("precio_unitario").notNull().default(0),
    // Lo que el taller pagó por unidad. Sin esto no se puede saber si
    // el trabajo dejó ganancia: es el dolor que Tío Lalo describió como
    // "inventario" — qué se compró, para qué auto y cuánto costó.
    costoUnitario: integer("costo_unitario").notNull().default(0),
    // Desarmaduría, casa de repuestos, importado…
    dondeSeCompro: text("donde_se_compro"),
  },
  (t) => [index("parte_usada_trabajo_idx").on(t.trabajoId)]
);

/**
 * Lo que se va haciendo mientras la orden sigue abierta, línea por
 * línea — pedido real de Tío Lalo: cambia algo (ej. "cambio de
 * embrague"), anota cuánto costó de mano de obra y de repuesto, y
 * quiere ver el total acumulado del cliente sin esperar a cerrar la
 * orden. Al cerrar, la suma de estas líneas precarga los campos
 * finales de mano de obra y repuestos — no reemplaza a parteUsada
 * (que es detalle fino de repuestos con descuento de inventario),
 * es el monto grueso de "qué se ha hecho y cuánto lleva".
 */
export const procedimiento = pgTable(
  "procedimiento",
  {
    id: text("id").primaryKey(),
    trabajoId: text("trabajo_id")
      .notNull()
      .references(() => trabajo.id, { onDelete: "cascade" }),
    descripcion: text("descripcion").notNull(),
    manoObra: integer("mano_obra").notNull().default(0),
    repuesto: integer("repuesto").notNull().default(0),
    repuestoNombre: text("repuesto_nombre"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("procedimiento_trabajo_idx").on(t.trabajoId)]
);

export const abono = pgTable(
  "abono",
  {
    id: text("id").primaryKey(),
    trabajoId: text("trabajo_id")
      .notNull()
      .references(() => trabajo.id, { onDelete: "cascade" }),
    monto: integer("monto").notNull(),
    nota: text("nota"),
    fecha: timestamp("fecha").notNull().defaultNow(),
  },
  (t) => [index("abono_trabajo_idx").on(t.trabajoId)]
);

/** Cada conversación con el asistente, para poder retomarla después. */
export const conversacion = pgTable(
  "conversacion",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Se arma con la primera pregunta, para reconocerla en la lista
    titulo: text("titulo").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("conversacion_taller_idx").on(t.tallerId, t.updatedAt)]
);

export const mensaje = pgTable(
  "mensaje",
  {
    id: text("id").primaryKey(),
    conversacionId: text("conversacion_id")
      .notNull()
      .references(() => conversacion.id, { onDelete: "cascade" }),
    // usuario · asistente
    rol: text("rol").notNull(),
    texto: text("texto").notNull(),
    fecha: timestamp("fecha").notNull().defaultNow(),
  },
  (t) => [index("mensaje_conversacion_idx").on(t.conversacionId, t.fecha)]
);

/**
 * Caché de lo que devuelve GetAPI por patente — compartido entre
 * todos los talleres, sin tallerId: son datos públicos del vehículo
 * (marca, modelo, VIN...), no algo privado de un taller. Evita
 * volver a consultar la API si dos talleres buscan la misma patente,
 * o el mismo taller la busca dos veces — importante con el límite
 * bajo de consultas por minuto de la key de prueba.
 */
export const vehiculoExterno = pgTable("vehiculo_externo", {
  patente: text("patente").primaryKey(),
  vin: text("vin"),
  marca: text("marca"),
  modelo: text("modelo"),
  anio: integer("anio"),
  color: text("color"),
  motor: text("motor"),
  cilindrada: text("cilindrada"),
  tipo: text("tipo"),
  kilometraje: integer("kilometraje"),
  consultadoEn: timestamp("consultado_en").notNull().defaultNow(),
});

/**
 * Búsquedas recientes por patente — personal de cada mecánico (por
 * userId, no por taller: el dueño y cada ayudante ven solo las
 * suyas), para no reescribir la misma patente dos veces. Vive en el
 * servidor a propósito, no en localStorage — así persiste aunque el
 * mecánico cambie de celular o navegador.
 */
export const busquedaPatente = pgTable(
  "busqueda_patente",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    patente: text("patente").notNull(),
    buscadoEn: timestamp("buscado_en").notNull().defaultNow(),
  },
  (t) => [index("busqueda_patente_user_idx").on(t.userId, t.buscadoEn)]
);

/**
 * Cotización antes de que el auto esté físicamente en el taller —
 * Plan Serviteca. A propósito NO tiene vehiculoId/propietarioId
 * obligatorio: alguien puede llamar a preguntar precio sin haber
 * traído el auto todavía, así que se anota solo lo que se sepa (la
 * patente sí es obligatoria, es la llave con la que se busca todo acá).
 * Al aprobarse se genera un `trabajo` real — ver aprobarPresupuesto()
 * en presupuestos/acciones.ts — y trabajoId queda para no perder el
 * vínculo ni poder aprobarlo dos veces.
 */
export const presupuesto = pgTable(
  "presupuesto",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    numero: integer("numero").notNull(),

    patente: text("patente").notNull(),
    clienteNombre: text("cliente_nombre"),
    clienteTelefono: text("cliente_telefono"),

    sintoma: text("sintoma"),
    diagnostico: text("diagnostico"),

    // pendiente · aprobado · rechazado
    estado: text("estado").notNull().default("pendiente"),
    // Solo si se aprobó: el trabajo real que se generó a partir de esto.
    trabajoId: text("trabajo_id").references(() => trabajo.id, {
      onDelete: "set null",
    }),

    fecha: timestamp("fecha").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("presupuesto_taller_idx").on(t.tallerId, t.fecha),
    index("presupuesto_estado_idx").on(t.tallerId, t.estado),
  ]
);

/** Cada línea cotizada dentro de un presupuesto — mismo patrón que parteUsada. */
export const itemPresupuesto = pgTable(
  "item_presupuesto",
  {
    id: text("id").primaryKey(),
    presupuestoId: text("presupuesto_id")
      .notNull()
      .references(() => presupuesto.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    cantidad: integer("cantidad").notNull().default(1),
    precioUnitario: integer("precio_unitario").notNull().default(0),
  },
  (t) => [index("item_presupuesto_presupuesto_idx").on(t.presupuestoId)]
);

/**
 * Revisión técnica del auto, separada de la Orden — Plan Serviteca.
 * Mismo criterio que presupuesto: patente/cliente sueltos (no exige
 * vehiculoId), porque el diagnóstico puede hacerse antes de decidir
 * si se abre una orden de trabajo. Sin aprobar/rechazar (no es una
 * cotización): solo queda "vinculado" cuando se asocia a una Orden.
 */
export const diagnostico = pgTable(
  "diagnostico",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    numero: integer("numero").notNull(),

    patente: text("patente").notNull(),
    clienteNombre: text("cliente_nombre"),
    clienteTelefono: text("cliente_telefono"),

    // Mismo patrón mutuamente excluyente que trabajo.tecnicoId/tecnicoNombre.
    tecnicoId: text("tecnico_id").references(() => user.id, {
      onDelete: "set null",
    }),
    tecnicoNombre: text("tecnico_nombre"),

    falla: text("falla"),
    procedimiento: text("procedimiento"),

    fotos: text("fotos").array().notNull().default([]),
    videos: text("videos").array().notNull().default([]),
    documentos: text("documentos").array().notNull().default([]),

    // pendiente · vinculado
    estado: text("estado").notNull().default("pendiente"),
    trabajoId: text("trabajo_id").references(() => trabajo.id, {
      onDelete: "set null",
    }),

    fecha: timestamp("fecha").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("diagnostico_taller_idx").on(t.tallerId, t.fecha),
    index("diagnostico_estado_idx").on(t.tallerId, t.estado),
  ]
);

/** Cada paso del checklist de un diagnóstico — se agregan a mano, sin plantillas por ahora. */
export const pasoDiagnostico = pgTable(
  "paso_diagnostico",
  {
    id: text("id").primaryKey(),
    diagnosticoId: text("diagnostico_id")
      .notNull()
      .references(() => diagnostico.id, { onDelete: "cascade" }),
    texto: text("texto").notNull(),
    hecho: boolean("hecho").notNull().default(false),
    orden: integer("orden").notNull().default(0),
  },
  (t) => [index("paso_diagnostico_diagnostico_idx").on(t.diagnosticoId)]
);

/**
 * Venta de mostrador — Plan Serviteca. Distinta de una Orden de
 * trabajo: es para vender un repuesto o un ítem suelto sin abrir todo
 * el flujo de diagnóstico/reparación. Cliente y vehículo son sueltos
 * y opcionales, mismo criterio que diagnostico/presupuesto — pero acá
 * casi siempre irán vacíos (alguien de mostrador, no necesariamente
 * un cliente del taller).
 *
 * No usa la tabla `abono` (que exige un trabajoId de Orden) — el
 * dinero de esto se suma aparte en el resumen de Pagos, no se mezcla
 * en la misma tabla que los cobros de Órdenes.
 */
export const venta = pgTable(
  "venta",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    numero: integer("numero").notNull(),

    // Cliente real del catálogo de Propietarios — obligatorio en venta
    // pagada (validado en crearVenta), no en cotización. clienteNombre
    // y clienteTelefono quedan como snapshot histórico: si el cliente
    // se edita después, la venta ya emitida no cambia retroactivamente.
    clienteId: text("cliente_id").references(() => cliente.id, {
      onDelete: "set null",
    }),
    clienteNombre: text("cliente_nombre"),
    clienteTelefono: text("cliente_telefono"),
    patente: text("patente"),

    // pagada · cotizacion
    estado: text("estado").notNull().default("pagada"),
    // efectivo · tarjeta · transferencia · otro — solo si quedó pagada.
    metodoPago: text("metodo_pago"),
    referenciaPago: text("referencia_pago"),

    descuentoPorcentaje: integer("descuento_porcentaje").notNull().default(0),
    conIva: boolean("con_iva").notNull().default(false),
    total: integer("total").notNull().default(0),

    notas: text("notas"),

    fecha: timestamp("fecha").notNull().defaultNow(),
  },
  (t) => [
    index("venta_taller_idx").on(t.tallerId, t.fecha),
    index("venta_estado_idx").on(t.tallerId, t.estado),
    index("venta_cliente_idx").on(t.clienteId),
  ]
);

/**
 * Cada línea del carrito — un repuesto real (parteId) o un ítem libre
 * (nombre escrito a mano, parteId null). Solo las líneas con parteId
 * descuentan stock al confirmar la venta.
 */
export const itemVenta = pgTable(
  "item_venta",
  {
    id: text("id").primaryKey(),
    ventaId: text("venta_id")
      .notNull()
      .references(() => venta.id, { onDelete: "cascade" }),
    parteId: text("parte_id").references(() => parte.id, {
      onDelete: "set null",
    }),
    nombre: text("nombre").notNull(),
    cantidad: integer("cantidad").notNull().default(1),
    precioUnitario: integer("precio_unitario").notNull().default(0),
    // repuesto · servicio · mano_obra — solo en un ítem libre (sin
    // parteId); una línea de repuesto real ya se identifica por su
    // relación con `parte`, no necesita este campo.
    tipo: text("tipo"),
  },
  (t) => [index("item_venta_venta_idx").on(t.ventaId)]
);

/**
 * Caja — Plan Serviteca. Movimiento manual de dinero que no viene de
 * un abono de Orden ni de una venta POS pagada (esos dos ya se leen
 * directo desde `abono`/`venta`, igual que en Pagos): un gasto, un
 * retiro, un ingreso suelto que el mecánico anota a mano.
 */
export const movimientoCaja = pgTable(
  "movimiento_caja",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull(), // ingreso · egreso
    monto: integer("monto").notNull(),
    descripcion: text("descripcion").notNull(),
    referencia: text("referencia"),
    categoria: text("categoria"),
    medioPago: text("medio_pago"),
    notas: text("notas"),
    fecha: timestamp("fecha").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("movimiento_caja_taller_idx").on(t.tallerId, t.fecha),
  ]
);

/**
 * Un cierre de caja fija el disponible de ese día — el día siguiente
 * arranca con ese monto como "disponible anterior", en vez de
 * recalcular desde el principio de los tiempos cada vez. Un día sin
 * cierre no bloquea nada: el disponible anterior simplemente busca el
 * cierre más reciente y suma lo que pasó después.
 */
export const cierreCaja = pgTable(
  "cierre_caja",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Fecha calendario del día que se cierra (sin hora) — un solo
    // cierre por taller por día.
    fecha: timestamp("fecha").notNull(),
    disponible: integer("disponible").notNull(),
    comentario: text("comentario"),
    cerradoPorId: text("cerrado_por_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("cierre_caja_taller_idx").on(t.tallerId, t.fecha),
  ]
);

/**
 * Inspección pre-compra — Plan Serviteca. A diferencia de Diagnóstico
 * (patente/cliente sueltos), acá cliente y vehículo son reales del
 * catálogo (BuscadorCliente/BuscadorVehiculo), porque el resultado es
 * un informe formal que alguien va a leer para decidir si compra el
 * auto — necesita quedar bien identificado, no solo un apunte interno.
 */
export const inspeccion = pgTable(
  "inspeccion",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    numero: integer("numero").notNull(),

    clienteId: text("cliente_id").references(() => cliente.id, {
      onDelete: "set null",
    }),
    vehiculoId: text("vehiculo_id").references(() => vehiculo.id, {
      onDelete: "set null",
    }),

    // Datos complementarios del vehículo — no todos viven en la ficha
    // de Vehículos (esos son fijos del auto; estos son del día de la
    // inspección, ej. la transmisión puede no estar cargada en la
    // ficha general).
    combustible: text("combustible"),
    kilometraje: integer("kilometraje"),
    transmision: text("transmision"),
    traccion: text("traccion"),

    // Documentos del vehículo — vigencia, no archivos.
    permisoCirculacion: text("permiso_circulacion"),
    revisionTecnica: text("revision_tecnica"),
    seguroObligatorio: text("seguro_obligatorio"),

    otrosEquipamientos: text("otros_equipamientos"),

    fotos: text("fotos").array().notNull().default([]),
    videos: text("videos").array().notNull().default([]),
    documentos: text("documentos").array().notNull().default([]),

    observaciones: text("observaciones"),
    conclusiones: text("conclusiones"),

    // Quien hizo la inspección en terreno — puede no ser el mecánico
    // logueado (ej. un tasador externo), por eso es texto libre y no
    // tecnicoId.
    contactoNombre: text("contacto_nombre"),
    contactoDireccion: text("contacto_direccion"),
    fechaInspeccion: timestamp("fecha_inspeccion"),

    fecha: timestamp("fecha").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("inspeccion_taller_idx").on(t.tallerId, t.fecha),
    index("inspeccion_cliente_idx").on(t.clienteId),
    index("inspeccion_vehiculo_idx").on(t.vehiculoId),
  ]
);

/**
 * Cada ítem del checklist (Equipamiento/accesorios + Detalle de
 * inspección) — clave-valor en vez de una columna por ítem, para
 * poder agregar o quitar preguntas sin migrar el schema. `clave` es
 * el identificador estable del ítem (ej. "vidrios_electricos"),
 * `seccion` agrupa la UI (ej. "Motor"), `valor` es la respuesta.
 */
export const itemInspeccion = pgTable(
  "item_inspeccion",
  {
    id: text("id").primaryKey(),
    inspeccionId: text("inspeccion_id")
      .notNull()
      .references(() => inspeccion.id, { onDelete: "cascade" }),
    seccion: text("seccion").notNull(),
    clave: text("clave").notNull(),
    // Sí · No · N/A (Equipamiento) — Buena · Regular · Mala · N/A (Detalle)
    valor: text("valor").notNull(),
  },
  (t) => [
    index("item_inspeccion_inspeccion_idx").on(t.inspeccionId),
  ]
);

/**
 * Cita de la Agenda — independiente de Órdenes por ahora: es solo un
 * horario reservado, el mecánico crea la Orden manualmente cuando el
 * cliente llega. cliente/vehículo son opcionales porque a veces se
 * agenda solo con un nombre/teléfono de contacto, antes de tener el
 * cliente cargado en el catálogo.
 */
export const cita = pgTable(
  "cita",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    clienteId: text("cliente_id").references(() => cliente.id, {
      onDelete: "set null",
    }),
    vehiculoId: text("vehiculo_id").references(() => vehiculo.id, {
      onDelete: "set null",
    }),

    // Texto libre de respaldo cuando no hay cliente cargado aún.
    contactoNombre: text("contacto_nombre"),
    contactoTelefono: text("contacto_telefono"),

    // "Motivo" original — se mantiene como notas largas; el título
    // corto (visible en el calendario) es un campo nuevo aparte.
    motivo: text("motivo").notNull(),
    titulo: text("titulo"),

    // Catálogo real (item_servicio, tipo "servicio") cuando existe;
    // texto libre cuando el taller escribe uno que no está cargado.
    servicioId: text("servicio_id").references(() => itemServicio.id, {
      onDelete: "set null",
    }),
    servicioTexto: text("servicio_texto"),

    // Miembro del equipo cuando existe; texto libre si se escribe a
    // mano (ej. un mecánico externo o alguien aún sin cuenta).
    mecanicoId: text("mecanico_id").references(() => user.id, {
      onDelete: "set null",
    }),
    mecanicoTexto: text("mecanico_texto"),

    // en_taller · domicilio · retiro_vehiculo
    modalidad: text("modalidad").notNull().default("en_taller"),

    fecha: timestamp("fecha").notNull(),
    fechaFin: timestamp("fecha_fin"),
    // agendada · confirmada · completada · no_presento · cancelada
    estado: text("estado").notNull().default("agendada"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("cita_taller_idx").on(t.tallerId, t.fecha),
    index("cita_cliente_idx").on(t.clienteId),
    index("cita_vehiculo_idx").on(t.vehiculoId),
  ]
);

export const proveedor = pgTable(
  "proveedor",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    email: text("email"),
    telefono: text("telefono"),
    documento: text("documento"),
    giro: text("giro"),
    direccion: text("direccion"),
    notas: text("notas"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("proveedor_taller_idx").on(t.tallerId)]
);

/**
 * El stock sube al REGISTRAR la compra (línea "Desde inventario" o
 * "Producto nuevo"), no cuando se marca Pagada — Diego confirmó que
 * si ya se está cargando la mercadería es porque ya llegó, el estado
 * de pago es independiente de si el repuesto ya está físicamente en
 * el taller.
 */
export const compra = pgTable(
  "compra",
  {
    id: text("id").primaryKey(),
    tallerId: text("taller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    numero: integer("numero").notNull(),

    proveedorId: text("proveedor_id").references(() => proveedor.id, {
      onDelete: "set null",
    }),
    // Texto libre cuando no se elige un proveedor registrado.
    proveedorNombre: text("proveedor_nombre"),

    fecha: timestamp("fecha").notNull(),
    // pendiente · pagada · anulada
    estado: text("estado").notNull().default("pendiente"),
    folio: text("folio"),
    notas: text("notas"),

    subtotal: integer("subtotal").notNull().default(0),
    impuesto: integer("impuesto").notNull().default(0),
    total: integer("total").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("compra_taller_idx").on(t.tallerId, t.fecha),
    index("compra_proveedor_idx").on(t.proveedorId),
  ]
);

export const itemCompra = pgTable(
  "item_compra",
  {
    id: text("id").primaryKey(),
    compraId: text("compra_id")
      .notNull()
      .references(() => compra.id, { onDelete: "cascade" }),

    // "inventario" (repuesto ya existente, suma a su stock) ·
    // "nuevo" (crea un repuesto/servicio) · "manual" (solo gasto, no
    // toca Inventario).
    origen: text("origen").notNull(),
    parteId: text("parte_id").references(() => parte.id, {
      onDelete: "set null",
    }),
    // Solo cuando origen="nuevo" y el tipo elegido es servicio/mano
    // de obra en vez de repuesto — mismo catálogo que usa Inventario.
    itemServicioId: text("item_servicio_id").references(() => itemServicio.id, {
      onDelete: "set null",
    }),

    descripcion: text("descripcion").notNull(),
    cantidad: integer("cantidad").notNull().default(1),
    costoUnitario: integer("costo_unitario").notNull().default(0),
  },
  (t) => [index("item_compra_compra_idx").on(t.compraId)]
);
