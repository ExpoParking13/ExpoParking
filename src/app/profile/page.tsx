"use client";

import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { SignedIn, SignedOut, RedirectToSignIn, useUser, SignOutButton, UserButton } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <>
      <SignedIn>
        <TopBar />
        {/* altura = pantalla - header, con padding para no tapar la nav inferior */}
        <main
          className="mx-auto max-w-screen-md px-4 pt-3
                     min-h-[calc(100dvh-56px)] flex flex-col gap-3
                     pb-[calc(72px+env(safe-area-inset-bottom))]"
        >
          <h2 className="text-xl font-semibold">Mi perfil</h2>

          <ProfileCard />
        </main>
        <MobileNav />
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn redirectUrl="/profile" />
      </SignedOut>
    </>
  );
}

function ProfileCard() {
  const { user } = useUser();

  const fullName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Usuario";
  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "";
  const createdAt = user?.createdAt ? new Date(user.createdAt).toLocaleString("es-CO") : "";

  return (
    <section className="rounded-2xl bg-white border shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-4">
        {/* avatar Clerk */}
        <div className="shrink-0">
          <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonPopoverCard: "text-gray-900" } }} />
        </div>

        <div className="min-w-0">
          <p className="text-lg font-semibold text-gray-900 truncate">{fullName}</p>
          {email && <p className="text-sm text-gray-700 truncate">{email}</p>}
        </div>
      </div>

      {/* metadatos (sin userId) */}
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-gray-500">Cuenta creada</dt>
          <dd className="text-gray-800">{createdAt}</dd>
        </div>
        {/* agrega aquí otros datos no sensibles si quieres */}
      </dl>

      <div className="mt-6">
        <SignOutButton signOutOptions={{ sessionId: user?.id ? undefined : undefined }} redirectUrl="/">
          <button
            type="button"
            className="w-full sm:w-auto rounded-full px-4 py-2 text-sm font-medium
                       bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>
    </section>
  );
}
