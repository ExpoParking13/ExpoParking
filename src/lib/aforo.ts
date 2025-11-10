// src/lib/aforo.ts
import type { Parking } from "@/lib/parkings";

const K = (parkingId: string, ymd: string) => `parkinglite:aforo:v1:${parkingId}:${ymd}`;

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function loadMap(parkingId: string, dayKey: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(K(parkingId, dayKey)) || "{}");
  } catch {
    return {};
  }
}

function saveMap(parkingId: string, dayKey: string, map: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(K(parkingId, dayKey), JSON.stringify(map));
}

// ruido base determinístico (simula otros usuarios)
function seededOcc(parkingId: string, dayKey: string, hour: number, spots: number) {
  const seed = `${parkingId}:${dayKey}:${hour}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const r = Math.abs(h % 100) / 100; // 0..1
  const maxSeed = Math.floor(spots * 0.35); // hasta 35% ocupado por “otros”
  return Math.floor(r * (maxSeed + 1));
}

// ocupación registrada por nuestras reservas (pending/paid)
export function getUsed(parking: Parking, day: Date, hour: number) {
  const dayKey = ymd(day);
  const map = loadMap(parking.id, dayKey);
  const booked = Number(map[String(hour)] || 0);
  const base = seededOcc(parking.id, dayKey, hour, parking.spots);
  const used = Math.min(parking.spots, base + booked);
  return { used, capacity: parking.spots };
}

// incrementa ocupación para un rango [startISO, endISO)
export function incRange(parkingId: string, startISO: string, endISO: string) {
  if (typeof window === "undefined") return;
  const s = new Date(startISO);
  const e = new Date(endISO);
  const dk = ymd(s);
  const map = loadMap(parkingId, dk);
  // asumimos misma fecha (la UI sólo permite un día)
  for (let h = s.getHours(); h < e.getHours(); h++) {
    const k = String(h);
    map[k] = (map[k] || 0) + 1;
  }
  saveMap(parkingId, dk, map);
}

// decrementa ocupación (si falló el pago)
export function decRange(parkingId: string, startISO: string, endISO: string) {
  if (typeof window === "undefined") return;
  const s = new Date(startISO);
  const e = new Date(endISO);
  const dk = ymd(s);
  const map = loadMap(parkingId, dk);
  for (let h = s.getHours(); h < e.getHours(); h++) {
    const k = String(h);
    map[k] = Math.max(0, (map[k] || 0) - 1);
  }
  saveMap(parkingId, dk, map);
}

// lista de aforo por hora (para mostrar en agenda)
export function getAforoList(parking: Parking, day: Date, fromH: number, toHExclusive: number) {
  const rows: Array<{ hour: number; used: number; capacity: number }> = [];
  for (let h = fromH; h < toHExclusive; h++) {
    const { used, capacity } = getUsed(parking, day, h);
    rows.push({ hour: h, used, capacity });
  }
  return rows;
}
