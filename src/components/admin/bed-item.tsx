"use client";

import {
  BedSingle,
  MoreHorizontal,
  Wrench,
  Trash2,
  BookmarkCheck,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bed } from "@/app/actions/property/property.types";

interface BedItemProps {
  bed: Bed;
  onToggleMaintenance: (bed: Bed) => void;
  onMarkVacant: (bed: Bed) => void;
  onDeleteBed: (bed: Bed) => void;
  onBookBed?: (bed: Bed) => void;
}

export function BedItem({
  bed,
  onToggleMaintenance,
  onMarkVacant,
  onDeleteBed,
  onBookBed,
}: BedItemProps) {
  const isOccupied = bed.status === "OCCUPIED";
  const isVacant = bed.status === "VACANT";
  const isMaintenance = bed.status === "MAINTENANCE";

  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
        isOccupied
          ? "bg-blue-500/10 border-blue-500/30 text-blue-400 dark:text-blue-300"
          : isVacant
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-300"
            : "bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <BedSingle className="w-3.5 h-3.5 shrink-0" />
        <span className="font-bold text-foreground">{bed.bedNumber}</span>
      </div>

      <Badge
        variant="outline"
        className={`text-[10px] px-2 pt-1 uppercase font-bold tracking-wider ${
          isOccupied
            ? "border-blue-500/30 bg-blue-500/15 text-blue-400 dark:text-blue-300"
            : isVacant
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-500 dark:text-emerald-300"
              : "border-amber-500/30 bg-amber-500/15 text-amber-500 dark:text-amber-300"
        }`}
      >
        {bed.status}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
          aria-label={`Options for Bed ${bed.bedNumber}`}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          {isVacant && (
            <>
              {onBookBed && (
                <DropdownMenuItem
                  onClick={() => onBookBed(bed)}
                  className="cursor-pointer text-xs py-1.5"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 mr-2 text-primary" />
                  <span>Book Bed</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => onToggleMaintenance(bed)}
                className="cursor-pointer text-xs py-1.5 text-amber-500 focus:text-amber-500"
              >
                <Wrench className="w-3.5 h-3.5 mr-2" />
                <span>Mark Maintenance</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDeleteBed(bed)}
                className="cursor-pointer text-xs py-1.5 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                <span>Delete Bed</span>
              </DropdownMenuItem>
            </>
          )}

          {isOccupied && (
            <DropdownMenuItem
              onClick={() => onMarkVacant(bed)}
              className="cursor-pointer text-xs text-emerald-500 focus:text-emerald-500"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
              <span>Mark as Vacant</span>
            </DropdownMenuItem>
          )}

          {isMaintenance && (
            <>
              <DropdownMenuItem
                onClick={() => onMarkVacant(bed)}
                className="cursor-pointer text-xs text-emerald-500 focus:text-emerald-500"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                <span>Mark as Vacant</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDeleteBed(bed)}
                className="cursor-pointer text-xs text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                <span>Delete Bed</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
