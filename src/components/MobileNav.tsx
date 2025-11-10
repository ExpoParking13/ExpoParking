"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/home", label: "Parqueaderos" },
  { href: "/bookings", label: "Agendas" }, // placeholder
  { href: "/profile", label: "Perfil" },   // placeholder
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-blue-700 bg-blue-600/90 backdrop-blur supports-[backdrop-filter]:bg-blue-600/60 text-white">
      <ul className="mx-auto max-w-screen-md px-2 py-2 grid grid-cols-3 gap-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "block text-center rounded-xl px-3 py-2 text-xs transition-colors",
                  active
                    ? "bg-white/20 text-white shadow-inner"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                ].join(" ")}
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
