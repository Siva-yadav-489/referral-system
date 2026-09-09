import { Building2, BedSingle, Users, Receipt, LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DashboardCard = ({
  title,
  icon: Icon,
  description,
  value,
}: {
  title: string;
  icon: LucideIcon;
  description: string;
  value: React.ReactNode;
}) => {
  return (
    <Card className="bg-card border-border shadow-sm hover:border-border/80 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs font-semibold text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

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
      <DashboardCard
        title="Properties"
        icon={Building2}
        value={totalProperties}
        description={`${totalRooms} total rooms`}
      />

      {/* Beds & Occupancy */}
      <DashboardCard
        title="Occupancy"
        icon={BedSingle}
        value={`${occupiedBeds}/${totalBeds}(${occupancyRate}%) occupied`}
        description={`${vacantBeds} vacant, ${maintenanceBeds} under maintenance`}
      />

      {/* Active Bookings */}
      <DashboardCard
        title="Active Tenants"
        icon={Users}
        value={activeBookingsCount}
        description={`Out of ${totalBookingsCount} total bookings`}
      />

      {/* Billing Overview */}
      <DashboardCard
        title="Billing Status"
        icon={Receipt}
        value={`₹${pendingAmount.toLocaleString("en-IN")}`}
        description="Pending collection this month"
      />
    </div>
  );
}
