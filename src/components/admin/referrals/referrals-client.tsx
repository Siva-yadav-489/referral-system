"use client";

import { useCallback, useEffect, useState } from "react";
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
import { ReferralLeadCard } from "./referral-lead-card";
import { PageHeader } from "../page-header";
import { FilterToolbar, StatusFilterTabs } from "../filter-toolbar";
import { z } from "zod";
import { getMonth, getYear } from "date-fns";

type ReferralFilter = z.infer<typeof zodGetReferralsFilterSchema>;

interface ReferralsClientProps {
  initialReferralLeads: ReferralLeadWithDetails[];
  properties: Property[];
}

const REFERRAL_STATUS_TABS = [
  "ALL",
  "PENDING",
  "ACTIVE",
  "QUALIFIED",
  "REWARDED",
  "DISQUALIFIED",
];

export function ReferralsClient({
  initialReferralLeads,
  properties,
}: ReferralsClientProps) {
  const [referralLeads, setReferralLeads] =
    useState<ReferralLeadWithDetails[]>(initialReferralLeads);
  const [loading, setLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<number>(
    getMonth(new Date()) + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [propertyFilter, setPropertyFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const buildFilter = useCallback((): ReferralFilter => {
    const filter: ReferralFilter = {};

    if (selectedYear != null) {
      filter.year = selectedYear;
    }

    if (selectedMonth != null) {
      filter.month = selectedMonth;
    }

    if (propertyFilter !== "ALL") {
      filter.propertyId = propertyFilter;
    }

    return filter;
  }, [selectedMonth, selectedYear, propertyFilter]);

  const fetchReferralLeads = useCallback(async (filter: ReferralFilter) => {
    setLoading(true);
    try {
      const res = await getReferralLeadsAction(filter);
      if (res.success && res.data) {
        setReferralLeads(res.data);
      } else {
        toast.error(res.error || "Failed to load referrals");
      }
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
      toast.error("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when server filters change
  useEffect(() => {
    void fetchReferralLeads(buildFilter());
  }, [buildFilter, fetchReferralLeads]);

  const handleRefresh = () => {
    void fetchReferralLeads(buildFilter());
  };

  const scopedReferralLeads = referralLeads.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const refereeNameMatch = item.refereeName?.toLowerCase().includes(query);
    const refereePhoneMatch = item.refereeContactNo
      ?.toLowerCase()
      .includes(query);
    const refereeEmailMatch = item.refereeEmail?.toLowerCase().includes(query);
    const referrerNameMatch = item.referrer?.name
      ?.toLowerCase()
      .includes(query);
    const referrerPhoneMatch = item.referrer?.contactNo
      ?.toLowerCase()
      .includes(query);
    const referrerEmailMatch = item.referrer?.email
      ?.toLowerCase()
      .includes(query);
    const propertyMatch = item.property?.name?.toLowerCase().includes(query);

    return Boolean(
      refereeNameMatch ||
      refereePhoneMatch ||
      refereeEmailMatch ||
      referrerNameMatch ||
      referrerPhoneMatch ||
      referrerEmailMatch ||
      propertyMatch,
    );
  });

  const filteredReferralLeads = scopedReferralLeads.filter((item) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING") return !item.referral;
    return item.referral?.status === statusFilter;
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
                className={`w-3.5 h-3.5 mr-1.5 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          </div>
        </PageHeader>

        <FilterToolbar
          properties={properties}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          propertyFilter={propertyFilter}
          searchQuery={searchQuery}
          searchPlaceholder="Search referrer, referee, phone..."
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onPropertyChange={setPropertyFilter}
          onSearchChange={setSearchQuery}
        />

        <ReferralsStatsCards referralLeads={scopedReferralLeads} />

        <StatusFilterTabs
          statusFilter={statusFilter}
          statusTabs={REFERRAL_STATUS_TABS}
          onStatusChange={setStatusFilter}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading referrals...
            </p>
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
