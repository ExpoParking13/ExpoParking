"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { useUser } from "@clerk/nextjs";
import { getParkingById } from "@/lib/parkings";
import { saveBooking, type Booking } from "@/lib/bookings";

// ePayco devuelve ref_payco o x_ref_payco (depende del flujo)
async function fetchTxStatus(ref: string) {
  try {
    const r = await fetch(`https://secure.epayco.co/validation/v1/reference/${ref}`);
    const j = await r.json();
    // estados comunes: "Aceptada", "Rechazada", "Pendiente"
    const ep = j?.data?.estado || j?.data?.status || "Pendiente";
    return String(ep);
  } catch {
    return "Pendiente";
  }
}

export default function EpaycoRespuesta() {
  const sp = useSearchParams();
  const router = useRouter();
  const { user } = useUser();

  const pid = sp.get("pid") || "";
  const startISO = sp.get("start") || "";
  const endISO = sp.get("end") || "";
  const total = Number(sp.get("total") || 0);
  const localRef = sp.get("ref") || "";
  // ePayco referencia de transacción
  const refPayco = sp.get("ref_payco") || sp.get("x_ref_payco") || "";

  const [status, setStatus] = useState<string>("Verificando…");

  useEffect(() => {
    (async () => {
      const parking = getParkingById(pid);
      if (!user || !parking) {
        setStatus("Datos incompletos");
        return;
      }

      const refToCheck = refPayco || localRef; // preferimos ref_payco si viene
      const epStatus = refToCheck ? await fetchTxStatus(refToCheck) : "Pendiente";

      const normalized =
        epStatus.toLowerCase().includes("acept")
          ? "paid"
          : epStatus.toLowerCase().includes("rechaz")
          ? "failed"
          : "pending";

      const booking: Booking = {
        id: `b${Date.now()}`,
        parkingId: parking.id,
        userId: user.id,
        startISO,
        endISO,
        total,
        createdAtISO: new Date().toISOString(),
        status: normalized,
        paymentRef: refToCheck || undefined,
      };

      saveBooking(user.id, booking);
      setStatus(epStatus);

      // lleva a agendas después de un segundo
      setTimeout(() => router.replace("/agendas"), 1200);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-screen-md px-4 pt-3 min-h-[calc(100dvh-56px)] flex flex-col gap-3 pb-[calc(72px+env(safe-area-inset-bottom))]">
        <h2 className="text-xl font-semibold">Resultado del pago (ePayco)</h2>
        <div className="rounded-2xl bg-white border p-4">
          <p><span className="font-medium">Referencia:</span> {refPayco || localRef || "(sin ref)"}</p>
          <p><span className="font-medium">Estado:</span> {status}</p>
          <p className="text-sm text-gray-600 mt-2">Guardando y redirigiendo a tus agendas…</p>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
