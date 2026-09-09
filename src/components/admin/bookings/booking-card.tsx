"use client";

import {
  BedSingle,
  Building2,
  Calendar,
  LogOut,
  MoreVertical,
  Phone,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingWithDetails } from "@/app/actions/booking/booking.types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { format } from "date-fns";

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
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: "destructive" | "default";
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
  });

  const promptCheckout = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Checkout Booking",
      description: "Are you sure you want to checkout this booking?",
      confirmText: "Checkout",
      variant: "default",
      action: async () => {
        await onCheckout(b.id, b.customer?.name ?? "Tenant");
      },
    });
  };

  const promptCancelBooking = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Cancel Booking",
      description: "Are you sure you want to cancel this booking?",
      confirmText: "Cancel",
      variant: "destructive",
      action: async () => {
        await onCancel(b.id);
      },
    });
  };

  return (
    <Card className="bg-card border-border hover:border-border/80 transition-colors shadow-sm py-0">
      <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Tenant & Bed Details */}
        <div className="space-y-2">
          <div className="flex max-sm:flex-col max-sm:items-start items-center gap-2">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-primary" />
              <span className="text-base font-bold text-foreground">
                {b.customer?.name}
              </span>
            </div>

            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              {b.customer?.contactNo}
            </span>
            <Badge
              variant="outline"
              className={`text-xs pt-1 ${
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
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                {b.property?.name}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <BedSingle className="w-3.5 h-3.5 text-primary" />
              Bed {b.bed?.bedNumber || "N/A"} (Room{" "}
              {b.bed?.room?.roomNumber || "N/A"})
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              From {format(b.startDate, "dd/MM/yyyy")}{" "}
              {b.endDate
                ? `to ${format(b.endDate, "dd/MM/yyyy")}`
                : "(Ongoing)"}
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
            <DropdownMenu>
              <DropdownMenuTrigger
                className="p-1 text-foreground cursor-pointer"
                aria-label="Booking Options"
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => onExtend(b)}
                  disabled={isProcessing}
                  className="cursor-pointer text-xs py-1.5"
                >
                  Extend
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={promptCheckout}
                  disabled={isProcessing}
                  className="cursor-pointer text-xs py-1.5"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  <span>Checkout</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={promptCancelBooking}
                  disabled={isProcessing}
                  className="cursor-pointer text-xs py-1.5 text-destructive focus:text-destructive"
                >
                  Cancel Booking
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Confirmation Dialog */}
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            description={confirmDialog.description}
            confirmText={confirmDialog.confirmText}
            variant={confirmDialog.variant}
            isLoading={confirmLoading}
            onClose={() =>
              setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
            }
            onConfirm={async () => {
              try {
                setConfirmLoading(true);
                await confirmDialog.action();
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
              } finally {
                setConfirmLoading(false);
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
