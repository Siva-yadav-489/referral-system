import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { BookingWithDetails } from "@/app/actions/booking/booking.types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface BookingStatsCardsProps {
  bookings: BookingWithDetails[];
  selectedMonth?: number | null;
  selectedYear?: number | null;
}

function isDateInPeriod(
  dateStr?: string | null,
  month?: number | null,
  year?: number | null,
) {
  if (!dateStr) return false;
  const part = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [parsedYear, parsedMonth] = part.split("-").map(Number);
  if (year != null && parsedYear !== year) return false;
  if (month != null && parsedMonth !== month) return false;
  return true;
}

export default function BookingStatsCards({
  bookings,
  selectedMonth,
  selectedYear,
}: BookingStatsCardsProps) {
  const monthName =
    selectedMonth != null
      ? (MONTHS[selectedMonth - 1] ?? "Selected Month")
      : null;

  const periodLabel =
    selectedMonth != null && selectedYear != null
      ? `${monthName} ${selectedYear}`
      : selectedYear != null
        ? String(selectedYear)
        : "all time";

  const checkInLabel =
    selectedMonth != null && monthName
      ? `Check Ins (${monthName})`
      : selectedYear != null
        ? `Check Ins (${selectedYear})`
        : "Check Ins";

  const checkOutLabel =
    selectedMonth != null && monthName
      ? `Check Outs (${monthName})`
      : selectedYear != null
        ? `Check Outs (${selectedYear})`
        : "Check Outs";

  const activeCount = bookings.filter((b) => b.status === "ACTIVE").length;
  const checkInsCount = bookings.filter((b) =>
    isDateInPeriod(b.startDate, selectedMonth, selectedYear),
  ).length;
  const checkOutsCount = bookings.filter((b) =>
    isDateInPeriod(b.endDate, selectedMonth, selectedYear),
  ).length;
  const totalBookings = bookings.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Card className="bg-card border-border shadow-xs">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs">Total Bookings</CardDescription>
          <CardTitle className="text-xl font-bold text-foreground">
            {totalBookings.toLocaleString("en-IN")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Matching current filters
        </CardContent>
      </Card>
      <Card className="bg-card border-border shadow-xs">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-amber-400">
            Active Bookings
          </CardDescription>
          <CardTitle className="text-xl font-bold text-amber-400">
            {activeCount.toLocaleString("en-IN")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Currently active
        </CardContent>
      </Card>
      <Card className="bg-card border-border shadow-xs">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-emerald-400">
            {checkInLabel}
          </CardDescription>
          <CardTitle className="text-xl font-bold text-emerald-400">
            {checkInsCount.toLocaleString("en-IN")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Check ins in {periodLabel}
        </CardContent>
      </Card>
      <Card className="bg-card border-border shadow-xs">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-red-400">
            {checkOutLabel}
          </CardDescription>
          <CardTitle className="text-xl font-bold text-red-400">
            {checkOutsCount.toLocaleString("en-IN")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Check outs in {periodLabel}
        </CardContent>
      </Card>
    </div>
  );
}
