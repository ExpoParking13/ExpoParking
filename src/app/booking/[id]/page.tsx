// src/app/booking/[id]/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getParkingById, type Parking } from "@/lib/parkings";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { getUsed } from "@/lib/aforo";
import { calcTotal } from "@/lib/pricing";

// configuración de horario
const startHour = 6;  // 06:00
const endHour = 20;   // 20:00
const hoursRange = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

const days7 = (base = new Date()) =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });

function fmtHour(h: number) {
  const pm = h >= 12;
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:00 ${pm ? "pm" : "am"}`;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" });
}
function toISO(d: Date, h: number) {
  const x = new Date(d);
  x.setHours(h, 0, 0, 0);
  return x.toISOString();
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const parking = getParkingById(id);

  return (
    <>
      <SignedIn>
        <TopBar />
        <main className="mx-auto max-w-screen-md px-4 pt-3 min-h-[calc(100dvh-56px)] flex flex-col gap-3 pb-[calc(72px+env(safe-area-inset-bottom))]">
          {!parking ? (
            <p className="text-red-600">Parqueadero no encontrado.</p>
          ) : (
            <BookingContent parking={parking} />
          )}
        </main>
        <MobileNav />
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn redirectUrl={`/booking/${id}`} />
      </SignedOut>
    </>
  );
}

function BookingContent({ parking }: { parking: Parking }) {
  const router = useRouter();
  const days = useMemo(() => days7(new Date()), []);
  const [selDayIdx, setSelDayIdx] = useState(0);
  const [startH, setStartH] = useState<number | null>(null);
  const [endH, setEndH] = useState<number | null>(null);

  const clickSlot = (h: number) => {
    const aforo = getUsed(parking, days[selDayIdx], h);
    if (aforo.used >= aforo.capacity) return; // lleno
    if (startH == null) {
      setStartH(h);
      setEndH(null);
      return;
    }
    if (endH == null && h >= startH) {
      setEndH(h);
      return;
    }
    // reiniciar selección
    setStartH(h);
    setEndH(null);
  };

  const valid = startH != null && endH != null && endH >= startH;
  const hours = valid ? endH! - startH! + 1 : 0; // slots horarios
  const price = parking.pricePerHour;
  const { total, plena } = calcTotal(price, hours);

  const startISO = valid ? toISO(days[selDayIdx], startH!) : "";
  const endISO = valid ? toISO(days[selDayIdx], endH! + 1) : ""; // fin exclusivo

  return (
    <>
      <h2 className="text-xl font-semibold">Reservar: {parking.name}</h2>
      <p className="text-gray-700 -mt-1">Tarifa base: ${price}/h • {parking.address}</p>

      {/* selector de día */}
      <div className="flex gap-2 overflow-x-auto py-1">
        {days.map((d, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelDayIdx(idx);
              setStartH(null);
              setEndH(null);
            }}
            className={`px-3 py-1 rounded-full text-sm border ${
              selDayIdx === idx
                ? "bg-blue-900 text-white border-blue-900"
                : "bg-white text-gray-800 hover:bg-blue-50"
            }`}
          >
            {fmtDate(d)}
          </button>
        ))}
      </div>

      {/* grilla de horas con aforo */}
      <div className="rounded-xl border border-blue-100 bg-white overflow-hidden">
        <div className="max-h-[50vh] overflow-auto">
          <table className="w-full text-sm">
            <tbody>
              {hoursRange.map((h) => {
                const { used, capacity } = getUsed(parking, days[selDayIdx], h);
                const full = used >= capacity;
                const selected =
                  startH != null &&
                  ((endH == null && h === startH) || (endH != null && h >= startH && h <= endH));

                const ratio = used / capacity;
                const tone = full
                  ? "bg-slate-100 text-slate-500"
                  : selected
                  ? "bg-amber-200 border-amber-300"
                  : ratio > 0.85
                  ? "bg-rose-100 border-rose-200 text-rose-900"
                  : ratio > 0.6
                  ? "bg-amber-100 border-amber-200 text-amber-900"
                  : "bg-blue-600 text-white hover:bg-blue-700 border-blue-700";

                return (
                  <tr key={h}>
                    <td className="w-24 px-3 py-3 text-right text-gray-500 align-middle">
                      {fmtHour(h)}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => clickSlot(h)}
                        disabled={full}
                        className={`w-full rounded-md px-3 py-3 text-left border ${tone}`}
                        title={`Aforo ${used}/${capacity}`}
                      >
                        {full ? "Cupos llenos" : `Aforo ${used}/${capacity}`}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-sm text-gray-800">
          {valid ? (
            <>
              <div>
                <span className="font-medium">Fecha:</span> {fmtDate(days[selDayIdx])}
              </div>
              <div>
                <span className="font-medium">Horario:</span> {fmtHour(startH!)} – {fmtHour(endH! + 1)}
              </div>
              <div>
                <span className="font-medium">Horas:</span> {hours} •{" "}
                <span className="font-medium">Total:</span> ${total}
                {plena && <span className="ml-2 text-blue-700">(tarifa plena aplicada)</span>}
              </div>
            </>
          ) : (
            <span>Selecciona un rango de horas del mismo día.</span>
          )}
        </div>

        <button
          disabled={!valid}
          onClick={() =>
            router.push(
              `/checkout?pid=${parking.id}&start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(
                endISO
              )}`
            )
          }
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            valid
              ? "bg-blue-900 text-white hover:bg-blue-800"
              : "bg-slate-300 text-slate-600 cursor-not-allowed"
          }`}
        >
          Continuar al cobro
        </button>
      </div>
    </>
  );
}
