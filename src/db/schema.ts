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
    notas: text("notas"),
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

    notas: text("notas"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("vehiculo_patente_idx").on(t.tallerId, t.patente),
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
    // Lo que efectivamente se hizo; se completa al cerrar la orden
    descripcion: text("descripcion"),
    kilometraje: integer("kilometraje"),

    // ingresado · en_proceso · terminado · entregado
    estado: text("estado").notNull().default("ingresado"),
    fechaEntrega: timestamp("fecha_entrega"),

    // En pesos, sin decimales
    manoObra: integer("mano_obra").notNull().default(0),
    repuestos: integer("repuestos").notNull().default(0),
    total: integer("total").notNull().default(0),

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
    cantidad: integer("cantidad").notNull().default(1),
    precioUnitario: integer("precio_unitario").notNull().default(0),
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
