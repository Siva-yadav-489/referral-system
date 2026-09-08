"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Property } from "@/app/actions/property/property.types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_TABS = ["ALL", "PENDING", "PAID", "OVERDUE"] as const;

interface BillingFilterToolbarProps {
  properties: Property[];
  selectedMonth: number;
  selectedYear: number;
  useMonthFilter: boolean;
  statusFilter: string;
  propertyFilter: string;
  searchQuery: string;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onToggleMonthFilter: () => void;
  onStatusChange: (status: string) => void;
  onPropertyChange: (propertyId: string) => void;
  onSearchChange: (query: string) => void;
}

export function BillingFilterToolbar({
  properties,
  selectedMonth,
  selectedYear,
  useMonthFilter,
  statusFilter,
  propertyFilter,
  searchQuery,
  onMonthChange,
  onYearChange,
  onToggleMonthFilter,
  onStatusChange,
  onPropertyChange,
  onSearchChange,
}: BillingFilterToolbarProps) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Month / Year selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={onToggleMonthFilter}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              useMonthFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Filter by Month
          </button>

          {useMonthFilter && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="bg-background text-foreground border border-border rounded-lg px-2.5 py-1.5 text-xs"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="bg-background text-foreground border border-border rounded-lg px-2.5 py-1.5 text-xs"
              >
                {[2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search tenant or bed..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_TABS.map((st) => (
            <button
              key={st}
              onClick={() => onStatusChange(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Property Dropdown */}
        {properties.length > 1 && (
          <select
            value={propertyFilter}
            onChange={(e) => onPropertyChange(e.target.value)}
            className="bg-background text-foreground border border-border rounded-lg text-xs px-2.5 py-1"
          >
            <option value="ALL">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
