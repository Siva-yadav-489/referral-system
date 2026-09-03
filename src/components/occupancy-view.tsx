"use client";

import { useEffect, useState } from "react";

import {
  ChevronDown,
  ChevronUp,
  User,
  BedSingle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Inbox,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getOccupancyData,
  reserveBedAction,
  FloorData,
} from "@/app/actions/occupancy";

export function OccupancyView() {
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFloor, setExpandedFloor] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [reservingRoomId, setReservingRoomId] = useState<string | null>(null);

  const fetchBackendData = async () => {
    try {
      const dbFloors = await getOccupancyData();
      if (dbFloors && dbFloors.length > 0) {
        setFloors(dbFloors);
        setExpandedFloor(dbFloors[0].id);
      } else {
        setFloors([]);
      }
    } catch {
      setFloors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [dbFloors] = await Promise.all([getOccupancyData()]);
        if (cancelled) return;
        if (dbFloors && dbFloors.length > 0) {
          setFloors(dbFloors);
          setExpandedFloor(dbFloors[0].id);
        } else {
          setFloors([]);
        }
      } catch {
        if (cancelled) return;
        setFloors([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFloor = (floorId: string) => {
    setExpandedFloor((prev) => (prev === floorId ? null : floorId));
  };

  const handleReserve = async (roomId: string, roomNumber: string) => {
    setReservingRoomId(roomId);
    setNotification(null);
    try {
      const res = await reserveBedAction(roomId);
      setNotification({ text: res.message, type: "success" });
      await fetchBackendData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : `Failed to reserve bed in Room ${roomNumber}.`;
      setNotification({ text: msg, type: "error" });
    } finally {
      setReservingRoomId(null);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Global aggregate metrics
  const totalFloors = floors.length;
  const totalRooms = floors.reduce((sum, f) => sum + f.rooms.length, 0);
  const totalCapacity = floors.reduce(
    (sum, f) => sum + f.rooms.reduce((rSum, room) => rSum + room.capacity, 0),
    0,
  );
  const totalOccupants = floors.reduce(
    (sum, f) =>
      sum + f.rooms.reduce((rSum, room) => rSum + room.occupants.length, 0),
    0,
  );
  const totalVacantBeds = totalCapacity - totalOccupants;
  const occupancyRate =
    totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-10 p-2 md:p-10 w-full">
      {/* Top Row: Informational Header Banner */}

      <div className="flex flex-col items-center space-y-5 pb-10">
        <div className="text-center space-y-5">
          <div className="text-xl md:text-3xl font-bold tracking-tight">
            PG Occupancy & Bed Reservation
          </div>
          <div className="text-sm font-semibold text-neutral-600/85 dark:text-neutral-400">
            Explore available floors, view room-sharing configurations, and
            reserve vacant beds in real-time.
          </div>
        </div>
      </div>

      {/* Toast Notification Alert */}
      {notification && (
        <div
          role="alert"
          className={`p-3.5 rounded-lg flex items-center gap-2.5 text-sm border ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          <span className="font-medium">{notification.text}</span>
        </div>
      )}

      {/* 1st Row: 4 Column Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs space-y-3">
          <CardHeader className="font-bold">Total Floors</CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl md:text-3xl font-bold tracking-tight">
              {totalFloors}
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              {totalRooms} Total Rooms
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Beds */}
        <Card className="border-border shadow-xs space-y-3">
          <CardHeader className="font-bold">Total Beds</CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl md:text-3xl font-bold tracking-tight">
              {totalCapacity}
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              Across all floors
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Occupied Beds */}
        <Card className="border-border shadow-xs space-y-3">
          <CardHeader className="font-bold">Occupied Beds</CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl md:text-3xl font-bold tracking-tight">
              {totalOccupants}
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              {occupancyRate}% Occupied
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Available Beds */}
        <Card className="border-border shadow-xs space-y-3">
          <CardHeader className="font-bold">Available Beds</CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl md:text-3xl font-bold tracking-tight">
              {totalVacantBeds}
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              Ready to reserve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Floors Content Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
          <p className="text-sm text-muted-foreground">
            Loading occupancy database...
          </p>
        </div>
      ) : floors.length === 0 ? (
        <Card className="border-border shadow-xs p-12 text-center max-w-lg mx-auto">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted mx-auto mb-3">
            <Inbox className="size-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">No Occupancies Found</CardTitle>
          <CardDescription className="text-xs mt-1">
            No floor or room occupancy data has been configured in the database
            yet.
          </CardDescription>
        </Card>
      ) : (
        <div className="space-y-4">
          {floors.map((floor) => {
            const floorCapacity = floor.rooms.reduce(
              (sum, room) => sum + room.capacity,
              0,
            );
            const floorOccupants = floor.rooms.reduce(
              (sum, room) => sum + room.occupants.length,
              0,
            );
            const availableBeds = floorCapacity - floorOccupants;
            const isExpanded = expandedFloor === floor.id;

            return (
              <Card
                key={floor.id}
                className="border-border shadow-xs overflow-hidden"
              >
                {/* Floor Header Bar */}
                <button
                  type="button"
                  onClick={() => toggleFloor(floor.id)}
                  className="w-full px-5 py-4 flex items-center justify-between bg-card hover:bg-muted/40 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted font-bold text-sm">
                      F{floor.floorNumber}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">
                        Floor {floor.floorNumber}
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold">
                        {floor.rooms.length} Rooms • {availableBeds} of{" "}
                        {floorCapacity} beds available
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={availableBeds > 0 ? "outline" : "secondary"}
                      className="text-xs font-normal rounded-sm p-3! bg-gray-200 dark:bg-background shadow-xs!"
                    >
                      {availableBeds > 0
                        ? `${availableBeds} Vacant`
                        : "Fully Occupied"}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Floor Rooms Grid (Accordion body) */}
                {isExpanded && (
                  <CardContent className="pt-4 border-t border-border bg-muted/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {floor.rooms.map((room) => {
                        const vacantCount =
                          room.capacity - room.occupants.length;
                        const isReservingThis = reservingRoomId === room.id;

                        return (
                          <div
                            key={room.id}
                            className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between gap-4 shadow-xs"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm">
                                  Room {room.number}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs font-normal rounded-sm py-3! px-2.5 shadow-xs!"
                                >
                                  {room.type}
                                </Badge>
                              </div>

                              {/* Bed Slots */}
                              <div className="space-y-2">
                                {Array.from({ length: room.capacity }).map(
                                  (_, idx) => {
                                    const occupant = room.occupants[idx];

                                    if (occupant) {
                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-muted border border-border text-xs"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <User className="size-3 text-muted-foreground shrink-0" />
                                            <span className="truncate">
                                              {occupant.name}
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-muted-foreground shrink-0 uppercase font-semibold">
                                            {occupant.status}
                                          </span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-green-400 border border-border text-xs text-muted-foreground dark:text-foreground"
                                      >
                                        <div className="flex items-center gap-2">
                                          <BedSingle className="size-3  shrink-0" />
                                          <span>Bed {idx + 1}</span>
                                        </div>
                                        <span className="text-[10px] uppercase font-semibold">
                                          Vacant
                                        </span>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground">
                                {vacantCount} vacant bed
                                {vacantCount !== 1 ? "s" : ""}
                              </span>

                              {vacantCount > 0 ? (
                                <Button
                                  size="sm"
                                  variant="default"
                                  disabled={isReservingThis}
                                  onClick={() =>
                                    handleReserve(room.id, room.number)
                                  }
                                  className="gap-1 text-xs h-7 px-2.5"
                                >
                                  {isReservingThis ? (
                                    <>
                                      <Loader2 className="size-3 animate-spin" />
                                      <span>Reserving...</span>
                                    </>
                                  ) : (
                                    "Reserve Bed"
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="default"
                                  disabled={true}
                                  className="gap-1 text-xs h-7 px-2.5"
                                >
                                  <Lock className="size-3" /> Full
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
