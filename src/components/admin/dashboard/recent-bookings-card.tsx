import Link from "next/link";
import { BedSingle, Building, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingWithDetails } from "@/app/actions/booking/booking.types";
import { format } from "date-fns";

interface RecentBookingsCardProps {
  bookings: BookingWithDetails[];
}

export function RecentBookingsCard({ bookings }: RecentBookingsCardProps) {
  return (
    <Card className="bg-card border-border gap-5">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold">Recent Bookings</CardTitle>
          <CardDescription className="text-xs font-semibold">
            Latest customer admissions and bed reservations
          </CardDescription>
        </div>
        <Link
          href="/admin/bookings"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "text-xs font-semibold",
          )}
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-muted/20">
            <BedSingle className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <h3 className="text-sm font-semibold text-foreground">
              No bookings yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              When a customer walks into your PG, assign them a vacant bed to
              start tracking.
            </p>
            <Link
              href="/admin/bookings"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4 text-xs",
              )}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Book a Bed
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="flex max-sm:flex-col max-sm:items-start max-sm:gap-2 items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {b.customer?.name || "Tenant"}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase pb-0 px-1.5 ${
                        b.status === "ACTIVE"
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : b.status === "EXTENDED"
                            ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                            : b.status === "CANCELLED"
                              ? "text-red-400 border-red-500/30 bg-red-500/10"
                              : "text-gray-400 border-border bg-gray-500/10"
                      }`}
                    >
                      {b.status}
                    </Badge>
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Building className="size-3.5" />{" "}
                      <span>{b.property.name}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <BedSingle className="size-3.5" />{" "}
                      <span> {b.bed?.bedNumber || "N/A"}</span>
                    </span>
                    <span>•</span>
                    <span>
                      ₹{Number(b.agreedMonthlyRent).toLocaleString("en-IN")}/mo
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs text-muted-foreground flex items-center gap-1">
                  {/* <Calendar className="w-3 h-3 " /> */}
                  <span>
                    {b.status == "ACTIVE"
                      ? `booked on ${
                          b.createdAt &&
                          format(b.createdAt, "dd/MM/yyyy hh:mm a")
                        }`
                      : b.status == "EXTENDED"
                        ? `extended on ${
                            b.updatedAt &&
                            format(b.updatedAt, "dd/MM/yyyy hh:mm a")
                          }`
                        : b.status == "CANCELLED"
                          ? `cancelled on ${
                              b.updatedAt &&
                              format(b.updatedAt, "dd/MM/yyyy hh:mm a")
                            }`
                          : `completed on ${
                              b.updatedAt &&
                              format(b.updatedAt, "dd/MM/yyyy hh:mm a")
                            }`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
