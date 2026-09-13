import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import {
  getPropertiesAction,
  getReferralLeadsAction,
} from "@/app/actions/admin-actions";
import { ReferralsClient } from "@/components/admin/referrals/referrals-client";

async function ReferralsContent() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [referralsRes, propertiesRes] = await Promise.all([
    getReferralLeadsAction(),
    getPropertiesAction(),
  ]);

  const initialReferralLeads =
    referralsRes.success && referralsRes.data ? referralsRes.data : [];
  const properties =
    propertiesRes.success && propertiesRes.data ? propertiesRes.data : [];

  return (
    <ReferralsClient
      initialReferralLeads={initialReferralLeads}
      properties={properties}
      initialMonth={currentMonth}
      initialYear={currentYear}
    />
  );
}

export default function AdminReferralsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading referrals...</p>
          </div>
        </div>
      }
    >
      <ReferralsContent />
    </Suspense>
  );
}
