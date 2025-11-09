// (opcional) src/app/agendas/page.tsx
"use client";

import { useEffect, useState } from "react";
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { loadBookings, type Booking } from "@/lib/bookings";
import { getParkingById } from "@/lib/parkings";

export default function AgendasPage() {
  return (
    <>
      <SignedIn>
        <AgendasContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/agendas" />
      </SignedOut>
    </>
  );
}

function badge(status: Booking["status"]) {
  const base = "px-2 py-0.5 rounded-full text-xs font-medium";
  if (status === "paid") return <span className={`${base} bg-emerald-100 text-emerald-700`}>Pagada</span>;
  if (status === "failed") return <span className={`${base} bg-rose-100 text-rose-700`}>Rechazada</span>;
  return <span className={`${base} bg-amber-100 text-amber-700`}>Pendiente</span>;
}

function AgendasContent() {
  const { user } = useUser();
  const [rows, setRows] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;
    setRows(loadBookings(user.id).sort((a, b) => (a.startISO > b.startISO ? -1 : 1)));
  }, [user]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-screen-md px-4 pt-3 pb-[calc(72px+env(safe-area-inset-bottom))] min-h-[calc(100dvh-56px)]">
        <h2 className="text-xl font-semibold mb-3">Mis agendas</h2>

        <div className="space-y-3">
          {rows.length === 0 && (
            <div className="rounded-2xl border bg-white p-4">No tienes reservas aún.</div>
          )}

          {rows.map((b) => {
            const p = getParkingById(b.parkingId);
            return (
              <div key={b.id} className="rounded-2xl border bg-white p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{p?.name || "Parqueadero"}</div>
                  {badge(b.status)}
                  <div className="ml-auto text-sm text-gray-500">Ref: {b.paymentRef || "—"}</div>
                </div>
                <div className="text-sm text-gray-600">{p?.address || "—"}</div>
                <div className="text-sm">
                  {fmt(b.startISO)} → {fmt(b.endISO)}
                </div>
                <div className="text-sm font-medium">${b.total}</div>
              </div>
            );
          })}
        </div>
      </main>
      <MobileNav />
    </>
  );
}
