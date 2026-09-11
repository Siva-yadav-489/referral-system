import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 bg-background text-foreground">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-8xl font-bold tracking-tight">404</h1>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Page Not Found
            </h2>
            <p>
              The page you are looking for doesn&apos;t exist or has been moved.
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Link
            href="/"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2.5 font-medium border transition-colors shadow-sm"
          >
            Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
