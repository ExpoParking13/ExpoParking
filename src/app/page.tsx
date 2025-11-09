import Link from "next/link";
import TopBar from "@/components/TopBar";

export default function Landing() {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-screen-md px-4 py-10 sm:py-16">
        <section className="text-center space-y-6">
          <h1 className="text-3xl sm:text-4xl font-semibold">Encuentra parqueaderos cerca</h1>
          <p className="text-gray-600 max-w-prose mx-auto">
            Prototipo móvil-first. Inicia sesión o regístrate para continuar.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-gray-900 text-white"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 border"
            >
              Registro
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
