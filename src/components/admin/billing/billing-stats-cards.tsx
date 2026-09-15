import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { InvoiceWithDetails } from "@/app/actions/billing/billing.types";

interface BillingStatsCardsProps {
  invoices: InvoiceWithDetails[];
}

export function BillingStatsCards({ invoices }: BillingStatsCardsProps) {
  let totalBilled = 0;
  let totalCollected = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  for (const inv of invoices) {
    const amt = Number(inv.amount) || 0;
    totalBilled += amt;
    if (inv.status === "PAID") totalCollected += amt;
    else if (inv.status === "PENDING") totalPending += amt;
    else if (inv.status === "OVERDUE") totalOverdue += amt;
  }

  const paidCount = invoices.filter((i) => i.status === "PAID").length;
  const pendingCount = invoices.filter((i) => i.status === "PENDING").length;
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Total Invoiced</CardDescription>
          <CardTitle className="text-xl font-bold text-foreground">
            ₹{totalBilled.toLocaleString("en-IN")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {invoices.length} invoices generated
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-emerald-400 font-medium">
            Collected (PAID)
          </CardDescription>
          <CardTitle className="text-xl font-bold text-emerald-400">
            ₹{totalCollected.toLocaleString("en-IN")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {paidCount} invoices cleared
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-amber-400 font-medium">
            Pending / Due
          </CardDescription>
          <CardTitle className="text-xl font-bold text-amber-400">
            ₹{totalPending.toLocaleString("en-IN")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {pendingCount} pending payments
        </CardContent>
      </Card>
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-red-400 font-medium">
            Overdue
          </CardDescription>
          <CardTitle className="text-xl font-bold text-red-400">
            ₹{totalOverdue.toLocaleString("en-IN")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {overdueCount} overdue invoices
        </CardContent>
      </Card>
    </div>
  );
}
