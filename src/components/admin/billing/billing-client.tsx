"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Receipt, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getInvoicesAction,
  updateInvoiceStatusAction,
  generateMonthlyInvoicesAction,
} from "@/app/actions/admin-actions";
import {
  InvoiceWithDetails,
  zodGetInvoicesFilterSchema,
} from "@/app/actions/billing/billing.types";
import { Property } from "@/app/actions/property/property.types";
import { BillingStatsCards } from "./billing-stats-cards";
import { FilterToolbar, StatusFilterTabs } from "../filter-toolbar";
import { InvoiceCard } from "./invoice-card";
import { z } from "zod";
import { PageHeader } from "../page-header";
import { getMonth, getYear } from "date-fns";

type InvoiceFilter = z.infer<typeof zodGetInvoicesFilterSchema>;

interface BillingClientProps {
  initialInvoices: InvoiceWithDetails[];
  properties: Property[];
}

export function BillingClient({
  initialInvoices,
  properties,
}: BillingClientProps) {
  const [invoices, setInvoices] =
    useState<InvoiceWithDetails[]>(initialInvoices);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(
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

  const buildHighLevelFilter = (): InvoiceFilter => {
    const filter: InvoiceFilter = {};
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

  const fetchInvoices = async (filter: InvoiceFilter) => {
    const load = async () => {
      setLoading(true);
      const res = await getInvoicesAction(filter);
      if (res.success && res.data) {
        setInvoices(res.data);
      } else {
        toast.error(res.error || "Failed to load invoices");
      }
      setLoading(false);
    };
    void load();
  };

  // Re-fetch when high-level filters change (status stays client-side)
  useEffect(() => {
    const filter = buildHighLevelFilter();

    const load = async () => {
      setLoading(true);
      const res = await getInvoicesAction(filter);
      if (res.success && res.data) {
        setInvoices(res.data);
      } else {
        toast.error(res.error || "Failed to load invoices");
      }
      setLoading(false);
    };
    void load();
  }, [selectedMonth, selectedYear, propertyFilter]);

  const handleRefresh = () => {
    fetchInvoices(buildHighLevelFilter());
  };

  const handleGenerateMonthlyBills = async () => {
    try {
      setGenerating(true);
      const res = await generateMonthlyInvoicesAction();
      if (res.success) {
        toast.success(
          res.count && res.count > 0
            ? `Generated ${res.count} invoices for this billing cycle! Payment due on the 5th.`
            : "All active tenants already have invoices issued for this cycle.",
        );
        handleRefresh();
      } else {
        toast.error(res.error || "Failed to generate monthly invoices");
      }
    } catch {
      toast.error("Error generating invoices");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (
    invoiceId: string,
    nextStatus: "PENDING" | "PAID" | "OVERDUE",
  ) => {
    try {
      setUpdatingInvoiceId(invoiceId);
      const res = await updateInvoiceStatusAction(invoiceId, {
        status: nextStatus,
      });
      if (res.success) {
        toast.success(`Invoice status updated to ${nextStatus}`);
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceId ? { ...inv, status: nextStatus } : inv,
          ),
        );
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch {
      toast.error("Error updating invoice status");
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  const scopedInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const customerMatch = inv.booking?.customer?.name
      ?.toLowerCase()
      .includes(q);
    const phoneMatch = inv.booking?.customer?.contactNo?.includes(q);
    const bedMatch = inv.booking?.bed?.bedNumber?.toLowerCase().includes(q);
    return customerMatch || phoneMatch || bedMatch;
  });

  const filteredInvoices = scopedInvoices.filter(
    (inv) => statusFilter === "ALL" || inv.status === statusFilter,
  );

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Billing & Invoices"
          description="Monthly rent generation (billed on the 1st, due by the 5th) and payment updates."
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={handleGenerateMonthlyBills}
              disabled={generating}
              className="text-xs"
            >
              {generating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              )}
              Run 1st-of-Month Billing
            </Button>
          </div>
        </PageHeader>

        <FilterToolbar
          properties={properties}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          propertyFilter={propertyFilter}
          searchQuery={searchQuery}
          searchPlaceholder="Search tenant or bed..."
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onPropertyChange={setPropertyFilter}
          onSearchChange={setSearchQuery}
        />

        <BillingStatsCards invoices={scopedInvoices} />

        <StatusFilterTabs
          statusFilter={statusFilter}
          statusTabs={["ALL", "PENDING", "PAID", "OVERDUE"]}
          onStatusChange={setStatusFilter}
        />

        {/* Invoices List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <Card className="bg-card border-dashed border-2 border-border py-16 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                No invoices found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                No bills match your current filters. Click below to generate
                recurring bills for all active tenants.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((inv) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                updatingId={updatingInvoiceId}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
