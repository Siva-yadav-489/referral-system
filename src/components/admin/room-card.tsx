"use client";

import * as React from "react";
import { DoorOpen, MoreHorizontal, Edit3, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BedItem } from "./bed-item";
import { Room, Bed } from "@/app/actions/property/property.types";

interface RoomWithBeds extends Room {
  beds: Bed[];
}

interface RoomCardProps {
  room: RoomWithBeds;
  onEditRoom: (room: RoomWithBeds) => void;
  onDeleteRoom: (room: RoomWithBeds) => void;
  onToggleMaintenance: (bed: Bed) => void;
  onMarkVacant: (bed: Bed) => void;
  onDeleteBed: (bed: Bed) => void;
  onBookBed?: (bed: Bed) => void;
}

export function RoomCard({
  room,
  onEditRoom,
  onDeleteRoom,
  onToggleMaintenance,
  onMarkVacant,
  onDeleteBed,
  onBookBed,
}: RoomCardProps) {
  const occupiedCount = room.beds?.filter((b) => b.status === "OCCUPIED").length || 0;
  const totalBeds = room.beds?.length || 0;

  return (
    <div className="p-4 rounded-xl border border-border/80 bg-card hover:border-border transition-colors space-y-3 shadow-xs">
      {/* Room Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <DoorOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-foreground">
                Room {room.roomNumber}
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                {room.type}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {occupiedCount}/{totalBeds} beds occupied
            </p>
          </div>
        </div>

        {/* 3-dots options menu for Room */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
            aria-label={`Options for Room ${room.roomNumber}`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => onEditRoom(room)}
              className="cursor-pointer text-xs"
            >
              <Edit3 className="w-3.5 h-3.5 mr-2" />
              <span>Edit Room</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onDeleteRoom(room)}
              className="cursor-pointer text-xs text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              <span>Delete Room</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Beds Section: Beds presented in rows */}
      <div className="space-y-1.5 pt-2 border-t border-border/60">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Beds ({totalBeds}/{room.capacity})
        </div>

        {totalBeds === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            No beds configured in this room.
          </p>
        ) : (
          <div className="space-y-1.5">
            {room.beds.map((bed) => (
              <BedItem
                key={bed.id}
                bed={bed}
                onToggleMaintenance={onToggleMaintenance}
                onMarkVacant={onMarkVacant}
                onDeleteBed={onDeleteBed}
                onBookBed={onBookBed}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
