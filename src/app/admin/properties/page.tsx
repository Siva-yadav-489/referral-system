import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PropertyService } from "@/app/actions/property/property.service";
import { PropertiesOverview } from "@/components/admin/properties-overview";

export default async function AdminPropertiesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Directly fetch properties with calculated stats from the service layer on the server
  const propertiesRes = await PropertyService.getPropertiesWithStats(
    session.user.id,
  );

  const initialProperties = propertiesRes.success && propertiesRes.data
    ? propertiesRes.data
    : [];

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
      <PropertiesOverview initialProperties={initialProperties} />
    </div>
  );
}
