"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  MoreVertical,
  Loader2,
  Layers,
  Phone,
  DoorOpen,
  BedSingle,
  X,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "./page-header";
import { FloorRow } from "./floor-row";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  PropertyWithStructure,
  Floor,
  Room,
  Bed,
} from "@/app/actions/property/property.types";
import {
  addFloorAction,
  deleteFloorAction,
  addRoomAction,
  addRoomsBulkAction,
  updateRoomTypeAction,
  deleteRoomAction,
  updateBedStatusAction,
  deletePropertyAction,
  getPropertyDetailsAction,
  getActiveBookingsAction,
} from "@/app/actions/admin-actions";
import { BookingWithDetails } from "@/app/actions/booking/booking.types";
import { NewBookingModal } from "./bookings/new-booking-modal";
import {
  CheckoutTenantDialog,
  CheckoutTenantTarget,
} from "./bookings/checkout-tenant-dialog";
import { format } from "date-fns";

interface PropertyDetailViewProps {
  initialProperty: PropertyWithStructure;
  initialActiveBookings?: BookingWithDetails[];
}

export function PropertyDetailView({
  initialProperty,
  initialActiveBookings = [],
}: PropertyDetailViewProps) {
  const router = useRouter();
  const [property, setProperty] =
    useState<PropertyWithStructure>(initialProperty);

  // Top action loading
  const [addingFloor, setAddingFloor] = useState(false);

  // Single Add Room Modal state
  const [addRoomFloor, setAddRoomFloor] = useState<Floor | null>(null);
  const [singleRoomData, setSingleRoomData] = useState({
    roomNumber: "",
    type: "2-Sharing" as "2-Sharing" | "3-Sharing",
    capacity: 2,
  });
  const [addingRoomLoading, setAddingRoomLoading] = useState(false);

  // Bulk Add Rooms Modal state
  const [bulkFloor, setBulkFloor] = useState<Floor | null>(null);
  const [bulkRoomCounts, setBulkRoomCounts] = useState({
    twoSharingCount: 2,
    threeSharingCount: 1,
  });
  const [bulkAddingLoading, setBulkAddingLoading] = useState(false);

  // Edit Room Modal state
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingRoomData, setEditingRoomData] = useState({
    roomNumber: "",
    type: "2-Sharing" as "2-Sharing" | "3-Sharing",
  });
  const [updatingRoomLoading, setUpdatingRoomLoading] = useState(false);

  // Generic Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: "destructive" | "default";
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Floor choice modal state
  const [floorChoiceOpen, setFloorChoiceOpen] = useState(false);
  const [floorChoiceMode, setFloorChoiceMode] = useState<"next" | "specific">(
    "next",
  );
  const [selectedFloorNumber, setSelectedFloorNumber] = useState<number | null>(
    null,
  );

  // Room position mode state
  const [roomPositionMode, setRoomPositionMode] = useState<"next" | "specific">(
    "next",
  );
  const [selectedRoomPosition, setSelectedRoomPosition] = useState<
    number | null
  >(null);

  // Active bookings & booking modal state
  const [activeBookings, setActiveBookings] = useState<BookingWithDetails[]>(
    initialActiveBookings,
  );
  const [checkoutTarget, setCheckoutTarget] =
    useState<CheckoutTenantTarget | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingTargetBedId, setBookingTargetBedId] = useState<string | null>(
    null,
  );

  // Reload fresh structure & active bookings
  const reloadPropertyDetails = async () => {
    const [propRes, bookingsRes] = await Promise.all([
      getPropertyDetailsAction(property.id),
      getActiveBookingsAction(property.id),
    ]);
    if (propRes.success && propRes.data) {
      setProperty(propRes.data);
    }
    if (bookingsRes.success && bookingsRes.data) {
      setActiveBookings(bookingsRes.data);
    }
  };

  // ─── Friendly error helper ────────────────────────────────────────────────
  const friendlyError = (raw: string | undefined, fallback: string): string => {
    if (!raw) return fallback;
    const lower = raw.toLowerCase();
    if (
      lower.includes("unique") ||
      lower.includes("duplicate key") ||
      lower.includes("unique_floor_room") ||
      lower.includes("already exists")
    ) {
      return "This entry already exists. Please choose a different number.";
    }
    if (lower.includes("unauthorized"))
      return "You are not authorized to perform this action.";
    if (lower.includes("not found"))
      return "The requested item could not be found.";
    if (/error:|sqlstate|drizzle|pg_|23505|23000/.test(lower)) return fallback;
    return raw;
  };

  const getAvailableFloorNumbers = (): number[] => {
    const used = new Set((property.floors ?? []).map((f) => f.floorNumber));
    return Array.from({ length: 7 }, (_, i) => i + 1).filter(
      (n) => !used.has(n),
    );
  };

  // ─── Room helpers ─────────────────────────────────────────────────────────
  const getRoomSuffix = (
    floorNumber: number,
    roomNumber: string,
  ): number | null => {
    const trimmed = roomNumber.trim();
    const floorPrefix = String(floorNumber);
    if (trimmed.startsWith(floorPrefix)) {
      const rest = trimmed.slice(floorPrefix.length);
      const match = rest.match(/^(\d+)/);
      if (match) {
        const suffix = parseInt(match[1]);
        return isNaN(suffix) ? null : suffix;
      }
    }
    const match = trimmed.match(/(\d{1,2})$/);
    return match ? parseInt(match[1]) : null;
  };

  const getNextRoomNumber = (floor: Floor): string | null => {
    const floorNum = floor.floorNumber;
    const existingRooms =
      property.floors?.find((f) => f.id === floor.id)?.rooms ?? [];
    const usedSuffixes = new Set(
      existingRooms
        .map((r) => getRoomSuffix(floorNum, r.roomNumber))
        .filter((v): v is number => v !== null),
    );
    for (let i = 1; i <= 10; i++) {
      if (!usedSuffixes.has(i)) {
        return `${floorNum}${String(i).padStart(2, "0")}`;
      }
    }
    return null;
  };

  const getAvailableRoomPositions = (floor: Floor): number[] => {
    const floorNum = floor.floorNumber;
    const existingRooms =
      property.floors?.find((f) => f.id === floor.id)?.rooms ?? [];
    const usedSuffixes = new Set(
      existingRooms
        .map((r) => getRoomSuffix(floorNum, r.roomNumber))
        .filter((v): v is number => v !== null),
    );
    return Array.from({ length: 10 }, (_, i) => i + 1).filter(
      (n) => !usedSuffixes.has(n),
    );
  };

  // 1. Open Add Floor Modal
  const handleOpenAddFloor = () => {
    const available = getAvailableFloorNumbers();
    if (available.length === 0) {
      toast.error(
        "Maximum of 7 floors reached. Delete an existing floor to add a new one.",
      );
      return;
    }
    setFloorChoiceMode("next");
    setSelectedFloorNumber(available[0]);
    setFloorChoiceOpen(true);
  };

  // 1b. Actually add the floor (called from floor choice modal)
  const handleAddFloor = async (floorNumber: number) => {
    // Client-side duplicate guard
    const alreadyExists = (property.floors ?? []).some(
      (f) => f.floorNumber === floorNumber,
    );
    if (alreadyExists) {
      toast.error(`Floor ${floorNumber} already exists on this property.`);
      return;
    }

    try {
      setAddingFloor(true);
      const res = await addFloorAction({
        propertyId: property.id,
        floorNumber,
      });

      if (res.success) {
        toast.success(`Floor ${floorNumber} added successfully.`);
        setFloorChoiceOpen(false);
        await reloadPropertyDetails();
      } else {
        toast.error(
          friendlyError(res.error, "Unable to add floor. Please try again."),
        );
      }
    } catch {
      toast.error("Unable to add floor. Please try again.");
    } finally {
      setAddingFloor(false);
    }
  };

  // 2. Delete Property
  const promptDeleteProperty = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Property",
      description: `Are you sure you want to delete "${property.name}"? This action cannot be undone and will delete all associated floors, rooms, and beds.`,
      confirmText: "Delete Property",
      variant: "destructive",
      action: async () => {
        const res = await deletePropertyAction(property.id);
        if (res.success) {
          toast.success("Property deleted successfully");
          router.push("/admin/properties");
        } else {
          toast.error(
            friendlyError(
              res.error,
              "Failed to delete property. Please try again.",
            ),
          );
        }
      },
    });
  };

  // 3. Delete Floor
  const promptDeleteFloor = (floor: Floor) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Floor ${floor.floorNumber}`,
      description: `Are you sure you want to delete Floor ${floor.floorNumber}? All rooms and beds located on this floor will also be permanently removed.`,
      confirmText: "Delete Floor",
      variant: "destructive",
      action: async () => {
        const res = await deleteFloorAction(floor.id);
        if (res.success) {
          toast.success(`Floor ${floor.floorNumber} deleted`);
          await reloadPropertyDetails();
        } else {
          toast.error(
            friendlyError(
              res.error,
              "Failed to delete floor. Please try again.",
            ),
          );
        }
      },
    });
  };

  // 4. Open Single Add Room Modal
  const handleOpenAddRoom = (floor: Floor) => {
    const existingRoomsCount =
      property.floors?.find((f) => f.id === floor.id)?.rooms?.length || 0;
    if (existingRoomsCount >= 10) {
      toast.error(
        "Maximum of 10 rooms per floor reached. Delete a room to add a new one.",
      );
      return;
    }
    // Gap-aware: find the lowest unused room slot
    const nextRoomNum = getNextRoomNumber(floor);
    setRoomPositionMode("next");
    setSelectedRoomPosition(null);
    setSingleRoomData({
      roomNumber: nextRoomNum || `${floor.floorNumber}01`,
      type: "2-Sharing",
      capacity: 2,
    });
    setAddRoomFloor(floor);
  };

  const handleSingleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addRoomFloor || !singleRoomData.roomNumber.trim()) return;

    // Client-side duplicate guard
    const floorRooms =
      property.floors?.find((f) => f.id === addRoomFloor.id)?.rooms ?? [];
    const roomAlreadyExists = floorRooms.some(
      (r) =>
        r.roomNumber.trim().toLowerCase() ===
        singleRoomData.roomNumber.trim().toLowerCase(),
    );
    if (roomAlreadyExists) {
      toast.error(
        `Room ${singleRoomData.roomNumber} already exists on Floor ${addRoomFloor.floorNumber}.`,
      );
      return;
    }

    try {
      setAddingRoomLoading(true);
      const res = await addRoomAction({
        propertyId: property.id,
        floorId: addRoomFloor.id,
        roomNumber: singleRoomData.roomNumber.trim(),
        type: singleRoomData.type,
        capacity: singleRoomData.capacity,
      });

      if (res.success) {
        toast.success(
          `Room ${singleRoomData.roomNumber} added with ${singleRoomData.capacity} beds.`,
        );
        setAddRoomFloor(null);
        await reloadPropertyDetails();
      } else {
        toast.error(
          friendlyError(res.error, "Unable to create room. Please try again."),
        );
      }
    } catch {
      toast.error("Unable to create room. Please try again.");
    } finally {
      setAddingRoomLoading(false);
    }
  };

  // 5. Open Bulk Add Rooms Modal
  const handleOpenAddRoomsBulk = (floor: Floor) => {
    const existingRoomsCount =
      property.floors?.find((f) => f.id === floor.id)?.rooms?.length || 0;
    if (existingRoomsCount >= 10) {
      toast.error(
        "Maximum of 10 rooms per floor reached. Delete a room to add a new one.",
      );
      return;
    }
    const remaining = 10 - existingRoomsCount;
    setBulkRoomCounts({
      twoSharingCount: Math.min(2, remaining),
      threeSharingCount: Math.min(
        1,
        Math.max(0, remaining - Math.min(2, remaining)),
      ),
    });
    setBulkFloor(floor);
  };

  const handleBulkAddRoomsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFloor) return;
    const total =
      (bulkRoomCounts.twoSharingCount || 0) +
      (bulkRoomCounts.threeSharingCount || 0);
    if (total <= 0) {
      toast.error("Please enter at least 1 room to create.");
      return;
    }

    const existingRoomsCount =
      property.floors?.find((f) => f.id === bulkFloor.id)?.rooms?.length || 0;
    if (existingRoomsCount + total > 10) {
      toast.error(
        `Floor ${bulkFloor.floorNumber} only has ${10 - existingRoomsCount} slot(s) remaining. Reduce the room count.`,
      );
      return;
    }

    try {
      setBulkAddingLoading(true);
      const res = await addRoomsBulkAction({
        propertyId: property.id,
        floorId: bulkFloor.id,
        twoSharingCount: Number(bulkRoomCounts.twoSharingCount) || 0,
        threeSharingCount: Number(bulkRoomCounts.threeSharingCount) || 0,
      });

      if (res.success) {
        toast.success(
          `${total} room${total > 1 ? "s" : ""} added on Floor ${bulkFloor.floorNumber}.`,
        );
        setBulkFloor(null);
        await reloadPropertyDetails();
      } else {
        toast.error(
          friendlyError(res.error, "Unable to create rooms. Please try again."),
        );
      }
    } catch {
      toast.error("Unable to create rooms. Please try again.");
    } finally {
      setBulkAddingLoading(false);
    }
  };

  // 6. Edit Room Modal
  const handleOpenEditRoom = (room: Room) => {
    setEditingRoom(room);
    setEditingRoomData({
      roomNumber: room.roomNumber,
      type: room.type,
    });
  };

  const handleEditRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !editingRoomData.roomNumber.trim()) return;
    if (editingRoomData.type === editingRoom.type) {
      toast.error("Type is already the same.");
      return;
    }

    try {
      setUpdatingRoomLoading(true);
      const res = await updateRoomTypeAction(
        editingRoom.id,
        editingRoomData.type,
      );

      if (res.success) {
        toast.success("Room updated successfully.");
        setEditingRoom(null);
        await reloadPropertyDetails();
      } else {
        toast.error(
          friendlyError(res.error, "Unable to update room. Please try again."),
        );
      }
    } catch {
      toast.error("Unable to update room. Please try again.");
    } finally {
      setUpdatingRoomLoading(false);
    }
  };

  // 7. Delete Room
  const promptDeleteRoom = (room: Room) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Room ${room.roomNumber}`,
      description: `Are you sure you want to delete Room ${room.roomNumber}? This will also delete all beds in this room.`,
      confirmText: "Delete Room",
      variant: "destructive",
      action: async () => {
        const res = await deleteRoomAction(room.id);
        if (res.success) {
          toast.success(`Room ${room.roomNumber} deleted`);
          await reloadPropertyDetails();
        } else {
          toast.error(
            friendlyError(
              res.error,
              "Failed to delete room. Please try again.",
            ),
          );
        }
      },
    });
  };

  // 8. Bed: Toggle Maintenance
  const handleToggleBedMaintenance = async (bed: Bed) => {
    const nextStatus = bed.status === "MAINTENANCE" ? "VACANT" : "MAINTENANCE";
    const res = await updateBedStatusAction(bed.id, nextStatus);
    if (res.success) {
      toast.success(`Bed ${bed.bedNumber} marked as ${nextStatus}`);
      await reloadPropertyDetails();
    } else {
      toast.error(
        friendlyError(
          res.error,
          "Failed to update bed status. Please try again.",
        ),
      );
    }
  };

  // 9. Bed: Mark as Vacant (Checkout)
  const promptMarkVacant = (bed: Bed) => {
    const activeBooking = activeBookings.find((b) => b.bedId === bed.id);
    if (activeBooking) {
      setCheckoutTarget({
        id: activeBooking.id,
        name: activeBooking.customer?.name || "Guest",
        bedNumber: bed.bedNumber,
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Free Bed ${bed.bedNumber}`,
      description: `Are you sure you want to mark Bed ${bed.bedNumber} as VACANT? This will remove its active status.`,
      confirmText: "Mark as Vacant",
      variant: "default",
      action: async () => {
        const res = await updateBedStatusAction(bed.id, "VACANT");
        if (res.success) {
          toast.success(`Bed ${bed.bedNumber} is now VACANT`);
          await reloadPropertyDetails();
        } else {
          toast.error(
            friendlyError(
              res.error,
              "Failed to free the bed. Please try again.",
            ),
          );
        }
      },
    });
  };

  // 10. Bed: Book -> open reusable NewBookingModal
  const handleBookBed = (bed?: Bed) => {
    setBookingTargetBedId(bed?.id || null);
    setBookingModalOpen(true);
  };

  // Aggregates
  const totalFloors = property.floors?.length || 0;
  let totalRooms = 0;
  let totalBeds = 0;
  let occupiedBeds = 0;
  for (const floor of property.floors || []) {
    totalRooms += floor.rooms?.length || 0;
    for (const room of floor.rooms || []) {
      totalBeds += room.beds?.length || 0;
      for (const bed of room.beds || []) {
        if (bed.status === "OCCUPIED") occupiedBeds++;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Reusable Header */}
      <PageHeader
        title={property.name}
        description={`Created on ${format(property.createdAt, "dd/MM/yyyy hh:mm a")}`}
        backLink={{ href: "/admin/properties", label: "All Properties" }}
        badge={
          <Badge variant="outline" className="text-xs pt-1 px-2 font-semibold ">
            {totalFloors} {totalFloors === 1 ? "Floor" : "Floors"}
          </Badge>
        }
      >
        <Button
          onClick={handleOpenAddFloor}
          disabled={addingFloor}
          size="sm"
          className="font-semibold cursor-pointer"
        >
          {addingFloor ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5 mr-1.5" />
          )}
          Add Floor
        </Button>

        {/* 3-dots options menu for Property */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="p-1 text-foreground cursor-pointer"
            aria-label="Property Options"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={promptDeleteProperty}
              className="cursor-pointer text-xs text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              <span>Delete Property</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      {/* Property Overview Stats Bar */}
      <Card className="bg-card border-border shadow-xs py-0">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-baseline gap-1 text-sm font-semibold text-muted-foreground">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>{property.contactNo}</span>
            </span>
            <span className="flex items-baseline gap-1 text-sm font-semibold text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{property.address}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-bold text-foreground">{totalFloors}</span>
              <span className="text-muted-foreground">Floors</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <DoorOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-bold text-foreground">{totalRooms}</span>
              <span className="text-muted-foreground">Rooms</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <BedSingle className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-bold text-foreground">
                {occupiedBeds}/{totalBeds}
              </span>
              <span className="text-muted-foreground">Beds</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floors Hierarchy Rows */}
      {!property.floors || property.floors.length === 0 ? (
        <Card className="bg-card border-dashed border-2 border-border py-14 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No floors configured
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Click the button below to add Floor 1 to this building.
            </p>
            <Button
              onClick={handleOpenAddFloor}
              disabled={addingFloor}
              size="sm"
              className="mt-1 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Floor 1
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {property.floors.map((floor) => (
            <FloorRow
              key={floor.id}
              floor={floor}
              onAddRoom={handleOpenAddRoom}
              onAddRoomsBulk={handleOpenAddRoomsBulk}
              onDeleteFloor={promptDeleteFloor}
              onEditRoom={handleOpenEditRoom}
              onDeleteRoom={promptDeleteRoom}
              onToggleMaintenance={handleToggleBedMaintenance}
              onMarkVacant={promptMarkVacant}
              onBookBed={handleBookBed}
            />
          ))}
        </div>
      )}

      {/* 1. Add Room Modal (Single) */}
      {addRoomFloor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Add Room — Floor {addRoomFloor.floorNumber}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {10 -
                    (property.floors?.find((f) => f.id === addRoomFloor.id)
                      ?.rooms?.length || 0)}{" "}
                  slot(s) remaining on this floor
                </p>
              </div>
              <button
                onClick={() => setAddRoomFloor(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSingleAddRoomSubmit} className="space-y-4">
              {/* Position mode toggle */}
              <div className="space-y-1.5">
                <Label className="text-xs">Add Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRoomPositionMode("next");
                      const nextNum = getNextRoomNumber(addRoomFloor);
                      setSingleRoomData((prev) => ({
                        ...prev,
                        roomNumber: nextNum || prev.roomNumber,
                      }));
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                      roomPositionMode === "next"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    Next Available
                    {roomPositionMode === "next" &&
                      singleRoomData.roomNumber && (
                        <span className="ml-1 opacity-80">
                          ({singleRoomData.roomNumber})
                        </span>
                      )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoomPositionMode("specific");
                      const positions = getAvailableRoomPositions(addRoomFloor);
                      if (positions.length > 0) {
                        const pos = positions[0];
                        setSelectedRoomPosition(pos);
                        setSingleRoomData((prev) => ({
                          ...prev,
                          roomNumber: `${addRoomFloor.floorNumber}${String(pos).padStart(2, "0")}`,
                        }));
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                      roomPositionMode === "specific"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    Specific Position
                  </button>
                </div>
              </div>

              {/* Room number display / position select */}
              {roomPositionMode === "next" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="single-room-no" className="text-xs">
                    Room Number
                  </Label>
                  <Input
                    id="single-room-no"
                    value={singleRoomData.roomNumber}
                    disabled
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs">Select Room Position</Label>
                  <select
                    value={selectedRoomPosition ?? ""}
                    onChange={(e) => {
                      const pos = parseInt(e.target.value);
                      setSelectedRoomPosition(pos);
                      setSingleRoomData((prev) => ({
                        ...prev,
                        roomNumber: `${addRoomFloor.floorNumber}${String(pos).padStart(2, "0")}`,
                      }));
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {getAvailableRoomPositions(addRoomFloor).map((pos) => (
                      <option key={pos} value={pos}>
                        Room {addRoomFloor.floorNumber}
                        {String(pos).padStart(2, "0")} (Slot {pos})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sharing type */}
              <div className="space-y-1.5">
                <Label className="text-xs">Sharing Configuration</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSingleRoomData({
                        ...singleRoomData,
                        type: "2-Sharing",
                        capacity: 2,
                      })
                    }
                    className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                      singleRoomData.type === "2-Sharing"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    2-Sharing (2 Beds)
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSingleRoomData({
                        ...singleRoomData,
                        type: "3-Sharing",
                        capacity: 3,
                      })
                    }
                    className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                      singleRoomData.type === "3-Sharing"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    3-Sharing (3 Beds)
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Beds {singleRoomData.roomNumber}-A,{" "}
                  {singleRoomData.roomNumber}-B
                  {singleRoomData.type === "3-Sharing"
                    ? `, ${singleRoomData.roomNumber}-C`
                    : ""}{" "}
                  will be initialized.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddRoomFloor(null)}
                  disabled={addingRoomLoading}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addingRoomLoading || !singleRoomData.roomNumber}
                  className="cursor-pointer text-xs font-semibold"
                >
                  {addingRoomLoading && (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  )}
                  Add Room
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Rooms Modal (Bulk) */}
      {bulkFloor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Add Rooms in Bulk (Floor {bulkFloor.floorNumber})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enter counts for each room sharing type.
                </p>
              </div>
              <button
                onClick={() => setBulkFloor(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkAddRoomsSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bulk-2s" className="text-xs">
                  2-Sharing Rooms (2 Beds each)
                </Label>
                <Input
                  id="bulk-2s"
                  type="number"
                  min={0}
                  max={10}
                  value={bulkRoomCounts.twoSharingCount}
                  onChange={(e) =>
                    setBulkRoomCounts({
                      ...bulkRoomCounts,
                      twoSharingCount: Math.max(
                        0,
                        parseInt(e.target.value) || 0,
                      ),
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bulk-3s" className="text-xs">
                  3-Sharing Rooms (3 Beds each)
                </Label>
                <Input
                  id="bulk-3s"
                  type="number"
                  min={0}
                  max={10}
                  value={bulkRoomCounts.threeSharingCount}
                  onChange={(e) =>
                    setBulkRoomCounts({
                      ...bulkRoomCounts,
                      threeSharingCount: Math.max(
                        0,
                        parseInt(e.target.value) || 0,
                      ),
                    })
                  }
                />
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border/70 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Summary:</p>
                <p>
                  • {bulkRoomCounts.twoSharingCount} 2-Sharing rooms (
                  {bulkRoomCounts.twoSharingCount * 2} beds)
                </p>
                <p>
                  • {bulkRoomCounts.threeSharingCount} 3-Sharing rooms (
                  {bulkRoomCounts.threeSharingCount * 3} beds)
                </p>
                <p className="text-primary font-medium pt-0.5">
                  Total:{" "}
                  {bulkRoomCounts.twoSharingCount +
                    bulkRoomCounts.threeSharingCount}{" "}
                  rooms,{" "}
                  {bulkRoomCounts.twoSharingCount * 2 +
                    bulkRoomCounts.threeSharingCount * 3}{" "}
                  beds.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkFloor(null)}
                  disabled={bulkAddingLoading}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    bulkAddingLoading ||
                    bulkRoomCounts.twoSharingCount +
                      bulkRoomCounts.threeSharingCount <=
                      0
                  }
                  className="cursor-pointer text-xs font-semibold"
                >
                  {bulkAddingLoading && (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  )}
                  Create Rooms
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Edit Room Modal */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Edit Room</h3>
              <button
                onClick={() => setEditingRoom(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditRoomSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-room-no" className="text-xs">
                  Room Number *
                </Label>
                <Input
                  id="edit-room-no"
                  value={editingRoomData.roomNumber}
                  onChange={(e) =>
                    setEditingRoomData({
                      ...editingRoomData,
                      roomNumber: e.target.value,
                    })
                  }
                  required
                  disabled
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Sharing Configuration</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingRoomData({
                        ...editingRoomData,
                        type: "2-Sharing",
                      })
                    }
                    className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                      editingRoomData.type === "2-Sharing"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    2-Sharing
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingRoomData({
                        ...editingRoomData,
                        type: "3-Sharing",
                      })
                    }
                    className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                      editingRoomData.type === "3-Sharing"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    3-Sharing
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRoom(null)}
                  disabled={updatingRoomLoading}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updatingRoomLoading}
                  className="cursor-pointer text-xs font-semibold"
                >
                  {updatingRoomLoading && (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floor Choice Modal */}
      {floorChoiceOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Add Floor
                </h3>
                <p className="text-xs text-muted-foreground">
                  {property.floors?.length || 0} of 7 floors used
                </p>
              </div>
              <button
                onClick={() => setFloorChoiceOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Mode toggle */}
              <div className="space-y-1.5">
                <Label className="text-xs">Add Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const available = getAvailableFloorNumbers();
                      setFloorChoiceMode("next");
                      setSelectedFloorNumber(available[0] ?? null);
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                      floorChoiceMode === "next"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    Next Available
                    {floorChoiceMode === "next" &&
                      selectedFloorNumber !== null && (
                        <span className="ml-1 opacity-80">
                          (Floor {selectedFloorNumber})
                        </span>
                      )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFloorChoiceMode("specific");
                      const available = getAvailableFloorNumbers();
                      setSelectedFloorNumber(available[0] ?? null);
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                      floorChoiceMode === "specific"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    Specific Floor
                  </button>
                </div>
              </div>

              {/* Floor dropdown — only shown in specific mode */}
              {floorChoiceMode === "specific" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Select Floor Number</Label>
                  <select
                    value={selectedFloorNumber ?? ""}
                    onChange={(e) =>
                      setSelectedFloorNumber(parseInt(e.target.value))
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {getAvailableFloorNumbers().map((n) => (
                      <option key={n} value={n}>
                        Floor {n}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Summary */}
              {selectedFloorNumber !== null && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/70 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    Will add: Floor {selectedFloorNumber}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFloorChoiceOpen(false)}
                  disabled={addingFloor}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={addingFloor || selectedFloorNumber === null}
                  onClick={() => {
                    if (selectedFloorNumber !== null) {
                      handleAddFloor(selectedFloorNumber);
                    }
                  }}
                  className="cursor-pointer text-xs font-semibold"
                >
                  {addingFloor && (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  )}
                  Add Floor {selectedFloorNumber}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={confirmLoading}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          try {
            setConfirmLoading(true);
            await confirmDialog.action();
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          } finally {
            setConfirmLoading(false);
          }
        }}
      />

      {/* Reusable New Booking Modal */}
      {bookingModalOpen && (
        <NewBookingModal
          isOpen={bookingModalOpen}
          preselectedPropertyId={property.id}
          preselectedBedId={bookingTargetBedId || undefined}
          onClose={() => {
            setBookingModalOpen(false);
            setBookingTargetBedId(null);
          }}
          onSuccess={async () => {
            await reloadPropertyDetails();
          }}
        />
      )}

      {/* Reusable Checkout confirmation dialog */}
      <CheckoutTenantDialog
        target={checkoutTarget}
        onClose={() => setCheckoutTarget(null)}
        onSuccess={async () => {
          await reloadPropertyDetails();
        }}
      />
    </div>
  );
}
