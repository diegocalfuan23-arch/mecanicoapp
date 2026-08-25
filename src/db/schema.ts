import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
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
    // ayudante — único rol por ahora, sin permisos diferenciados.
    rol: text("rol").notNull().default("ayudante"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("miembro_taller_taller_idx").on(t.tallerId)]
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
    nombre: text("nombre").notNull(),
    telefono: text("telefono"),
    email: text("email"),
    // Cuando el auto es de una empresa, no de una persona natural —
    // Plan Serviteca en adelante (cotización a nombre de la empresa).
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
    // vacio · 1/4 · 1/2 · 3/4 · lleno — Plan Serviteca.
    combustible: text("combustible"),
    // Qué accesorios trae el auto al recibirlo, para respaldo ante un
    // reclamo al retirarlo ("no traía la rueda de repuesto"). Cada
    // elemento es el id del accesorio que SÍ trae — ausencia = no trae.
    accesorios: text("accesorios").array().notNull().default([]),
    // Nota libre de la orden, aparte de síntoma/diagnóstico/descripción
    // — Plan Serviteca en adelante.
    observaciones: text("observaciones"),

    // ingresado · en_proceso · esperando_repuesto · terminado · entregado
    estado: text("estado").notNull().default("ingresado"),
    fechaEntrega: timestamp("fecha_entrega"),
    // Qué se está esperando y por qué el auto no está en el taller
    // (ej: "amortiguadores, pieza importada, llega en 10 días").
    esperaDetalle: text("espera_detalle"),

    // En pesos, sin decimales
    manoObra: integer("mano_obra").notNull().default(0),
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
    stock: integer("stock").notNull().default(0),
    stockMinimo: integer("stock_minimo").notNull().default(0),
    costo: integer("costo").notNull().default(0),
    precio: integer("precio").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("parte_taller_idx").on(t.tallerId)]
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
