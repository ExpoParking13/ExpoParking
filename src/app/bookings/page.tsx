// src/app/agendas/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { loadBookings, removeBooking, forceAllPaid, type Booking } from "@/lib/bookings";
import { getParkingById } from "@/lib/parkings";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";

function fmt(dt: string) {
  return new Date(dt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

export default function AgendasPage() {
  const { user } = useUser();
  const [items, setItems] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;
    // 🔒 TEST TOTAL: todo a 'paid' al entrar
    forceAllPaid(user.id);
    setItems(loadBookings(user.id));
  }, [user]);

  const cancel = (id: string) => {
    if (!user) return;
    removeBooking(user.id, id);
    setItems(loadBookings(user.id));
  };

  return (
    <>
      <SignedIn>
        <TopBar />
        <main
          className="mx-auto max-w-screen-md px-4 pt-3
                     min-h-[calc(100dvh-56px)] flex flex-col gap-3
                     pb-[calc(72px+env(safe-area-inset-bottom))]"
        >
          <h2 className="text-xl font-semibold">Mis agendas</h2>

          {items.length === 0 ? (
            <p className="text-gray-600">No tienes reservas guardadas.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((b) => {
                const p = getParkingById(b.parkingId);
                return (
                  <li
                    key={b.id}
                    className="rounded-2xl bg-white border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">{p?.name || b.parkingId}</div>
                      <div className="text-sm text-gray-700">{p?.address}</div>
                      <div className="text-sm text-gray-800 mt-1">
                        {fmt(b.startISO)} — {fmt(b.endISO)}
                      </div>
                      <div className="text-sm text-gray-800">
                        <span className="font-medium">Total:</span> ${b.total}
                      </div>
                    </div>

                    <div className="shrink-0 flex gap-2">
                      {/* Pill con alto contraste: siempre Pagada en test */}
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white shadow-sm">
                        Pagada
                      </span>

                      <button
                        onClick={() => cancel(b.id)}
                        className="rounded-full px-4 py-2 text-sm font-medium border border-rose-600 text-rose-700 hover:bg-rose-50"
                        title="Eliminar esta reserva"
                      >
                        Cancelar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
        <MobileNav />
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn redirectUrl="/agendas" />
      </SignedOut>
    </>
  );
}
