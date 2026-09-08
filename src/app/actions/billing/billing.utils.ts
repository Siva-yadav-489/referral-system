import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";

export type BillingPeriod = {
  start: Date;
  end: Date;
  startString: string;
  endString: string;
};

export type BillingCalculation = {
  servicePeriodStart: Date;
  servicePeriodEnd: Date;
  servicePeriodStartString: string;
  servicePeriodEndString: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  billingPeriodStartString: string;
  billingPeriodEndString: string;
  billableDays: number;
  totalDaysInBillingPeriod: number;
  amount: number;
  isProrated: boolean;
};

/**
 * Returns the calendar billing period for a given date.
 *
 * Example:
 * 2026-08-15 -> Aug 1 to Aug 31
 */
export function getBillingPeriod(date: Date): BillingPeriod {
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  return {
    start,
    end,
    startString: format(start, "yyyy-MM-dd"),
    endString: format(end, "yyyy-MM-dd"),
  };
}

/**
 * Returns the previous calendar month.
 *
 * Example:
 * 2026-09-01 -> Aug 1 to Aug 31
 */
export function getPreviousBillingPeriod(
  date: Date = new Date(),
): BillingPeriod {
  const previousMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);

  return getBillingPeriod(previousMonth);
}

/**
 * Calculates the amount a booking owes for one billing period.
 *
 * Dates are inclusive.
 *
 * Example:
 *
 * Booking:
 * Aug 15 -> Aug 20
 *
 * Billing period:
 * Aug 1 -> Aug 31
 *
 * Service period:
 * Aug 15 -> Aug 20
 */
export function calculateBillingAmount({
  monthlyRate,
  bookingStartDate,
  bookingEndDate,
  billingPeriod,
}: {
  monthlyRate: number;
  bookingStartDate: Date;
  bookingEndDate: Date | null;
  billingPeriod: BillingPeriod;
}): BillingCalculation | null {
  /**
   * Actual service start is the later of:
   *
   * booking start
   * billing period start
   */
  const servicePeriodStart =
    bookingStartDate > billingPeriod.start
      ? bookingStartDate
      : billingPeriod.start;

  /**
   * Actual service end is the earlier of:
   *
   * booking end
   * billing period end
   */
  const servicePeriodEnd =
    bookingEndDate && bookingEndDate < billingPeriod.end
      ? bookingEndDate
      : billingPeriod.end;

  /**
   * Booking doesn't overlap this billing period.
   */
  if (servicePeriodStart > servicePeriodEnd) {
    return null;
  }

  /**
   * +1 because dates are inclusive.
   *
   * Aug 15 -> Aug 15 = 1 day
   * Aug 15 -> Aug 20 = 6 days
   */
  const billableDays =
    differenceInCalendarDays(servicePeriodEnd, servicePeriodStart) + 1;

  const totalDaysInBillingPeriod =
    differenceInCalendarDays(billingPeriod.end, billingPeriod.start) + 1;

  const dailyRate = monthlyRate / totalDaysInBillingPeriod;

  const amount = Number((dailyRate * billableDays).toFixed(2));

  const isProrated = billableDays !== totalDaysInBillingPeriod;

  return {
    servicePeriodStart,
    servicePeriodEnd,

    servicePeriodStartString: format(servicePeriodStart, "yyyy-MM-dd"),

    servicePeriodEndString: format(servicePeriodEnd, "yyyy-MM-dd"),

    billingPeriodStart: billingPeriod.start,
    billingPeriodEnd: billingPeriod.end,

    billingPeriodStartString: billingPeriod.startString,
    billingPeriodEndString: billingPeriod.endString,

    billableDays,
    totalDaysInBillingPeriod,
    amount,
    isProrated,
  };
}

export function getInvoiceDueDate(invoiceGenerationDate: Date): string {
  const year = invoiceGenerationDate.getFullYear();
  const month = invoiceGenerationDate.getMonth();

  return format(new Date(year, month, 5), "yyyy-MM-dd");
}

export function getBillingPeriodsBetween(
  startDate: Date,
  endDate: Date,
): BillingPeriod[] {
  const periods: BillingPeriod[] = [];

  let current = startOfMonth(startDate);
  const last = startOfMonth(endDate);

  while (current <= last) {
    periods.push(getBillingPeriod(current));

    current = addMonths(current, 1);
  }

  return periods;
}
