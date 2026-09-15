"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BedSingle, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getBookingsAction,
  getPropertiesAction,
  getAvailableBedsAction,
  extendStayAction,
  cancelBookingAction,
} from "@/app/actions/admin-actions";
import { BookingWithDetails } from "@/app/actions/booking/booking.types";
import {
  BedWithRoomDetails,
  Property,
} from "@/app/actions/property/property.types";
import { BookingCard } from "./booking-card";
import { NewBookingModal } from "./new-booking-modal";
import { ExtendStayModal } from "./extend-stay-modal";
import {
  CheckoutTenantDialog,
  CheckoutTenantTarget,
} from "./checkout-tenant-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "../page-header";
import {
  FilterToolbar,
  FilterStatusTab,
  StatusFilterTabs,
} from "../filter-toolbar";
import Link from "next/link";
import BookingStatsCards from "./booking-stats-cards";
import { getMonth, getYear } from "date-fns";

interface BookingsClientProps {
  initialBookings: BookingWithDetails[];
  initialProperties: Property[];
  initialAvailableBeds: BedWithRoomDetails[];
}

export function BookingsClient({
  initialBookings,
  initialProperties,
  initialAvailableBeds,
}: BookingsClientProps) {
  const [bookings, setBookings] =
    useState<BookingWithDetails[]>(initialBookings);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [availableBeds, setAvailableBeds] =
    useState<BedWithRoomDetails[]>(initialAvailableBeds);
  const [loading, setLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<number>(
    getMonth(new Date()) + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));

  // Status, Property & Search States
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPropertyFilter, setSelectedPropertyFilter] =
    useState<string>("ALL");

  // Modals state
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [extendingBooking, setExtendingBooking] =
    useState<BookingWithDetails | null>(null);
  const [newEndDate, setNewEndDate] = useState("");
  const [extending, setExtending] = useState(false);

  // Confirmation dialogs
  const [checkoutTarget, setCheckoutTarget] =
    useState<CheckoutTenantTarget | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  // Action in progress
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(
    null,
  );

  // Re-fetch bookings when property filter changes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const propId =
        selectedPropertyFilter !== "ALL" ? selectedPropertyFilter : undefined;
      const res = await getBookingsAction(propId);
      if (res.success && res.data) {
        setBookings(res.data);
      } else {
        toast.error(res.error || "Failed to load bookings");
      }
      setLoading(false);
    };

    void load();
  }, [selectedPropertyFilter]);

  // Refetch all dependencies
  const refreshAll = async () => {
    setLoading(true);
    const propId =
      selectedPropertyFilter !== "ALL" ? selectedPropertyFilter : undefined;
    const [bookingsRes, propsRes, bedsRes] = await Promise.all([
      getBookingsAction(propId),
      getPropertiesAction(),
      getAvailableBedsAction(),
    ]);
    if (bookingsRes.success && bookingsRes.data) setBookings(bookingsRes.data);
    if (propsRes.success && propsRes.data) setProperties(propsRes.data);
    if (bedsRes.success && bedsRes.data) setAvailableBeds(bedsRes.data);
    setLoading(false);
  };

  const handleExtendStay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingBooking || !newEndDate) {
      toast.error("Please select a new end date");
      return;
    }
    try {
      setExtending(true);
      const res = await extendStayAction(extendingBooking.id, {
        newEndDate,
      });
      if (res.success) {
        toast.success(
          `Stay extended until ${newEndDate}. Additional invoices generated.`,
        );
        setExtendingBooking(null);
        setNewEndDate("");
        await refreshAll();
      } else {
        toast.error(res.error || "Failed to extend stay");
      }
    } catch {
      toast.error("Error extending stay");
    } finally {
      setExtending(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      setActionInProgressId(cancelTarget);
      const res = await cancelBookingAction(cancelTarget);
      if (res.success) {
        toast.success("Booking cancelled. Bed marked as VACANT.");
        await refreshAll();
      } else {
        toast.error(res.error || "Failed to cancel booking");
      }
    } catch {
      toast.error("Error cancelling booking");
    } finally {
      setActionInProgressId(null);
      setCancelTarget(null);
    }
  };

  const isDateInPeriod = (
    dateStr?: string | null,
    month = selectedMonth,
    year = selectedYear,
  ) => {
    if (!dateStr) return false;
    const part = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const [parsedYear, parsedMonth] = part.split("-").map(Number);
    if (year != null && parsedYear !== year) return false;
    if (month != null && parsedMonth !== month) return false;
    return true;
  };

  const isStayInPeriod = (
    startStr: string,
    endStr?: string | null,
    month = selectedMonth,
    year = selectedYear,
  ) => {
    if (year == null && month == null) return true;

    const periodStart =
      month != null && year != null
        ? new Date(year, month - 1, 1)
        : new Date(year as number, 0, 1);
    const periodEnd =
      month != null && year != null
        ? new Date(year, month, 0, 23, 59, 59)
        : new Date(year as number, 11, 31, 23, 59, 59);

    const startDate = new Date(startStr);
    const endDate = endStr ? new Date(endStr) : null;

    if (startDate > periodEnd) return false;
    if (endDate && endDate < periodStart) return false;
    return true;
  };

  const matchesSearchQuery = (booking: BookingWithDetails) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return Boolean(
      booking.customer?.name?.toLowerCase().includes(query) ||
      booking.customer?.contactNo?.includes(query) ||
      booking.customer?.email?.toLowerCase().includes(query) ||
      booking.bed?.bedNumber?.toLowerCase().includes(query) ||
      booking.bed?.room?.roomNumber?.toLowerCase().includes(query) ||
      booking.property?.name?.toLowerCase().includes(query),
    );
  };

  const scopedBookings = bookings.filter(
    (booking) =>
      isStayInPeriod(booking.startDate, booking.endDate) &&
      matchesSearchQuery(booking),
  );

  const statusTabs: FilterStatusTab[] = useMemo(() => {
    const activeCount = scopedBookings.filter(
      (b) => b.status === "ACTIVE",
    ).length;
    const extendedCount = scopedBookings.filter(
      (b) => b.status === "EXTENDED",
    ).length;
    const checkInsCount = scopedBookings.filter((b) =>
      isDateInPeriod(b.startDate),
    ).length;
    const checkOutsCount = scopedBookings.filter((b) =>
      isDateInPeriod(b.endDate),
    ).length;
    const completedCount = scopedBookings.filter(
      (b) => b.status === "COMPLETED",
    ).length;

    return [
      { label: "ALL", value: "ALL", count: scopedBookings.length },
      { label: "ACTIVE", value: "ACTIVE", count: activeCount },
      { label: "EXTENDED", value: "EXTENDED", count: extendedCount },
      { label: "CHECK-INS", value: "CHECKINS", count: checkInsCount },
      { label: "CHECK-OUTS", value: "CHECKOUTS", count: checkOutsCount },
      { label: "COMPLETED", value: "COMPLETED", count: completedCount },
    ];
  }, [scopedBookings, selectedMonth, selectedYear]);

  const filteredBookings = scopedBookings.filter((booking) => {
    if (statusFilter === "CHECKINS") {
      return isDateInPeriod(booking.startDate);
    }
    if (statusFilter === "CHECKOUTS") {
      return isDateInPeriod(booking.endDate);
    }
    return statusFilter === "ALL" || booking.status === statusFilter;
  });

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Bookings & Tenant Management"
        description="Manage tenant check-ins, stay durations, bed assignments, and checkouts."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={loading}
            className="cursor-pointer text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setShowNewBookingModal(true)}
            className="cursor-pointer text-xs font-semibold"
            disabled={initialProperties.length === 0}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Booking
          </Button>
        </div>
      </PageHeader>

      <FilterToolbar
        properties={properties}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        propertyFilter={selectedPropertyFilter}
        searchQuery={searchQuery}
        searchPlaceholder="Search tenant, phone, bed, room..."
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onPropertyChange={setSelectedPropertyFilter}
        onSearchChange={setSearchQuery}
      />

      <BookingStatsCards
        bookings={scopedBookings}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      <StatusFilterTabs
        statusFilter={statusFilter}
        statusTabs={statusTabs}
        onStatusChange={setStatusFilter}
      />

      {/* Bookings List */}
      <div className="space-y-3">
        {loading && bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="bg-card border-dashed border-2 border-border py-14 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <BedSingle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                No bookings found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchQuery ||
                statusFilter !== "ALL" ||
                selectedPropertyFilter !== "ALL" ||
                selectedYear != null
                  ? "No bookings match the selected filters. Try changing or resetting your search."
                  : "No tenant bookings have been created yet. Click below to add the first booking."}
              </p>
              <Button
                onClick={() => setShowNewBookingModal(true)}
                size="sm"
                className="mt-2 text-xs"
                disabled={initialProperties.length === 0}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Booking
              </Button>

              {initialProperties.length === 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">
                    To make a booking, you need to add a property first.
                  </p>
                  <Link
                    href="/admin/properties"
                    className="text-primary hover:underline text-xs"
                  >
                    <Button size="sm" className="mt-2 text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Property
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              actionInProgressId={actionInProgressId}
              onExtend={(b) => {
                setExtendingBooking(b);
                setNewEndDate(b.endDate || "");
              }}
              onCheckout={(id, name) =>
                setCheckoutTarget({
                  id,
                  name,
                })
              }
              onCancel={(id) => setCancelTarget(id)}
            />
          ))
        )}
      </div>

      {/* New Booking Modal */}
      <NewBookingModal
        isOpen={showNewBookingModal}
        properties={properties}
        initialAvailableBeds={availableBeds}
        onClose={() => setShowNewBookingModal(false)}
        onSuccess={refreshAll}
      />

      {/* Extend Stay Modal */}
      {extendingBooking && (
        <ExtendStayModal
          booking={extendingBooking}
          newEndDate={newEndDate}
          isExtending={extending}
          onEndDateChange={setNewEndDate}
          onSubmit={handleExtendStay}
          onClose={() => {
            setExtendingBooking(null);
            setNewEndDate("");
          }}
        />
      )}

      {/* Reusable Checkout confirmation dialog */}
      <CheckoutTenantDialog
        target={checkoutTarget}
        onClose={() => setCheckoutTarget(null)}
        onSuccess={refreshAll}
      />

      {/* Cancel confirmation dialog */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? The bed will be freed and marked as VACANT."
        confirmText="Cancel Booking"
        variant="destructive"
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
