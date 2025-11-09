// src/app/pago/epayco/respuesta/page.tsx
"use client";

import { Suspense } from "react";
export const dynamic = "force-dynamic";

import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";

function Fallback() {
  return <div className="rounded-2xl bg-white border p-4">Procesando…</div>;
}

export default function EpaycoRespuestaPage() {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-screen-md px-4 pt-3 min-h-[calc(100dvh-56px)] flex flex-col gap-3 pb-[calc(72px+env(safe-area-inset-bottom))]">
        <h2 className="text-xl font-semibold">Resultado del pago (ePayco)</h2>
        <Suspense fallback={<Fallback />}>
          <RespuestaContent />
        </Suspense>
      </main>
      <MobileNav />
    </>
  );
}

// -------- contenido (actualiza/crea la reserva y redirige) --------
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getParkingById } from "@/lib/parkings";
import { type Booking } from "@/lib/bookings";

async function fetchTxStatus(ref: string) {
  try {
    const r = await fetch(`https://secure.epayco.co/validation/v1/reference/${ref}`);
    const j = await r.json();
    const ep = j?.data?.estado || j?.data?.status || "Pendiente";
    return String(ep);
  } catch {
    return "Pendiente";
  }
}

function RespuestaContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const { user } = useUser();

  // Stash de checkout, por si faltan params
  const stash = (() => {
    try { return JSON.parse(sessionStorage.getItem("parkinglite:lastBooking") || "null"); }
    catch { return null; }
  })();

  const pid = sp.get("pid") || stash?.parkingId || "";
  const startISO = sp.get("start") || stash?.startISO || "";
  const endISO = sp.get("end") || stash?.endISO || "";
  const total = Number(sp.get("total") || stash?.total || 0);
  const localRef = sp.get("ref") || "";
  const refPayco = sp.get("ref_payco") || sp.get("x_ref_payco") || "";
  const bookingId = sp.get("bid") || stash?.id || `b${Date.now()}`;

  const [status, setStatus] = useState<string>("Verificando…");

  useEffect(() => {
    (async () => {
      if (!user) { setStatus("Sin usuario"); return; }
      const parking = getParkingById(pid); // opcional, solo para consistencia

      const refToCheck = refPayco || localRef;
      let epStatus = "Pendiente";
      if (refToCheck) epStatus = await fetchTxStatus(refToCheck);
      setStatus(epStatus);

      const normalized =
        epStatus.toLowerCase().includes("acept") ? "paid"
        : epStatus.toLowerCase().includes("rechaz") ? "failed"
        : "pending";

      const { updateBookingStatus, upsertBooking } = await import("@/lib/bookings");
      const updated = updateBookingStatus(user.id, bookingId, normalized, refToCheck || undefined);

      // si por alguna razón no existía la reserva pending, créala ahora
      if (!updated) {
        const booking: Booking = {
          id: bookingId,
          parkingId: pid || parking?.id || "unknown",
          userId: user.id,
          startISO: startISO || new Date().toISOString(),
          endISO: endISO || startISO || new Date().toISOString(),
          total: total || 0,
          createdAtISO: new Date().toISOString(),
          status: normalized,
          paymentRef: refToCheck || undefined,
        };
        upsertBooking(user.id, booking);
      }

      try { sessionStorage.removeItem("parkinglite:lastBooking"); } catch {}
      setTimeout(() => router.replace("/agendas"), 600);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl bg-white border p-4">
      <p><span className="font-medium">Referencia:</span> {refPayco || localRef || "(sin ref)"}</p>
      <p><span className="font-medium">Estado:</span> {status}</p>
      <p className="text-sm text-gray-600 mt-2">Guardando y redirigiendo a tus agendas…</p>
    </div>
  );
}
