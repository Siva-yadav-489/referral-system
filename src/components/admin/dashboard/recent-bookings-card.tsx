import Link from "next/link";
import { BedSingle, Calendar, Plus } from "lucide-react";
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

interface RecentBookingsCardProps {
  bookings: BookingWithDetails[];
}

export function RecentBookingsCard({ bookings }: RecentBookingsCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold">Recent Bookings</CardTitle>
          <CardDescription className="text-xs">
            Latest customer admissions and bed reservations
          </CardDescription>
        </div>
        <Link
          href="/admin/bookings"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-xs h-8",
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
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {b.customer?.name || "Tenant"}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase ${
                        b.status === "ACTIVE"
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : b.status === "EXTENDED"
                            ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                            : "text-muted-foreground border-border bg-muted"
                      }`}
                    >
                      {b.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Bed {b.bed?.bedNumber || "N/A"}</span>
                    <span>•</span>
                    <span>
                      ₹{Number(b.agreedMonthlyRent).toLocaleString("en-IN")}/mo
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>From {b.startDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
