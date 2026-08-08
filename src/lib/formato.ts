const PESOS = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function pesos(monto: number) {
  return PESOS.format(monto);
}

const MILES = new Intl.NumberFormat("es-CL");

/**
 * Lo que se muestra mientras se escribe un número: 3020220 → 3.020.220.
 * Devuelve "" si no quedó ningún dígito, para no forzar un 0 en un campo
 * que el usuario está vaciando.
 */
export function miles(valor: string | number) {
  const digitos = String(valor).replace(/\D/g, "");
  return digitos ? MILES.format(Number(digitos)) : "";
}

/** Quita los puntos para guardar: "3.020.220" → "3020220". */
export function soloDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

const FECHA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function fecha(valor: Date | string) {
  return FECHA.format(new Date(valor));
}
