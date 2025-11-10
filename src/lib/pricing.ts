// src/lib/pricing.ts
export function calcTotal(pricePerHour: number, hours: number) {
  // regla simple:
  //  - hasta 3 horas: paga por hora
  //  - si > 3 horas: tarifa plena (flat) = 6 × precio_base
  //    (cap diurno sencillo para prototipo)
  if (hours <= 3) {
    return { total: pricePerHour * hours, plena: false, plenaValue: 0 };
  }
  const plenaValue = pricePerHour * 4;
  return { total: plenaValue, plena: true, plenaValue };
}
