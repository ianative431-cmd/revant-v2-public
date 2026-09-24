import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#EFEFED] px-4">
      <h1 className="text-2xl font-bold">Revant</h1>
      <p className="text-neutral-500 text-sm">seconde vie, nouvelle valeur</p>
      <div className="flex gap-3">
        <Link href="/connexion" className="bg-black text-white rounded-full px-6 py-3 text-sm font-medium">
          Connexion
        </Link>
        <Link href="/inscription" className="border border-black rounded-full px-6 py-3 text-sm font-medium">
          Inscription
        </Link>
      </div>
    </div>
  );
}
