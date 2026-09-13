import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReferralLeadWithDetails } from "@/app/actions/referrals/referral.types";
import { Clock, Gift, UserPlus, Users } from "lucide-react";

interface ReferralsStatsCardsProps {
  referralLeads: ReferralLeadWithDetails[];
}

export function ReferralsStatsCards({
  referralLeads,
}: ReferralsStatsCardsProps) {
  const totalCount = referralLeads.length;
  const pendingCount = referralLeads.filter((lead) => !lead.referral).length;
  const activeCount = referralLeads.filter(
    (lead) => lead.referral?.status === "ACTIVE",
  ).length;
  const rewardedCount = referralLeads.filter(
    (lead) => lead.referral?.status === "REWARDED",
  ).length;

  const conversionRate =
    totalCount > 0
      ? Math.round(((totalCount - pendingCount) / totalCount) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardDescription className="text-xs">Total Referrals</CardDescription>
            <CardTitle className="text-xl font-bold text-foreground mt-1">
              {totalCount}
            </CardTitle>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <UserPlus className="w-4 h-4" />
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
              Pending Leads
            </CardDescription>
            <CardTitle className="text-xl font-bold text-sky-400 mt-1">
              {pendingCount}
            </CardTitle>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Awaiting referee booking
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardDescription className="text-xs text-amber-400 font-medium">
              Active Referrals
            </CardDescription>
            <CardTitle className="text-xl font-bold text-amber-400 mt-1">
              {activeCount}
            </CardTitle>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Users className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Referees currently staying
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardDescription className="text-xs text-emerald-400 font-medium">
              Rewarded
            </CardDescription>
            <CardTitle className="text-xl font-bold text-emerald-400 mt-1">
              {rewardedCount}
            </CardTitle>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Gift className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {conversionRate}% matched to bookings
        </CardContent>
      </Card>
    </div>
  );
}
