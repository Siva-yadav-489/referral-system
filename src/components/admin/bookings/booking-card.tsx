"use client";

import { BedSingle, Calendar, Loader2, LogOut, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingWithDetails } from "@/app/actions/booking/booking.types";

interface BookingCardProps {
  booking: BookingWithDetails;
  actionInProgressId: string | null;
  onExtend: (booking: BookingWithDetails) => void;
  onCheckout: (bookingId: string, customerName: string) => void | Promise<void>;
  onCancel: (bookingId: string) => void | Promise<void>;
}

export function BookingCard({
  booking: b,
  actionInProgressId,
  onExtend,
  onCheckout,
  onCancel,
}: BookingCardProps) {
  const isActive = b.status === "ACTIVE" || b.status === "EXTENDED";
  const isProcessing = actionInProgressId === b.id;

  return (
    <Card className="bg-card border-border hover:border-border/80 transition-colors shadow-sm">
      <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Tenant & Bed Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold text-foreground">
              {b.customer?.name}
            </span>
            <span className="text-sm text-muted-foreground">
              {b.property?.name}
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${
                b.status === "ACTIVE"
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : b.status === "EXTENDED"
                    ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                    : b.status === "COMPLETED"
                      ? "text-zinc-400 border-zinc-700 bg-zinc-800"
                      : "text-red-400 border-red-500/30 bg-red-500/10"
              }`}
            >
              {b.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BedSingle className="w-3.5 h-3.5 text-primary" />
              Bed {b.bed?.bedNumber || "N/A"} (Room{" "}
              {b.bed?.room?.roomNumber || "N/A"})
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              {b.customer?.contactNo}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Stay: {b.startDate} {b.endDate ? `to ${b.endDate}` : "(Ongoing)"}
            </span>
          </div>

          {(b.customer?.email || b.customer?.idProofNumber) && (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground/80">
              {b.customer?.email && <span>Email: {b.customer.email}</span>}
              {b.customer?.idProofNumber && (
                <span>ID: {b.customer.idProofNumber}</span>
              )}
            </div>
          )}
        </div>

        {/* Right: Rent & Actions */}
        <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-border/50">
          <div className="text-left md:text-right">
            <div className="text-xs text-muted-foreground">
              Agreed Monthly Rent
            </div>
            <div className="text-base font-bold text-foreground">
              ₹{Number(b.agreedMonthlyRent).toLocaleString("en-IN")}
            </div>
          </div>

          {isActive && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExtend(b)}
                className="text-xs h-8"
              >
                Extend
              </Button>

              <Button
                size="sm"
                variant="secondary"
                disabled={isProcessing}
                onClick={() => onCheckout(b.id, b.customer?.name ?? "Tenant")}
                className="text-xs h-8 text-amber-400 border border-amber-500/20 hover:bg-amber-500/10"
              >
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <LogOut className="w-3 h-3 mr-1" />
                )}
                Checkout
              </Button>

              <Button
                size="sm"
                variant="ghost"
                disabled={isProcessing}
                onClick={() => onCancel(b.id)}
                className="text-xs h-8 text-muted-foreground hover:text-destructive"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
