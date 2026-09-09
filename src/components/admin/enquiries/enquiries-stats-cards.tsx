import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EnquiryWithDetails } from "@/app/actions/enquiry/enquiry.types";
import { MessageSquare, Clock, PhoneCall, CheckCircle2 } from "lucide-react";

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
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <MessageSquare className="w-4 h-4" />
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
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
            <Clock className="w-4 h-4" />
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
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <PhoneCall className="w-4 h-4" />
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
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {conversionRate}% conversion rate
        </CardContent>
      </Card>
    </div>
  );
}
