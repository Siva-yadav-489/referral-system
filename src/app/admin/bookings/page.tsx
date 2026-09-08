import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import {
  getBookingsAction,
  getPropertiesAction,
  getAvailableBedsAction,
} from "@/app/actions/admin-actions";
import { BookingsClient } from "@/components/admin/bookings/bookings-client";

async function BookingsContent() {
  const [bookingsRes, propertiesRes, bedsRes] = await Promise.all([
    getBookingsAction(),
    getPropertiesAction(),
    getAvailableBedsAction(),
  ]);

  const initialBookings =
    bookingsRes.success && bookingsRes.data ? bookingsRes.data : [];
  const initialProperties =
    propertiesRes.success && propertiesRes.data ? propertiesRes.data : [];
  const initialAvailableBeds =
    bedsRes.success && bedsRes.data ? bedsRes.data : [];

  return (
    <BookingsClient
      initialBookings={initialBookings}
      initialProperties={initialProperties}
      initialAvailableBeds={initialAvailableBeds}
    />
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading bookings data...
            </p>
          </div>
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}
