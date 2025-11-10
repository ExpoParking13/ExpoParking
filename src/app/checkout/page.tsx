// src/app/checkout/page.tsx
"use client";

import { Suspense, useRef } from "react";
export const dynamic = "force-dynamic";

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-screen-md px-4 pt-3 min-h-[calc(100dvh-56px)] flex flex-col gap-3 pb-[calc(72px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <MobileNav />
    </>
  );
}

function Fallback() {
  return <section className="rounded-2xl bg-white border shadow-sm p-4">Cargando…</section>;
}

export default function CheckoutPage() {
  return (
    <>
      <SignedIn>
        <Shell>
          <Suspense fallback={<Fallback />}>
            <CheckoutContent />
          </Suspense>
        </Shell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/checkout" />
      </SignedOut>
    </>
  );
}

// -------- contenido --------
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getParkingById } from "@/lib/parkings";
import { calcTotal } from "@/lib/pricing";
import { incRange } from "@/lib/aforo";

function fmt(d: Date) {
  return d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

function CheckoutContent() {
  const sp = useSearchParams();
  const { user } = useUser();

  const pid = sp.get("pid") || "";
  const startISO = sp.get("start") || "";
  const endISO = sp.get("end") || "";

  const parking = getParkingById(pid);
  const start = startISO ? new Date(startISO) : null;
  const end = endISO ? new Date(endISO) : null;

  const hours = start && end ? Math.max(1, Math.round((+end - +start) / 36e5)) : 0;
  const price = parking?.pricePerHour || 0;
  const { total, plena } = calcTotal(price, hours);

  // id estable mientras se muestra la página
  const bookingIdRef = useRef<string>(pid);
  if (!bookingIdRef.current) bookingIdRef.current = `b${Date.now()}`;
  const bookingId = bookingIdRef.current;

  const EP_PUBLIC = process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY || "";
  const EP_TEST = (process.env.NEXT_PUBLIC_EPAYCO_TEST || "true") === "true";

  const loadEpayco = async () => {
    if (typeof window === "undefined") return false;
    if ((window as any).ePayco) return true;

    // si ya existe la etiqueta, esperamos a que cargue
    if (document.getElementById("epayco-checkout")) {
      return new Promise<boolean>((resolve) => {
        const t = setInterval(() => {
          if ((window as any).ePayco) {
            clearInterval(t);
            resolve(true);
          }
        }, 50);
        // timeout de seguridad
        setTimeout(() => {
          clearInterval(t);
          resolve(!!(window as any).ePayco);
        }, 4000);
      });
    }

    // insertar script
    try {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.id = "epayco-checkout";
        s.src = "https://checkout.epayco.co/checkout.js";
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject();
        document.body.appendChild(s);
      });
      return !!(window as any).ePayco;
    } catch {
      return false;
    }
  };

  const payWithEpayco = async () => {
    if (!parking || !start || !end || !user) return;

    if (!EP_PUBLIC) {
      alert("No está configurada NEXT_PUBLIC_EPAYCO_PUBLIC_KEY.");
      return;
    }

    // 1) cargar ePayco primero
    const ok = await loadEpayco();
    if (!ok || !(window as any).ePayco) {
      alert("No se pudo cargar el checkout de ePayco. Intenta de nuevo.");
      return;
    }

    // 2) guardar pending + stash y aumentar aforo (solo si el script cargó)
    const pending = {
      id: bookingId,
      parkingId: parking.id,
      userId: user.id,
      startISO,
      endISO,
      total,
      createdAtISO: new Date().toISOString(),
      status: "pending" as const,
    };
    const { upsertBooking } = await import("@/lib/bookings");
    upsertBooking(user.id, pending);
    incRange(parking.id, startISO, endISO);
    try {
      sessionStorage.setItem("parkinglite:lastBooking", JSON.stringify(pending));
    } catch {}

    // 3) abrir ePayco
    const reference = `ref_${Date.now()}`;
    const BASE_URL =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    // ✅ sin query params: ePayco añadirá ?ref_payco=...
    const response = `${BASE_URL}/pago/epayco/respuesta`;

    const handler = (window as any).ePayco.checkout.configure({
      key: EP_PUBLIC,
      test: EP_TEST,
    });

    try {
      handler.open({
        name: "Parking Lite",
        description: parking.name + (plena ? " (tarifa plena)" : ""),
        currency: "cop",
        amount: total,
        tax_base: total,
        tax: 0,
        tax_ico: 0,
        country: "co",
        external: "true",
        response,              // 👈 limpio
        invoice: reference,
        extra1: user.id,       // por si luego quieres usarlo
        extra2: bookingId,     // idem
      });
    } catch (e) {
      // si algo falla al abrir, podrías revertir la reserva aquí si quieres
      console.error("Error abriendo ePayco:", e);
      alert("No se pudo abrir el checkout de ePayco.");
    }
  };

  if (!parking || !start || !end) {
    return <p className="text-red-600">Datos incompletos. Vuelve a seleccionar en el mapa.</p>;
  }

  return (
    <section className="rounded-2xl bg-white border border-blue-100 shadow-sm p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900">{parking.name}</h3>
      <p className="text-gray-600">{parking.address}</p>

      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-gray-500">Inicio</dt>
          <dd className="text-gray-800">{fmt(start)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Fin</dt>
          <dd className="text-gray-800">{fmt(end)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Horas</dt>
          <dd className="text-gray-800">{hours}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Total</dt>
          <dd className="text-gray-800">
            ${total} {plena && <span className="text-blue-700">(tarifa plena)</span>}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => history.back()} className="rounded-full px-4 py-2 text-sm font-medium border">
          Volver
        </button>
        <button
          onClick={payWithEpayco}
          className="rounded-full px-4 py-2 text-sm font-medium bg-blue-900 text-white hover:bg-blue-800"
        >
          Pagar con ePayco (Test)
        </button>
      </div>
    </section>
  );
}
