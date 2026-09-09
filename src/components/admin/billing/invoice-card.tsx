"use client";

import {
  Bed,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Phone,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvoiceWithDetails } from "@/app/actions/billing/billing.types";
import { format } from "date-fns";

interface InvoiceCardProps {
  invoice: InvoiceWithDetails;
  updatingId: string | null;
  onUpdateStatus: (
    id: string,
    status: "PENDING" | "PAID" | "OVERDUE",
  ) => Promise<void>;
}

export function InvoiceCard({
  invoice: inv,
  updatingId,
  onUpdateStatus,
}: InvoiceCardProps) {
  const isUpdating = updatingId === inv.id;

  return (
    <Card className="bg-card border-border hover:border-border/80 transition-colors shadow-sm py-0">
      <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Tenant & Period details */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {inv.booking?.customer?.name || "Tenant"}
            </span>

            <Badge
              variant="outline"
              className={`text-xs ${
                inv.status === "PAID"
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : inv.status === "OVERDUE"
                    ? "text-red-400 border-red-500/30 bg-red-500/10"
                    : inv.status === "PENDING"
                      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                      : "text-zinc-400 border-zinc-700 bg-zinc-800"
              }`}
            >
              {inv.status}
            </Badge>
            {inv.isProrated && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Prorated Cycle
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                {inv.booking.property?.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-primary" />
                Bed {inv.booking?.bed?.bedNumber || "N/A"}
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              {inv.booking?.customer?.contactNo || ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {format(inv.servicePeriodStart, "dd/MM/yyyy")} -{" "}
              {format(inv.servicePeriodEnd, "dd/MM/yyyy")} ({inv.billableDays}{" "}
              {inv.billableDays === 1 ? `day` : `days`})
            </span>
            <span className="flex items-center gap-1.5 ">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {inv.status === "PAID"
                ? `Paid on ${format(inv.updatedAt, "dd/MM/yyyy hh:mm a")}`
                : `Due on ${format(inv.dueDate, "dd/MM/yyyy hh:mm a")}`}
            </span>
          </div>
        </div>

        {/* Right: Amount & Status Actions */}
        <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-border/50">
          <div className="text-left md:text-right">
            <div className="text-xs text-muted-foreground">Amount</div>
            <div className="text-lg font-bold text-foreground">
              ₹{Number(inv.amount).toLocaleString("en-IN")}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {inv.status !== "PAID" && (
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(inv.id, "PAID")}
                className="text-xs h-8 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                )}
                Mark Paid
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
