import { SiteHeader } from "@/components/site-header";
import { ReferralsView } from "@/components/referrals-view";

export default function ReferralsPage() {
  return (
    <>
      <SiteHeader title="Referrals" />
      <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
        <ReferralsView />
      </div>
    </>
  );
}
