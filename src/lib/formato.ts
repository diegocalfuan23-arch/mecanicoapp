const PESOS = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function pesos(monto: number) {
  return PESOS.format(monto);
}

const FECHA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function fecha(valor: Date | string) {
  return FECHA.format(new Date(valor));
}
