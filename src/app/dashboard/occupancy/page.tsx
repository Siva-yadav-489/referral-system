"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  User,
  BedSingle,
  DoorOpen,
  Check,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Loader2,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { DashboardNav } from "@/components/DashboardNav";
import {
  getOccupancyData,
  reserveBedAction,
  checkIsAdmin,
  FloorData,
} from "@/app/actions/occupancy";

export default function OccupancyDashboard() {
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
        const [dbFloors, admin] = await Promise.all([
          getOccupancyData(),
          checkIsAdmin(),
        ]);
        if (cancelled) return;
        if (dbFloors && dbFloors.length > 0) {
          setFloors(dbFloors);
          setExpandedFloor(dbFloors[0].id);
        } else {
          setFloors([]);
        }
        setIsAdmin(admin);
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <DashboardNav />

        {/* Page Header Banner */}
        <div className="relative overflow-hidden bg-linear-to-r from-indigo-950/60 via-zinc-900 to-violet-950/60 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Occupancy Dashboard
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              PG Occupancy & Bed Reservation
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
              Explore available floors, view room-sharing configurations, and
              reserve vacant beds in real-time.
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className="relative z-10 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 shrink-0"
            >
              <ShieldCheck className="w-4 h-4" /> Admin: Manage PG Occupancy
            </Link>
          )}

          <div className="absolute -right-5 -bottom-5 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm shadow-xl backdrop-blur-md animate-fade-in border ${
              notification.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/80 border-rose-500/40 text-rose-300"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{notification.text}</span>
          </div>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Total Floors
              </span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {totalFloors}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {totalRooms} Total Rooms
            </p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Total Beds
              </span>
              <BedSingle className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {totalCapacity}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Across all floors</p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Occupied Beds
              </span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {totalOccupants}
            </div>
            <p className="text-[11px] text-amber-400/90 mt-1 font-medium">
              {occupancyRate}% Occupied
            </p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Available Beds
              </span>
              <DoorOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              {totalVacantBeds}
            </div>
            <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">
              Ready to reserve
            </p>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm text-zinc-400">
              Loading live occupancy database...
            </p>
          </div>
        ) : floors.length === 0 ? (
          /* Empty State: No Occupancies Found */
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-12 text-center shadow-xl space-y-4 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 flex items-center justify-center mx-auto">
              <Inbox className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              No Occupancies Found
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              No floor or room occupancy data has been configured in the
              database yet.
            </p>
            {isAdmin ? (
              <div className="pt-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25"
                >
                  <ShieldCheck className="w-4 h-4" /> Go to Admin Panel to Add
                  PG Data
                </Link>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                Please check back soon or contact PG management.
              </p>
            )}
          </div>
        ) : (
          /* Floor Accordion */
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
              const uniqueTypes = Array.from(
                new Set(floor.rooms.map((room) => room.type)),
              ).join(", ");
              const isExpanded = expandedFloor === floor.id;

              return (
                <div
                  key={floor.id}
                  className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl overflow-hidden shadow-xl transition-all"
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleFloor(floor.id)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Floor {floor.floorNumber}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {floor.rooms.length}{" "}
                          {`Room${floor.rooms.length > 1 ? "s" : ""}`}
                        </span>
                        <span className="bg-zinc-800 text-zinc-300 border border-zinc-700/60 text-xs font-semibold px-3 py-1 rounded-full">
                          {uniqueTypes}
                        </span>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                            availableBeds > 0
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                              : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                          }`}
                        >
                          {availableBeds > 0
                            ? `${availableBeds} Bed${availableBeds > 1 ? "s" : ""} Available`
                            : "Fully Occupied"}
                        </span>
                      </div>
                    </div>

                    <div className="text-zinc-400 hover:text-white p-1">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="p-6 bg-zinc-950/60 border-t border-zinc-800/80 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {floor.rooms.map((room) => {
                          const vacancies =
                            room.capacity - room.occupants.length;
                          const isFull = vacancies === 0;

                          return (
                            <div
                              key={room.id}
                              className={`rounded-2xl border p-5 transition-all ${
                                isFull
                                  ? "bg-zinc-950/80 border-zinc-800/60 opacity-80"
                                  : "bg-zinc-900/90 border-zinc-800 hover:border-indigo-500/40 shadow-lg shadow-indigo-950/10"
                              }`}
                            >
                              {/* Room Top Bar */}
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-2xl font-black text-white tracking-tight">
                                    Room {room.number}
                                  </h3>
                                  <p className="text-xs text-zinc-400 font-medium">
                                    {room.type} (Cap: {room.capacity})
                                  </p>
                                </div>
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                    isFull
                                      ? "bg-rose-950/80 border-rose-500/40 text-rose-300"
                                      : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                                  }`}
                                >
                                  {isFull ? "Full" : `${vacancies} Available`}
                                </span>
                              </div>

                              {/* Beds / Occupants */}
                              <div className="space-y-2.5">
                                {/* Occupants list */}
                                {room.occupants.map((occupant) => (
                                  <div
                                    key={occupant.id}
                                    className="flex items-center gap-3 p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-zinc-200"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center">
                                      <User className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs font-medium text-zinc-200">
                                      {occupant.name}
                                    </span>
                                  </div>
                                ))}

                                {/* Vacant beds */}
                                {Array.from({ length: vacancies }).map(
                                  (_, idx) => (
                                    <div
                                      key={`empty-${idx}`}
                                      className="flex items-center justify-between p-2.5 bg-emerald-950/20 rounded-xl border border-emerald-500/30 border-dashed"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-emerald-900/40 text-emerald-400 flex items-center justify-center">
                                          <BedSingle className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-medium text-emerald-400 italic">
                                          Available Bed
                                        </span>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleReserve(room.id, room.number)
                                        }
                                        disabled={reservingRoomId === room.id}
                                        className="text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                                      >
                                        {reservingRoomId === room.id ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <>
                                            <Check className="w-3.5 h-3.5" />{" "}
                                            Reserve
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
