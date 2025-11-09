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
    // compat: si no tienen status, márcalas como "paid"
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

export function removeBooking(userId: string, bookingId: string) {
  if (typeof window === "undefined") return;
  const all = loadBookings(userId).filter((b) => b.id !== bookingId);
  localStorage.setItem(key(userId), JSON.stringify(all));
}
