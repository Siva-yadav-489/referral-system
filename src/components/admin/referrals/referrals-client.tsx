"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getReferralLeadsAction } from "@/app/actions/admin-actions";
import {
  ReferralLeadWithDetails,
  zodGetReferralsFilterSchema,
} from "@/app/actions/referrals/referral.types";
import { Property } from "@/app/actions/property/property.types";
import { ReferralsStatsCards } from "./referrals-stats-cards";
import { ReferralsFilterToolbar } from "./referrals-filter-toolbar";
import { ReferralLeadCard } from "./referral-lead-card";
import { z } from "zod";
import { PageHeader } from "../page-header";

type ReferralFilter = z.infer<typeof zodGetReferralsFilterSchema>;

interface ReferralsClientProps {
  initialReferralLeads: ReferralLeadWithDetails[];
  properties: Property[];
  initialMonth: number;
  initialYear: number;
}

export function ReferralsClient({
  initialReferralLeads,
  properties,
  initialMonth,
  initialYear,
}: ReferralsClientProps) {
  const [referralLeads, setReferralLeads] =
    useState<ReferralLeadWithDetails[]>(initialReferralLeads);
  const [loading, setLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [useMonthFilter, setUseMonthFilter] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [propertyFilter, setPropertyFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const buildFilter = (): ReferralFilter => {
    const filter: ReferralFilter = {};

    if (useMonthFilter) {
      filter.month = selectedMonth;
      filter.year = selectedYear;
    }

    if (statusFilter !== "ALL") {
      filter.status = statusFilter as ReferralFilter["status"];
    }

    if (propertyFilter !== "ALL") {
      filter.propertyId = propertyFilter;
    }

    return filter;
  };

  const fetchReferralLeads = async (filter: ReferralFilter) => {
    setLoading(true);
    const res = await getReferralLeadsAction(filter);
    if (res.success && res.data) {
      setReferralLeads(res.data);
    } else {
      toast.error(res.error || "Failed to load referrals");
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchReferralLeads(buildFilter());
  }, [selectedMonth, selectedYear, useMonthFilter, statusFilter, propertyFilter]);

  const handleRefresh = () => {
    void fetchReferralLeads(buildFilter());
  };

  const filteredReferralLeads = referralLeads.filter((item) => {
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const refereeNameMatch = item.refereeName.toLowerCase().includes(q);
    const refereePhoneMatch = item.refereeContactNo.includes(q);
    const refereeEmailMatch = item.refereeEmail?.toLowerCase().includes(q);
    const referrerNameMatch = item.referrer?.name?.toLowerCase().includes(q);
    const referrerPhoneMatch = item.referrer?.contactNo?.includes(q);
    const referrerEmailMatch = item.referrer?.email?.toLowerCase().includes(q);
    const propMatch = item.property?.name?.toLowerCase().includes(q);

    return (
      refereeNameMatch ||
      refereePhoneMatch ||
      refereeEmailMatch ||
      referrerNameMatch ||
      referrerPhoneMatch ||
      referrerEmailMatch ||
      propMatch
    );
  });

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
      <div className="space-y-6">
        <PageHeader
          title="Referrals"
          description="Track friend referrals, referee bookings, and reward points for referrers."
        >
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-xs cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </PageHeader>

        <ReferralsStatsCards referralLeads={filteredReferralLeads} />

        <ReferralsFilterToolbar
          properties={properties}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          useMonthFilter={useMonthFilter}
          statusFilter={statusFilter}
          propertyFilter={propertyFilter}
          searchQuery={searchQuery}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onToggleMonthFilter={() => setUseMonthFilter((value) => !value)}
          onStatusChange={setStatusFilter}
          onPropertyChange={setPropertyFilter}
          onSearchChange={setSearchQuery}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading referrals...</p>
          </div>
        ) : filteredReferralLeads.length === 0 ? (
          <Card className="bg-card border-dashed border-2 border-border py-16 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                No referrals found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                No referral leads match your current filters. Referrals appear
                here when someone submits the refer-a-friend form on your
                landing page.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReferralLeads.map((item) => (
              <ReferralLeadCard key={item.id} lead={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
