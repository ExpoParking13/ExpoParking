"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/home", label: "Parqueaderos" },
  { href: "/bookings", label: "Agendas" },   // placeholder (aún no existe la ruta)
  { href: "/profile", label: "Perfil" },     // placeholder (aún no existe la ruta)
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <ul className="mx-auto max-w-screen-md px-2 py-2 grid grid-cols-3 gap-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`block text-center rounded-xl px-3 py-2 text-xs
                  ${active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* espacio para el safe area en iOS */}
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
