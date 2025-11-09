"use client";
import { SignUp } from "@clerk/nextjs";
import TopBar from "@/components/TopBar";

export default function RegisterPage() {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-screen-md px-4 py-8 pb-28 flex justify-center">
        <SignUp routing="hash" signInUrl="/login" afterSignUpUrl="/home" />
      </main>
    </>
  );
}
