import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Kick out unauthenticated users or standard users
  if (!session || session.user.role !== "ADMIN") {
    redirect("/"); // Or redirect to a 403 Forbidden page
  }

  return (
    <div className="admin-layout-wrapper min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="p-4 sm:p-8 flex-1 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
