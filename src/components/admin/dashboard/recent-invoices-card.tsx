"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Receipt, CheckCircle2, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InvoiceWithDetails } from "@/app/actions/billing/billing.types";
import { updateInvoiceStatusAction } from "@/app/actions/admin-actions";

interface RecentInvoicesCardProps {
  initialInvoices: InvoiceWithDetails[];
}

export function RecentInvoicesCard({
  initialInvoices,
}: RecentInvoicesCardProps) {
  const [invoices, setInvoices] =
    useState<InvoiceWithDetails[]>(initialInvoices);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(
    null,
  );

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      setUpdatingInvoiceId(invoiceId);
      const res = await updateInvoiceStatusAction(invoiceId, {
        status: "PAID",
      });
      if (res.success) {
        toast.success("Payment recorded! Invoice marked as PAID.");
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceId ? { ...inv, status: "PAID" } : inv,
          ),
        );
      } else {
        toast.error(res.error || "Failed to update invoice");
      }
    } catch {
      toast.error("Failed to update invoice");
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold">
            Invoices &amp; Rent Due
          </CardTitle>
          <CardDescription className="text-xs">
            Monthly bills due by the 5th awaiting payment confirmation
          </CardDescription>
        </div>
        <Link
          href="/admin/billing"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-xs h-8",
          )}
        >
          View ledger
        </Link>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-muted/20">
            <Receipt className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <h3 className="text-sm font-semibold text-foreground">
              No invoices yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Invoices are generated upon booking and automatically on the 1st
              of each month.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {inv.booking?.customer?.name || "Customer"}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        inv.status === "PAID"
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : inv.status === "OVERDUE"
                            ? "text-red-400 border-red-500/30 bg-red-500/10"
                            : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                      }`}
                    >
                      {inv.status}
                    </Badge>
                    {inv.isProrated && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        Prorated
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Period: {inv.billingPeriodStart} to {inv.billingPeriodEnd} •
                    Due: {inv.dueDate}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">
                      ₹{Number(inv.amount).toLocaleString("en-IN")}
                    </div>
                  </div>

                  {inv.status !== "PAID" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingInvoiceId === inv.id}
                      onClick={() => handleMarkPaid(inv.id)}
                      className="h-8 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                    >
                      {updatingInvoiceId === inv.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      )}
                      Mark Paid
                    </Button>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
