"use client";

import { useEffect, useState } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { loadBookings, removeBooking, type Booking } from "@/lib/bookings";
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
    if (user) setItems(loadBookings(user.id));
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
        <main className="mx-auto max-w-screen-md px-4 pt-3
                         min-h-[calc(100dvh-56px)] flex flex-col gap-3
                         pb-[calc(72px+env(safe-area-inset-bottom))]">
          <h2 className="text-xl font-semibold">Mis agendas</h2>

          {items.length === 0 ? (
            <p className="text-gray-600">No tienes reservas guardadas.</p>
          ) : (
            <ul className="space-y-3">
              {items.map(b => {
                const p = getParkingById(b.parkingId);
                return (
                  <li key={b.id} className="rounded-2xl bg-white border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">{p?.name || b.parkingId}</div>
                      <div className="text-sm text-gray-700">{p?.address}</div>
                      <div className="text-sm text-gray-800 mt-1">
                        {fmt(b.startISO)} — {fmt(b.endISO)}
                      </div>
                      <div className="text-sm text-gray-800"><span className="font-medium">Total:</span> ${b.total}</div>
                    </div>
                    <div className="shrink-0 flex gap-2">
                                            <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                          ${b.status === "paid" ? "bg-emerald-100 text-emerald-700"
                          : b.status === "failed" ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"}`}
                      >
                        {b.status === "paid" ? "Pagada" : b.status === "failed" ? "Rechazada" : "Pendiente"}
                      </span>

                      <button onClick={() => cancel(b.id)} className="rounded-full px-4 py-2 text-sm font-medium border">
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
