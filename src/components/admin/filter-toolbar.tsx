"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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

export interface FilterStatusOption {
  label: string;
  value: string;
  count?: number;
}

export type FilterStatusTab = string | FilterStatusOption;

export interface FilterToolbarProps {
  properties: {
    id: string;
    name: string;
  }[];
  selectedMonth: number;
  selectedYear: number;
  propertyFilter: string;
  searchQuery: string;
  searchPlaceholder?: string;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onPropertyChange: (propertyId: string) => void;
  onSearchChange: (query: string) => void;
}

export interface StatusFilterTabsProps {
  statusFilter: string;
  statusTabs?: FilterStatusTab[];
  statuses?: FilterStatusTab[];
  onStatusChange: (status: string) => void;
}

function normalizeTabs(rawTabs: FilterStatusTab[]): FilterStatusOption[] {
  return rawTabs.map((st) => {
    if (typeof st === "string") {
      const label =
        st === "NOT_INTERESTED" ? "NOT INTERESTED" : st.replace(/_/g, " ");
      return { label, value: st };
    }
    return st;
  });
}

export function FilterToolbar({
  properties,
  selectedMonth,
  selectedYear,
  propertyFilter,
  searchQuery,
  searchPlaceholder = "Search...",
  onMonthChange,
  onYearChange,
  onPropertyChange,
  onSearchChange,
}: FilterToolbarProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear + 1, currentYear + 2];
  if (selectedYear != null && !yearOptions.includes(selectedYear)) {
    yearOptions.push(selectedYear);
    yearOptions.sort((a, b) => a - b);
  }

  const yearEnabled = selectedYear != null;

  return (
    <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedYear}
            onChange={(e) => {
              const nextYear = Number(e.target.value);
              onYearChange(nextYear);
            }}
            className="bg-background text-foreground border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            disabled={!yearEnabled}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="bg-background text-foreground border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {MONTHS.map((month, idx) => (
              <option key={month} value={idx + 1}>
                {month}
              </option>
            ))}
          </select>

          {properties.length > 0 && (
            <select
              value={propertyFilter}
              onChange={(e) => onPropertyChange(e.target.value)}
              className="bg-background text-foreground border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 text-xs h-8 bg-background"
          />
        </div>
      </div>
    </div>
  );
}

export function StatusFilterTabs({
  statusFilter,
  statusTabs,
  statuses,
  onStatusChange,
}: StatusFilterTabsProps) {
  const normalizedTabs = normalizeTabs(statusTabs || statuses || []);
  if (normalizedTabs.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
      {normalizedTabs.map((tab) => (
        <button
          type="button"
          key={tab.value}
          onClick={() => onStatusChange(tab.value)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase transition-colors cursor-pointer whitespace-nowrap ${
            statusFilter === tab.value
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {tab.label}
          {typeof tab.count === "number" && (
            <span className="ml-1 opacity-75 text-[10px]">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
