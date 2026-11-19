import Link from "next/link";

/**
 * Public entry — routes people to the correct environment.
 * Does not mix Platform Owner, Company, or Staff identities.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold tracking-[0.12em] uppercase text-black mb-2">
          Nexora
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          Microfinance infrastructure
        </p>

        <div className="space-y-3">
          <Link
            href="/owner/login"
            className="btn-primary w-full py-4 block text-center"
          >
            Platform Owner
          </Link>
          <Link
            href="/company/login"
            className="btn-secondary w-full py-4 block text-center"
          >
            Company workspace
          </Link>
          <Link
            href="/branch/login"
            className="btn-secondary w-full py-4 block text-center"
          >
            Branch staff
          </Link>
        </div>
      </div>
    </div>
  );
}
