import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EnquiryWithDetails } from "@/app/actions/enquiry/enquiry.types";

interface EnquiriesStatsCardsProps {
  enquiries: EnquiryWithDetails[];
}

export function EnquiriesStatsCards({ enquiries }: EnquiriesStatsCardsProps) {
  const totalCount = enquiries.length;
  const unreadCount = enquiries.filter((e) => e.status === "UNREAD").length;
  const contactedCount = enquiries.filter(
    (e) => e.status === "CONTACTED",
  ).length;
  const convertedCount = enquiries.filter(
    (e) => e.status === "CONVERTED",
  ).length;

  const conversionRate =
    totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardDescription className="text-xs">
              Total Enquiries
            </CardDescription>
            <CardTitle className="text-xl font-bold text-foreground mt-1">
              {totalCount}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Showing current filter results
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardDescription className="text-xs text-sky-400 font-medium">
              New / Unread
            </CardDescription>
            <CardTitle className="text-xl font-bold text-sky-400 mt-1">
              {unreadCount}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {unreadCount > 0
            ? "Awaiting first response"
            : "All enquiries reviewed"}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardDescription className="text-xs text-amber-400 font-medium">
              In Follow-Up
            </CardDescription>
            <CardTitle className="text-xl font-bold text-amber-400 mt-1">
              {contactedCount}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Prospects contacted
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardDescription className="text-xs text-emerald-400 font-medium">
              Converted Leads
            </CardDescription>
            <CardTitle className="text-xl font-bold text-emerald-400 mt-1">
              {convertedCount}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {conversionRate}% conversion rate
        </CardContent>
      </Card>
    </div>
  );
}
