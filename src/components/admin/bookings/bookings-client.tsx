"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BedSingle, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  // Filters & search
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "COMPLETED"
  >("ALL");
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
    const load = async () => {
      setLoading(true);
      const propId =
        selectedPropertyFilter !== "ALL" ? selectedPropertyFilter : undefined;
      const [bookingsRes, propsRes, bedsRes] = await Promise.all([
        getBookingsAction(propId),
        getPropertiesAction(),
        getAvailableBedsAction(),
      ]);
      if (bookingsRes.success && bookingsRes.data)
        setBookings(bookingsRes.data);
      if (propsRes.success && propsRes.data) setProperties(propsRes.data);
      if (bedsRes.success && bedsRes.data) setAvailableBeds(bedsRes.data);
      setLoading(false);
    };
    void load();
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

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      b.customer?.name.toLowerCase().includes(query) ||
      b.customer?.contactNo.includes(query) ||
      b.customer?.email?.toLowerCase().includes(query) ||
      b.bed?.bedNumber.toLowerCase().includes(query) ||
      b.bed?.room?.roomNumber.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const activeCount = bookings.filter((b) => b.status === "ACTIVE").length;
  const completedCount = bookings.filter(
    (b) => b.status === "COMPLETED",
  ).length;

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
          >
            <Plus className="w-4 h-4 mr-1" />
            New Booking
          </Button>
        </div>
      </PageHeader>

      {/* Filter / Search Bar */}
      <Card className="bg-card border-border shadow-sm py-0">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tenant, phone, bed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Property Select */}
              <select
                value={selectedPropertyFilter}
                onChange={(e) => setSelectedPropertyFilter(e.target.value)}
                className="bg-background text-foreground border border-border rounded-lg text-xs px-2.5 py-1.5 h-9"
              >
                <option value="ALL">All Properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Status Filter Buttons */}
              <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    statusFilter === "ALL"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    statusFilter === "ACTIVE"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("COMPLETED")}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    statusFilter === "COMPLETED"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Past ({completedCount})
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                selectedPropertyFilter !== "ALL"
                  ? "No bookings match the selected filters. Try changing or resetting your search."
                  : "No tenant bookings have been created yet. Click below to add the first booking."}
              </p>
              <Button
                onClick={() => setShowNewBookingModal(true)}
                size="sm"
                className="mt-2 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Booking
              </Button>
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
                  bedNumber: booking.bed?.bedNumber,
                })
              }
              onCancel={(id) => setCancelTarget(id)}
            />
          ))
        )}
      </div>

      {/* Reusable New Booking Modal */}
      {showNewBookingModal && (
        <NewBookingModal
          isOpen={showNewBookingModal}
          properties={properties}
          initialAvailableBeds={availableBeds}
          onClose={() => setShowNewBookingModal(false)}
          onSuccess={refreshAll}
        />
      )}

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
