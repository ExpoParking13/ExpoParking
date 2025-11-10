// src/app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css"; // CSS de Leaflet (necesario para que los tiles no se vean raros)

import "./globals.css";

export const metadata: Metadata = { title: "Parking Lite", description: "Prototype" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0ea5e9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (!publishableKey) {
    console.warn("Falta NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY en .env.local");
  }
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/login"
      signUpUrl="/register"
      afterSignInUrl="/home"
      afterSignUpUrl="/home"
      afterSignOutUrl="/"
    >
    <body className="min-h-dvh bg-blue-50 text-slate-900 antialiased">
      {children}
    </body>
    </ClerkProvider>
  );
}
