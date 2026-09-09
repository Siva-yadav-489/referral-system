"use client";

import { MoreHorizontal, Plus, CopyPlus, Trash2, DoorOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoomCard } from "./room-card";
import { Floor, Room, Bed } from "@/app/actions/property/property.types";

interface FloorWithRooms extends Floor {
  rooms: (Room & { beds: Bed[] })[];
}

interface FloorRowProps {
  floor: FloorWithRooms;
  onAddRoom: (floor: FloorWithRooms) => void;
  onAddRoomsBulk: (floor: FloorWithRooms) => void;
  onDeleteFloor: (floor: FloorWithRooms) => void;
  onEditRoom: (room: Room & { beds: Bed[] }) => void;
  onDeleteRoom: (room: Room & { beds: Bed[] }) => void;
  onToggleMaintenance: (bed: Bed) => void;
  onMarkVacant: (bed: Bed) => void;
  onDeleteBed: (bed: Bed) => void;
  onBookBed?: (bed: Bed) => void;
}

export function FloorRow({
  floor,
  onAddRoom,
  onAddRoomsBulk,
  onDeleteFloor,
  onEditRoom,
  onDeleteRoom,
  onToggleMaintenance,
  onMarkVacant,
  onDeleteBed,
  onBookBed,
}: FloorRowProps) {
  const roomsCount = floor.rooms?.length || 0;
  const bedsCount =
    floor.rooms?.reduce((acc, r) => acc + (r.beds?.length || 0), 0) || 0;

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden py-0">
      {/* Floor Row Header */}
      <CardHeader className="p-4 bg-muted/25 border-b border-border/60 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-bold text-foreground">
            Floor {floor.floorNumber}
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {roomsCount} {roomsCount === 1 ? "Room" : "Rooms"}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {bedsCount} {bedsCount === 1 ? "Bed" : "Beds"}
          </Badge>
        </div>

        {/* 3-dots options menu for Floor */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
            aria-label={`Options for Floor ${floor.floorNumber}`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => onAddRoom(floor)}
              className="cursor-pointer text-xs py-2"
            >
              <Plus className="w-3.5 h-3.5 mr-2 text-primary" />
              <span>Add Room</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onAddRoomsBulk(floor)}
              className="cursor-pointer text-xs py-2"
            >
              <CopyPlus className="w-3.5 h-3.5 mr-2 text-primary" />
              <span>Add Rooms (Bulk)</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onDeleteFloor(floor)}
              className="cursor-pointer text-xs py-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              <span>Delete Floor</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {/* Floor Body: Grid of Rooms */}
      <CardContent className="p-4 sm:p-5">
        {roomsCount === 0 ? (
          <div className="py-8 text-center border border-dashed border-border/70 rounded-xl bg-muted/10 space-y-2.5">
            <DoorOpen className="w-7 h-7 text-muted-foreground/40 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                No rooms on Floor {floor.floorNumber}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                Add single or multiple rooms in bulk to begin accepting bookings
                on this floor.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddRoom(floor)}
                className="text-xs h-8 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Room
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddRoomsBulk(floor)}
                className="text-xs h-8 cursor-pointer"
              >
                <CopyPlus className="w-3.5 h-3.5 mr-1" />
                Add Rooms in Bulk
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {floor.rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onEditRoom={onEditRoom}
                onDeleteRoom={onDeleteRoom}
                onToggleMaintenance={onToggleMaintenance}
                onMarkVacant={onMarkVacant}
                onDeleteBed={onDeleteBed}
                onBookBed={onBookBed}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
