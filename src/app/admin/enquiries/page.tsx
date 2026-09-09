import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import {
  getEnquiriesAction,
  getPropertiesAction,
} from "@/app/actions/admin-actions";
import { EnquiriesClient } from "@/components/admin/enquiries/enquiries-client";

async function EnquiriesContent() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [enquiriesRes, propertiesRes] = await Promise.all([
    getEnquiriesAction(),
    getPropertiesAction(),
  ]);

  const initialEnquiries =
    enquiriesRes.success && enquiriesRes.data ? enquiriesRes.data : [];
  const properties =
    propertiesRes.success && propertiesRes.data ? propertiesRes.data : [];

  return (
    <EnquiriesClient
      initialEnquiries={initialEnquiries}
      properties={properties}
      initialMonth={currentMonth}
      initialYear={currentYear}
    />
  );
}

export default function AdminEnquiriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading enquiries...
            </p>
          </div>
        </div>
      }
    >
      <EnquiriesContent />
    </Suspense>
  );
}
