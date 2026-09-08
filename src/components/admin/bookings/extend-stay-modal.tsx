"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingWithDetails } from "@/app/actions/booking/booking.types";

interface ExtendStayModalProps {
  booking: BookingWithDetails;
  newEndDate: string;
  isExtending: boolean;
  onEndDateChange: (date: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

export function ExtendStayModal({
  booking,
  newEndDate,
  isExtending,
  onEndDateChange,
  onSubmit,
  onClose,
}: ExtendStayModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-base font-bold text-foreground">Extend Stay</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Extending stay for{" "}
            <strong>{booking.customer?.name}</strong> (Bed{" "}
            {booking.bed?.bedNumber}).
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="newEnd" className="text-xs">
              New End Date *
            </Label>
            <Input
              id="newEnd"
              type="date"
              value={newEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isExtending}>
              {isExtending && (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              )}
              Confirm Extension
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
