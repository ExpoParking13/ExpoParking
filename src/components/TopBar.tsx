"use client";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/90 border-b">
      <div className="mx-auto max-w-screen-md px-4 h-14 flex items-center justify-between">
        <span className="font-semibold">Parking Lite</span>

        <nav className="hidden sm:flex gap-4 text-sm items-center">
          <Link href="/home" className="hover:underline">Home</Link>
          <SignedOut>
            <Link href="/login" className="hover:underline">Login</Link>
            <Link href="/register" className="hover:underline">Registro</Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
