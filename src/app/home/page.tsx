// src/app/home/page.tsx
"use client";

import dynamic from "next/dynamic";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function HomePage() {
  return (
    <>
      <SignedIn>
        <TopBar />
        {/* altura fija = pantalla - alto del TopBar (≈56px). Ajusta 56 si tu TopBar es más alto */}
        <main
          className="mx-auto max-w-screen-md px-4 pt-3
                     h-[calc(100dvh-56px)] flex flex-col gap-2
                     pb-[calc(72px+env(safe-area-inset-bottom))]"
        >
          <h2 className="text-xl font-semibold">Parqueaderos cercanos</h2>

          {/* este wrapper ahora sí recibe altura real */}
          <div className="flex-1 min-h-0">
            <MapView fill />
          </div>
        </main>
        <MobileNav />
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn redirectUrl="/home" />
      </SignedOut>
    </>
  );
}
