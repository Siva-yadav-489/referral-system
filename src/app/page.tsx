"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { useSession } from "@/lib/auth-client";

function HomeContent() {
  const session = useSession();

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight max-w-4xl leading-tight">
        Modern PG Living with{" "}
        <span className="text-primary">Smart Occupancy</span>
      </h1>

      <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-6 leading-relaxed">
        Explore floor-by-floor room availability, reserve single or shared PG
        beds in real-time.
      </p>

      <Link
        href={!session ? "/login?callbackUrl=/admin" : "/admin"}
        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3.5 mt-8 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        Go to Dashboard
        <ArrowRight className="w-4 h-4" />
      </Link>
    </main>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <Suspense
        fallback={
          <div className="text-muted-foreground text-sm text-center py-20">
            Loading...
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </div>
  );
}
