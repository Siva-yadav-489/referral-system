"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardStatsCards } from "./dashboard-stats-cards";
import { RecentBookingsCard } from "./recent-bookings-card";
import { RecentInvoicesCard } from "./recent-invoices-card";
import { BookingWithDetails } from "@/app/actions/booking/booking.types";
import { InvoiceWithDetails } from "@/app/actions/billing/billing.types";
import { PageHeader } from "../page-header";

interface DashboardData {
  totalProperties: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  maintenanceBeds: number;
  occupancyRate: number;
  activeBookingsCount: number;
  totalBookingsCount: number;
  pendingAmount: number;
  collectedAmount: number;
  recentBookings: BookingWithDetails[];
  recentInvoices: InvoiceWithDetails[];
}

interface AdminDashboardClientProps {
  data: DashboardData;
}

export function AdminDashboardClient({ data }: AdminDashboardClientProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
      <div className="space-y-8">
        {/* Header */}
        <PageHeader
          title="PG Operations Dashboard"
          description="Real-time occupancy tracking, bed allocations, and monthly billing cycles."
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </PageHeader>

        {/* KPI Cards */}
        <DashboardStatsCards
          totalProperties={data.totalProperties}
          totalRooms={data.totalRooms}
          totalBeds={data.totalBeds}
          occupiedBeds={data.occupiedBeds}
          vacantBeds={data.vacantBeds}
          maintenanceBeds={data.maintenanceBeds}
          occupancyRate={data.occupancyRate}
          activeBookingsCount={data.activeBookingsCount}
          totalBookingsCount={data.totalBookingsCount}
          pendingAmount={data.pendingAmount}
        />

        {/* Two Column: Recent Bookings & Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentBookingsCard bookings={data.recentBookings} />
          <RecentInvoicesCard initialInvoices={data.recentInvoices} />
        </div>
      </div>
    </div>
  );
}
