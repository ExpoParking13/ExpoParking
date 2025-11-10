"use client";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-blue-600/60 bg-blue-600/90 text-white border-b border-blue-700 shadow-sm">
      <div className="mx-auto max-w-screen-md px-4 h-14 flex items-center justify-between">
        <span className="font-semibold tracking-tight">Parking Lite</span>

        <nav className="hidden sm:flex gap-4 text-sm items-center">
          <Link href="/home" className="text-white/90 hover:text-white hover:underline">
            Home
          </Link>

          <SignedOut>
            <Link href="/login" className="text-white/90 hover:text-white hover:underline">
              Login
            </Link>
            <Link href="/register" className="text-white/90 hover:text-white hover:underline">
              Registro
            </Link>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
