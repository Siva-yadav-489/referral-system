import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import {
  getInvoicesAction,
  getPropertiesAction,
} from "@/app/actions/admin-actions";
import { BillingClient } from "@/components/admin/billing/billing-client";

async function BillingContent() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [invoicesRes, propertiesRes] = await Promise.all([
    getInvoicesAction({ month: currentMonth, year: currentYear }),
    getPropertiesAction(),
  ]);

  const initialInvoices =
    invoicesRes.success && invoicesRes.data ? invoicesRes.data : [];
  const properties =
    propertiesRes.success && propertiesRes.data ? propertiesRes.data : [];

  return (
    <BillingClient
      initialInvoices={initialInvoices}
      properties={properties}
      initialMonth={currentMonth}
      initialYear={currentYear}
    />
  );
}

export default function AdminBillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading billing data...
            </p>
          </div>
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
