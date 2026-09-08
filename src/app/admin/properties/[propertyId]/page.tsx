import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { PropertyService } from "@/app/actions/property/property.service";
import { BookingService } from "@/app/actions/booking/booking.service";
import { PropertyDetailView } from "@/components/admin/property-detail-view";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { propertyId } = await params;

  // Directly fetch detailed property hierarchy and active bookings on the server
  const [propRes, bookingsRes] = await Promise.all([
    PropertyService.getPropertyDetails(session.user.id, propertyId),
    BookingService.getActiveBookings(session.user.id, propertyId),
  ]);

  if (!propRes.success || !propRes.data) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
      <PropertyDetailView
        initialProperty={propRes.data}
        initialActiveBookings={
          bookingsRes.success && bookingsRes.data ? bookingsRes.data : []
        }
      />
    </div>
  );
}
