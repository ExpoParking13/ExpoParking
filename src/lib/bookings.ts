// src/lib/bookings.ts
export type BookingStatus = "paid" | "failed" | "pending";

export type Booking = {
  id: string;
  parkingId: string;
  userId: string;
  startISO: string;
  endISO: string;
  total: number;
  createdAtISO: string;
  status: BookingStatus;
  paymentRef?: string;
};

const key = (userId: string) => `parkinglite:bookings:v1:${userId}`;

export function loadBookings(userId: string): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(userId));
    const list = raw ? (JSON.parse(raw) as any[]) : [];
    // fallback de status por si hay reservas viejas sin campo
    return list.map((b) => ({ status: "paid", ...b })) as Booking[];
  } catch {
    return [];
  }
}

export function saveBooking(userId: string, booking: Booking) {
  if (typeof window === "undefined") return;
  const all = loadBookings(userId);
  all.push(booking);
  localStorage.setItem(key(userId), JSON.stringify(all));
}

export function upsertBooking(userId: string, booking: Booking) {
  if (typeof window === "undefined") return;
  const all = loadBookings(userId);
  const i = all.findIndex((b) => b.id === booking.id);
  if (i >= 0) all[i] = booking; else all.push(booking);
  localStorage.setItem(key(userId), JSON.stringify(all));
}

export function updateBookingStatus(
  userId: string,
  bookingId: string,
  status: BookingStatus,
  paymentRef?: string
) {
  if (typeof window === "undefined") return false;
  const all = loadBookings(userId);
  const i = all.findIndex((b) => b.id === bookingId);
  if (i < 0) return false;
  all[i] = { ...all[i], status, paymentRef };
  localStorage.setItem(key(userId), JSON.stringify(all));
  return true;
}

export function getBookingById(userId: string, bookingId: string): Booking | undefined {
  return loadBookings(userId).find((b) => b.id === bookingId);
}

/* 🔧 nueva: elimina una reserva por id */
export function removeBooking(userId: string, bookingId: string): boolean {
  if (typeof window === "undefined") return false;
  const all = loadBookings(userId);
  const i = all.findIndex((b) => b.id === bookingId);
  if (i < 0) return false;
  all.splice(i, 1);
  localStorage.setItem(key(userId), JSON.stringify(all));
  return true;
}

/* opcional: borra todas las reservas del usuario */
export function clearBookings(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(userId));
}
