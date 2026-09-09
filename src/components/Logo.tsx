import { Building2 } from "lucide-react";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
        <Building2 className="w-5 h-5" />
      </div>

      <div className="flex flex-col">
        <span className="font-extrabold text-foreground tracking-tight text-lg leading-none">
          Beyond Stays
        </span>
      </div>
    </Link>
  );
}
