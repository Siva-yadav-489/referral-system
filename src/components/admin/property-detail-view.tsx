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
  updateRoomAction,
  deleteRoomAction,
  updateBedStatusAction,
  deleteBedAction,
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

  // 1. Add Floor (capped at 7)
  const handleAddFloor = async () => {
    const currentFloorsCount = property.floors?.length || 0;
    if (currentFloorsCount >= 7) {
      toast.error("Limit reached: A property can have at most 7 floors.");
      return;
    }

    try {
      setAddingFloor(true);
      const nextFloorNumber = currentFloorsCount + 1;
      const res = await addFloorAction({
        propertyId: property.id,
        floorNumber: nextFloorNumber,
      });

      if (res.success) {
        toast.success(`Floor ${nextFloorNumber} added successfully!`);
        await reloadPropertyDetails();
      } else {
        toast.error(res.error || "Failed to add floor");
      }
    } catch {
      toast.error("Error adding floor");
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
          toast.error(res.error || "Failed to delete property");
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
          toast.error(res.error || "Failed to delete floor");
        }
      },
    });
  };

  // 4. Open Single Add Room Modal
  const handleOpenAddRoom = (floor: Floor) => {
    const existingRoomsCount =
      property.floors?.find((f) => f.id === floor.id)?.rooms?.length || 0;
    const defaultNum = `${floor.floorNumber}0${existingRoomsCount + 1}`;
    setSingleRoomData({
      roomNumber: defaultNum,
      type: "2-Sharing",
      capacity: 2,
    });
    setAddRoomFloor(floor);
  };

  const handleSingleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addRoomFloor || !singleRoomData.roomNumber.trim()) return;

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
          `Room ${singleRoomData.roomNumber} created with ${singleRoomData.capacity} beds!`,
        );
        setAddRoomFloor(null);
        await reloadPropertyDetails();
      } else {
        toast.error(res.error || "Failed to create room");
      }
    } catch {
      toast.error("Error creating room");
    } finally {
      setAddingRoomLoading(false);
    }
  };

  // 5. Open Bulk Add Rooms Modal
  const handleOpenAddRoomsBulk = (floor: Floor) => {
    setBulkRoomCounts({
      twoSharingCount: 2,
      threeSharingCount: 1,
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
      toast.error("Please enter at least 1 room to create");
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
          `Successfully created ${total} rooms on Floor ${bulkFloor.floorNumber}!`,
        );
        setBulkFloor(null);
        await reloadPropertyDetails();
      } else {
        toast.error(res.error || "Failed to create bulk rooms");
      }
    } catch {
      toast.error("Error adding rooms in bulk");
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

    try {
      setUpdatingRoomLoading(true);
      const res = await updateRoomAction(editingRoom.id, {
        roomNumber: editingRoomData.roomNumber.trim(),
        type: editingRoomData.type,
      });

      if (res.success) {
        toast.success("Room updated successfully!");
        setEditingRoom(null);
        await reloadPropertyDetails();
      } else {
        toast.error(res.error || "Failed to update room");
      }
    } catch {
      toast.error("Error updating room");
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
          toast.error(res.error || "Failed to delete room");
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
      toast.error(res.error || "Failed to update bed status");
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
          toast.error(res.error || "Failed to mark bed as vacant");
        }
      },
    });
  };

  // 10. Bed: Delete
  const promptDeleteBed = (bed: Bed) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Bed ${bed.bedNumber}`,
      description: `Are you sure you want to permanently delete Bed ${bed.bedNumber}?`,
      confirmText: "Delete Bed",
      variant: "destructive",
      action: async () => {
        const res = await deleteBedAction(bed.id);
        if (res.success) {
          toast.success(`Bed ${bed.bedNumber} deleted`);
          await reloadPropertyDetails();
        } else {
          toast.error(res.error || "Failed to delete bed");
        }
      },
    });
  };

  // 11. Bed: Book -> open reusable NewBookingModal
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
          onClick={handleAddFloor}
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
              onClick={handleAddFloor}
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
              onDeleteBed={promptDeleteBed}
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
                  Add Room on Floor {addRoomFloor.floorNumber}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Specify room number and bed sharing type.
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
              <div className="space-y-1.5">
                <Label htmlFor="single-room-no" className="text-xs">
                  Room Number *
                </Label>
                <Input
                  id="single-room-no"
                  placeholder="e.g. 101"
                  value={singleRoomData.roomNumber}
                  onChange={(e) =>
                    setSingleRoomData({
                      ...singleRoomData,
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
                  {singleRoomData.roomNumber}-B will be initialized.
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
                  disabled={addingRoomLoading}
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
                  max={20}
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
                  max={20}
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
