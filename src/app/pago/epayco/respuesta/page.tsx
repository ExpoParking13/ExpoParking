// src/app/pago/epayco/respuesta/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
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

// ---------- contenido ----------
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getParkingById } from "@/lib/parkings";
import { type Booking } from "@/lib/bookings";
// import { decRange } from "@/lib/aforo"; // ya NO se usa en modo test

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

  const TEST_MODE = (process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE || "false") === "true";

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

  const [statusText, setStatusText] = useState<string>("Verificando…");

  useEffect(() => {
    (async () => {
      if (!user) { setStatusText("Sin usuario"); return; }
      getParkingById(pid); // opcional, fuerza consistencia

      const refToCheck = refPayco || localRef;

      // 1) obtener estado real (por si quieres verlo en pantalla)
      let epStatus = "Pendiente";
      if (refToCheck) epStatus = await fetchTxStatus(refToCheck);

      // 2) forzar pago exitoso en MODO TEST
      let normalized: "paid" | "failed" | "pending";
      if (TEST_MODE) {
        normalized = "paid";
        setStatusText("Aprobada (modo test)");
      } else {
        normalized = epStatus.toLowerCase().includes("acept")
          ? "paid"
          : epStatus.toLowerCase().includes("rechaz")
          ? "failed"
          : "pending";
        setStatusText(epStatus);
      }

      // 3) actualizar / crear reserva como pagada (o según estado si no estás en test)
      const { updateBookingStatus, upsertBooking } = await import("@/lib/bookings");
      const updated = updateBookingStatus(user.id, bookingId, normalized, refToCheck || (TEST_MODE ? "test-forced" : undefined));

      if (!updated) {
        const booking: Booking = {
          id: bookingId,
          parkingId: pid || "unknown",
          userId: user.id,
          startISO: startISO || new Date().toISOString(),
          endISO: endISO || startISO || new Date().toISOString(),
          total: total || 0,
          createdAtISO: new Date().toISOString(),
          status: normalized,
          paymentRef: refToCheck || (TEST_MODE ? "test-forced" : undefined),
        };
        upsertBooking(user.id, booking);
      }

      // 4) en modo test NO liberamos aforo aunque “falle” (simulación éxito)
      // if (!TEST_MODE && normalized === "failed" && pid && startISO && endISO) decRange(pid, startISO, endISO);

      try { sessionStorage.removeItem("parkinglite:lastBooking"); } catch {}

      // 5) esperar 2s y redirigir a agendas
      setTimeout(() => router.replace("/bookings"), 2000);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl bg-white border p-4">
      <p><span className="font-medium">Referencia:</span> {refPayco || localRef || "(sin ref)"}</p>
      <p><span className="font-medium">Estado:</span> {statusText}</p>
      <p className="text-sm text-gray-600 mt-2">Guardando y redirigiendo a tus agendas…</p>
    </div>
  );
}
