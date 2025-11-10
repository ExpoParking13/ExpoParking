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

import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { type Booking } from "@/lib/bookings";
// import { decRange } from "@/lib/aforo"; // no liberamos aforo en test

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

  const TEST_MODE = (process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE || "true") === "true";

  // Tomamos TODO del stash que dejamos en checkout
  const stash = (() => {
    try { return JSON.parse(sessionStorage.getItem("parkinglite:lastBooking") || "null"); }
    catch { return null; }
  })();

  const refPayco = sp.get("ref_payco") || sp.get("x_ref_payco") || ""; // ePayco agrega esto
  const [statusText, setStatusText] = useState("Verificando…");

  useEffect(() => {
    (async () => {
      if (!user || !stash) {
        setStatusText("Datos incompletos");
        setTimeout(() => router.replace("/agendas"), 2000);
        return;
      }

      // Estado real (opcional, solo para mostrar)
      let epStatus = "Pendiente";
      if (refPayco) epStatus = await fetchTxStatus(refPayco);

      // Modo test: siempre marcamos paid
      const normalized: "paid" | "failed" | "pending" = TEST_MODE
        ? "paid"
        : epStatus.toLowerCase().includes("acept")
          ? "paid"
          : epStatus.toLowerCase().includes("rechaz")
            ? "failed"
            : "pending";

      setStatusText(TEST_MODE ? "Aprobada (modo test)" : epStatus);

      const { updateBookingStatus, upsertBooking } = await import("@/lib/bookings");
      const ok = updateBookingStatus(user.id, stash.id, normalized, refPayco || (TEST_MODE ? "test-forced" : undefined));

      if (!ok) {
        const booking: Booking = {
          ...stash,
          status: normalized,
          paymentRef: refPayco || (TEST_MODE ? "test-forced" : undefined),
        };
        upsertBooking(user.id, booking);
      }

      try { sessionStorage.removeItem("parkinglite:lastBooking"); } catch {}

      // Redirigimos SIEMPRE a los 2 s
      setTimeout(() => router.replace("/agendas"), 2000);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl bg-white border p-4">
      <p><span className="font-medium">Referencia:</span> {refPayco || "(sin ref)"}</p>
      <p><span className="font-medium">Estado:</span> {statusText}</p>
      <p className="text-sm text-gray-600 mt-2">Guardando y redirigiendo a tus agendas…</p>
    </div>
  );
}
