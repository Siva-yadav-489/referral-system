import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { getDashboardStatsAction } from "@/app/actions/admin-actions";
import { AdminDashboardClient } from "@/components/admin/dashboard/admin-dashboard-client";

async function DashboardContent() {
  const res = await getDashboardStatsAction();

  if (!res.success || !res.data) {
    return (
      <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <p className="text-sm text-destructive font-medium">
            {res.error || "Failed to load dashboard data"}
          </p>
        </div>
      </div>
    );
  }

  return <AdminDashboardClient data={res.data} />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading PG dashboard overview...
            </p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
