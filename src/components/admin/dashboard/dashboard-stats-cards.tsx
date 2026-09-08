import Link from "next/link";
import {
  Building2,
  BedSingle,
  Users,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardStatsCardsProps {
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
}

export function DashboardStatsCards({
  totalProperties,
  totalRooms,
  totalBeds,
  occupiedBeds,
  vacantBeds,
  maintenanceBeds,
  occupancyRate,
  activeBookingsCount,
  totalBookingsCount,
  pendingAmount,
}: DashboardStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Properties */}
      <Card className="bg-card border-border shadow-sm hover:border-border/80 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Properties
          </CardTitle>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {totalProperties}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalRooms} total rooms configured
          </p>
          <div className="mt-3">
            <Link
              href="/admin/properties"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center"
            >
              Manage properties <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Beds & Occupancy */}
      <Card className="bg-card border-border shadow-sm hover:border-border/80 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Occupancy
          </CardTitle>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <BedSingle className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {occupancyRate}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({occupiedBeds}/{totalBeds} beds)
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
            >
              {vacantBeds} Vacant
            </Badge>
            {maintenanceBeds > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-400 bg-amber-500/10"
              >
                {maintenanceBeds} Maint.
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Bookings */}
      <Card className="bg-card border-border shadow-sm hover:border-border/80 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Tenants
          </CardTitle>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Users className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {activeBookingsCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Out of {totalBookingsCount} total bookings
          </p>
          <div className="mt-3">
            <Link
              href="/admin/bookings"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center"
            >
              View bookings list <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Billing Overview */}
      <Card className="bg-card border-border shadow-sm hover:border-border/80 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Billing Status
          </CardTitle>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Receipt className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ₹{pendingAmount.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-amber-400/90 font-medium mt-1">
            Pending collection (Due by 5th)
          </p>
          <div className="mt-3">
            <Link
              href="/admin/billing"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center"
            >
              Go to billing ledger{" "}
              <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
