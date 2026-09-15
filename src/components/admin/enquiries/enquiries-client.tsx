"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getEnquiriesAction,
  updateEnquiryStatusAction,
} from "@/app/actions/admin-actions";
import {
  EnquiryWithDetails,
  zodGetEnquiriesFilterSchema,
} from "@/app/actions/enquiry/enquiry.types";
import { Property } from "@/app/actions/property/property.types";
import { EnquiriesStatsCards } from "./enquiries-stats-cards";
import { EnquiryCard } from "./enquiry-card";
import { z } from "zod";
import { PageHeader } from "../page-header";
import { FilterToolbar, StatusFilterTabs } from "../filter-toolbar";
import { getMonth, getYear } from "date-fns";

type EnquiryFilter = z.infer<typeof zodGetEnquiriesFilterSchema>;

interface EnquiriesClientProps {
  initialEnquiries: EnquiryWithDetails[];
  properties: Property[];
}

export function EnquiriesClient({
  initialEnquiries,
  properties,
}: EnquiriesClientProps) {
  const [enquiries, setEnquiries] =
    useState<EnquiryWithDetails[]>(initialEnquiries);
  const [loading, setLoading] = useState(false);
  const [updatingEnquiryId, setUpdatingEnquiryId] = useState<string | null>(
    null,
  );

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<number>(
    getMonth(new Date()) + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [propertyFilter, setPropertyFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const buildHighLevelFilter = (): EnquiryFilter => {
    const filter: EnquiryFilter = {};
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
  };

  const fetchEnquiries = async (filter: EnquiryFilter) => {
    setLoading(true);
    const res = await getEnquiriesAction(filter);
    if (res.success && res.data) {
      setEnquiries(res.data);
    } else {
      toast.error(res.error || "Failed to load enquiries");
    }
    setLoading(false);
  };

  useEffect(() => {
    const filter = buildHighLevelFilter();

    const load = async () => {
      setLoading(true);
      const res = await getEnquiriesAction(filter);
      if (res.success && res.data) {
        setEnquiries(res.data);
      } else {
        toast.error(res.error || "Failed to load enquiries");
      }
      setLoading(false);
    };
    void load();
  }, [selectedMonth, selectedYear, propertyFilter]);

  const handleRefresh = () => {
    void fetchEnquiries(buildHighLevelFilter());
  };

  const handleUpdateStatus = async (
    enquiryId: string,
    nextStatus: "UNREAD" | "CONTACTED" | "CONVERTED" | "NOT_INTERESTED",
  ) => {
    try {
      setUpdatingEnquiryId(enquiryId);
      const res = await updateEnquiryStatusAction(enquiryId, {
        status: nextStatus,
      });
      if (res.success) {
        toast.success(`Enquiry status updated to ${nextStatus}`);
        setEnquiries((prev) =>
          prev.map((item) =>
            item.id === enquiryId ? { ...item, status: nextStatus } : item,
          ),
        );
      } else {
        toast.error(res.error || "Failed to update enquiry status");
      }
    } catch {
      toast.error("Error updating enquiry status");
    } finally {
      setUpdatingEnquiryId(null);
    }
  };

  const scopedEnquiries = enquiries.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(q);
    const phoneMatch = item.contactNo.includes(q);
    const emailMatch = item.email.toLowerCase().includes(q);
    const messageMatch = item.message?.toLowerCase().includes(q);
    const propMatch = item.property?.name?.toLowerCase().includes(q);
    return nameMatch || phoneMatch || emailMatch || messageMatch || propMatch;
  });

  const filteredEnquiries = scopedEnquiries.filter(
    (item) => statusFilter === "ALL" || item.status === statusFilter,
  );

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Enquiries & Leads"
          description="View, filter, and track prospective tenant leads for your properties."
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

        <FilterToolbar
          properties={properties}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          propertyFilter={propertyFilter}
          searchQuery={searchQuery}
          searchPlaceholder="Search prospect, phone, email..."
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onPropertyChange={setPropertyFilter}
          onSearchChange={setSearchQuery}
        />

        <EnquiriesStatsCards enquiries={scopedEnquiries} />

        <StatusFilterTabs
          statusFilter={statusFilter}
          statusTabs={[
            "ALL",
            "UNREAD",
            "CONTACTED",
            "CONVERTED",
            "NOT_INTERESTED",
          ]}
          onStatusChange={setStatusFilter}
        />

        {/* Enquiries List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading enquiries...
            </p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <Card className="bg-card border-dashed border-2 border-border py-16 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                No enquiries found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                No enquiries match your current filters. Try changing or
                clearing the filters above to see more leads.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEnquiries.map((item) => (
              <EnquiryCard
                key={item.id}
                enquiry={item}
                updatingId={updatingEnquiryId}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
