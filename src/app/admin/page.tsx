"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getOccupancyData,
  deleteAllOccupancyLayout,
  createFloor,
  deleteFloor,
  createRoom,
  updateRoom,
  deleteRoom,
  createOccupant,
  updateOccupant,
  deleteOccupant,
  FloorData,
  RoomData,
  OccupantData,
} from "@/app/actions/occupancy";
import {
  Building2,
  Plus,
  Trash2,
  Save,
  Edit3,
  Sparkles,
  Loader2,
  BedSingle,
  Users,
  DoorOpen,
  PlusCircle,
} from "lucide-react";

type RoomFieldErrors = Partial<Record<"number" | "capacity", string>>;
type OccupantFieldErrors = Partial<Record<"name", string>>;

type FieldErrors = {
  rooms: Record<string, RoomFieldErrors>;
  occupants: Record<string, OccupantFieldErrors>;
  newOccupant: Record<string, string>;
};

function emptyFieldErrors(): FieldErrors {
  return { rooms: {}, occupants: {}, newOccupant: {} };
}

function getSavedRoom(savedFloors: FloorData[], roomId: string) {
  for (const floor of savedFloors) {
    const room = floor.rooms.find((r) => r.id === roomId);
    if (room) return room;
  }
  return undefined;
}

function getSavedOccupant(savedFloors: FloorData[], occupantId: string) {
  for (const floor of savedFloors) {
    for (const room of floor.rooms) {
      const occ = room.occupants.find((o) => o.id === occupantId);
      if (occ) return occ;
    }
  }
  return undefined;
}

function isRoomDirty(room: RoomData, savedFloors: FloorData[]) {
  const saved = getSavedRoom(savedFloors, room.id);
  if (!saved) return false;
  return room.number !== saved.number || room.capacity !== saved.capacity;
}

function isOccupantDirty(occ: OccupantData, savedFloors: FloorData[]) {
  const saved = getSavedOccupant(savedFloors, occ.id);
  if (!saved) return false;
  return occ.name !== saved.name || occ.status !== saved.status;
}

function validateRoom(room: RoomData, allFloors: FloorData[]): RoomFieldErrors {
  const errors: RoomFieldErrors = {};
  const trimmedNumber = room.number.trim();
  if (!trimmedNumber) {
    errors.number = "Room number is required.";
  } else {
    const duplicate = allFloors.some((floor) =>
      floor.rooms.some(
        (r) => r.id !== room.id && r.number.trim() === trimmedNumber,
      ),
    );
    if (duplicate) {
      errors.number = `Room number "${trimmedNumber}" is already in use.`;
    }
  }
  if (room.capacity < 1 || room.capacity > 4) {
    errors.capacity = "Capacity must be between 1 and 4.";
  } else if (room.occupants.length > room.capacity) {
    errors.capacity = `Cannot be less than occupant count (${room.occupants.length}).`;
  }
  return errors;
}

function validateOccupantName(name: string): OccupantFieldErrors {
  if (!name.trim()) return { name: "Occupant name is required." };
  return {};
}

function mapRoomServerError(msg: string): RoomFieldErrors | null {
  const lower = msg.toLowerCase();
  if (
    lower.includes("room number") ||
    lower.includes("already in use") ||
    lower.includes("duplicate")
  ) {
    return {
      number: lower.includes("failed query")
        ? "This room number is already in use."
        : msg,
    };
  }
  if (lower.includes("capacity") || lower.includes("occupant count")) {
    return { capacity: msg };
  }
  return null;
}

function mapOccupantServerError(msg: string): OccupantFieldErrors | null {
  if (msg.toLowerCase().includes("occupant name")) return { name: msg };
  return null;
}

function inputErrorClass(hasError: boolean) {
  return hasError
    ? "border-rose-500/60 focus:border-rose-500"
    : "border-zinc-800 focus:border-indigo-500";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[10px] text-rose-400 mt-0.5">{message}</p>;
}

export default function AdminPage() {
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [savedFloors, setSavedFloors] = useState<FloorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingLayout, setDeletingLayout] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyFieldErrors);
  const [newOccupantNames, setNewOccupantNames] = useState<
    Record<string, string>
  >({});

  const syncData = (data: FloorData[]) => {
    setFloors(data);
    setSavedFloors(data);
  };

  const loadData = async ({
    refresh = false,
    keepEditing = false,
  }: { refresh?: boolean; keepEditing?: boolean } = {}) => {
    if (refresh) {
      setLoading(true);
    }
    try {
      const data = await getOccupancyData();
      syncData(data);
      if (!keepEditing) setIsEditing(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load PG occupancy data.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getOccupancyData();
        if (cancelled) return;
        syncData(data);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to load PG occupancy data.";
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const runAction = async (
    key: string,
    fn: () => Promise<{ message: string }>,
  ) => {
    setActionKey(key);
    try {
      const res = await fn();
      toast.success(res.message);
      setFieldErrors(emptyFieldErrors());
      await loadData({ keepEditing: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed.";
      toast.error(msg);
    } finally {
      setActionKey(null);
    }
  };

  const handleDeleteLayout = async () => {
    if (
      !confirm(
        "Delete the entire PG layout? This removes all floors, rooms, and occupants.",
      )
    ) {
      return;
    }
    setDeletingLayout(true);
    try {
      const res = await deleteAllOccupancyLayout();
      toast.success(res.message);
      setIsEditing(false);
      setFieldErrors(emptyFieldErrors());
      await loadData({ refresh: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete PG layout.";
      toast.error(msg);
    } finally {
      setDeletingLayout(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewOccupantNames({});
    setFieldErrors(emptyFieldErrors());
    setFloors(savedFloors);
  };

  const clearRoomFieldError = (
    roomId: string,
    field: keyof RoomFieldErrors,
  ) => {
    setFieldErrors((prev) => ({
      ...prev,
      rooms: {
        ...prev.rooms,
        [roomId]: { ...prev.rooms[roomId], [field]: undefined },
      },
    }));
  };

  const clearOccupantFieldError = (occupantId: string) => {
    setFieldErrors((prev) => ({
      ...prev,
      occupants: {
        ...prev.occupants,
        [occupantId]: { ...prev.occupants[occupantId], name: undefined },
      },
    }));
  };

  const updateRoomField = (
    fIdx: number,
    rIdx: number,
    field: keyof Pick<RoomData, "number" | "capacity">,
    value: string | number,
  ) => {
    const roomId = floors[fIdx]?.rooms[rIdx]?.id;

    setFloors((prev) => {
      const updated = [...prev];
      const room = { ...updated[fIdx].rooms[rIdx], [field]: value };

      if (field === "capacity") {
        const cap = Number(value);

        room.capacity = cap;
        room.type =
          cap === 1
            ? "1-Sharing"
            : cap === 2
              ? "2-Sharing"
              : cap === 3
                ? "3-Sharing"
                : "4-Sharing";
      }

      updated[fIdx] = {
        ...updated[fIdx],
        rooms: updated[fIdx].rooms.map((r, i) => (i === rIdx ? room : r)),
      };

      return updated;
    });

    if (roomId) {
      clearRoomFieldError(roomId, field);
    }
  };

  const updateOccupantField = (
    fIdx: number,
    rIdx: number,
    oIdx: number,
    field: "name" | "status",
    value: string,
  ) => {
    const occupantId = floors[fIdx]?.rooms[rIdx]?.occupants[oIdx]?.id;
    if (occupantId && field === "name") clearOccupantFieldError(occupantId);

    setFloors((prev) => {
      const updated = [...prev];
      const occupants = [...updated[fIdx].rooms[rIdx].occupants];
      const current = occupants[oIdx];
      occupants[oIdx] =
        field === "status"
          ? {
              ...current,
              status: value as OccupantData["status"],
            }
          : { ...current, name: value };
      updated[fIdx] = {
        ...updated[fIdx],
        rooms: updated[fIdx].rooms.map((r, i) =>
          i === rIdx ? { ...r, occupants } : r,
        ),
      };
      return updated;
    });
  };

  const handleAddFloor = () =>
    runAction("add-floor", async () => {
      const nextNum =
        floors.length > 0
          ? Math.max(...floors.map((f) => f.floorNumber)) + 1
          : 1;
      return createFloor(nextNum);
    });

  const handleDeleteFloor = (floor: FloorData) => {
    if (
      !confirm(
        `Delete ${floor.floorNumber}? All rooms and occupants on this floor will be removed.`,
      )
    ) {
      return;
    }
    void runAction(`del-floor-${floor.id}`, () => deleteFloor(floor.id));
  };

  const handleAddRoom = (floor: FloorData) => {
    const roomCount = floor.rooms.length + 1;
    const roomNum = `${floor.floorNumber}${roomCount < 10 ? "0" : ""}${roomCount}`;
    void runAction(`add-room-${floor.id}`, () =>
      createRoom(floor.id, roomNum, 2),
    );
  };

  const handleSaveRoom = async (room: RoomData) => {
    const clientErrors = validateRoom(room, floors);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors((prev) => ({
        ...prev,
        rooms: { ...prev.rooms, [room.id]: clientErrors },
      }));
      return;
    }
    if (!isRoomDirty(room, savedFloors)) return;

    setActionKey(`room-${room.id}`);
    try {
      const res = await updateRoom(room.id, room.number, room.capacity);
      toast.success(res.message);
      setFieldErrors((prev) => ({
        ...prev,
        rooms: { ...prev.rooms, [room.id]: {} },
      }));
      await loadData({ keepEditing: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save room.";
      const mapped = mapRoomServerError(msg);
      if (mapped) {
        setFieldErrors((prev) => ({
          ...prev,
          rooms: { ...prev.rooms, [room.id]: mapped },
        }));
      } else {
        toast.error(msg);
      }
    } finally {
      setActionKey(null);
    }
  };

  const handleDeleteRoom = (room: RoomData) => {
    if (
      !confirm(
        `Delete Room ${room.number}? All occupants in this room will be removed.`,
      )
    ) {
      return;
    }
    void runAction(`del-room-${room.id}`, () => deleteRoom(room.id));
  };

  const clearNewOccupantError = (roomId: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev.newOccupant };
      delete next[roomId];
      return { ...prev, newOccupant: next };
    });
  };

  const handleAddOccupant = async (room: RoomData) => {
    const name = newOccupantNames[room.id] ?? "";
    const clientErrors = validateOccupantName(name);
    if (clientErrors.name) {
      setFieldErrors((prev) => ({
        ...prev,
        newOccupant: { ...prev.newOccupant, [room.id]: clientErrors.name! },
      }));
      return;
    }

    clearNewOccupantError(room.id);

    setActionKey(`add-occ-${room.id}`);
    try {
      const res = await createOccupant(room.id, name);
      toast.success(res.message);
      setNewOccupantNames((prev) => ({ ...prev, [room.id]: "" }));
      await loadData({ keepEditing: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to add occupant.";
      const mapped = mapOccupantServerError(msg);
      if (mapped?.name) {
        setFieldErrors((prev) => ({
          ...prev,
          newOccupant: { ...prev.newOccupant, [room.id]: mapped.name! },
        }));
      } else {
        toast.error(msg);
      }
    } finally {
      setActionKey(null);
    }
  };

  const handleSaveOccupant = async (
    occupantId: string,
    name: string,
    status: "OCCUPIED" | "RESERVED",
  ) => {
    const clientErrors = validateOccupantName(name);
    if (clientErrors.name) {
      setFieldErrors((prev) => ({
        ...prev,
        occupants: {
          ...prev.occupants,
          [occupantId]: clientErrors,
        },
      }));
      return;
    }

    const occ = { id: occupantId, name, status, userId: null };
    if (!isOccupantDirty(occ, savedFloors)) return;

    setActionKey(`occ-${occupantId}`);
    try {
      const res = await updateOccupant(occupantId, name, status);
      toast.success(res.message);
      setFieldErrors((prev) => ({
        ...prev,
        occupants: { ...prev.occupants, [occupantId]: {} },
      }));
      await loadData({ keepEditing: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save occupant.";
      const mapped = mapOccupantServerError(msg);
      if (mapped) {
        setFieldErrors((prev) => ({
          ...prev,
          occupants: { ...prev.occupants, [occupantId]: mapped },
        }));
      } else {
        toast.error(msg);
      }
    } finally {
      setActionKey(null);
    }
  };

  const handleDeleteOccupant = (occupantId: string, name: string) => {
    if (!confirm(`Remove occupant "${name}"?`)) return;
    void runAction(`del-occ-${occupantId}`, () => deleteOccupant(occupantId));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm text-zinc-400">Loading occupancy database...</p>
      </div>
    );
  }

  const totalFloors = floors.length;
  const totalRooms = floors.reduce((sum, f) => sum + f.rooms.length, 0);
  const totalBeds = floors.reduce(
    (sum, f) => sum + f.rooms.reduce((rSum, r) => rSum + r.capacity, 0),
    0,
  );
  const totalOccupants = floors.reduce(
    (sum, f) => sum + f.rooms.reduce((rSum, r) => rSum + r.occupants.length, 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Admin Control
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            PG Occupancy Administration
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage floors, rooms, and occupants individually. Seed sample data
            for a fresh layout, or edit entities one at a time.
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
            <span>Total Floors</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalFloors}</div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
            <span>Total Rooms</span>
            <DoorOpen className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalRooms}</div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
            <span>Total Beds</span>
            <BedSingle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalBeds}</div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-1 text-xs">
            <span>Occupants</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalOccupants}</div>
        </div>
      </div>

      {/* VIEW MODE */}
      {!isEditing && floors.length > 0 && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                Current PG Building Layout
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Click &ldquo;Edit Layout&rdquo; to modify individual floors,
                rooms, or occupants.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteLayout}
                disabled={deletingLayout}
                className="inline-flex items-center gap-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all border border-rose-500/40 cursor-pointer disabled:opacity-50"
              >
                {deletingLayout ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Layout
              </button>

              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" /> Edit Layout
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {floors.map((floor) => (
              <div
                key={floor.id}
                className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    Floor {floor.floorNumber}
                  </h3>
                  <span className="text-xs text-indigo-300 bg-indigo-950/80 border border-indigo-500/30 px-3 py-1 rounded-full font-semibold">
                    {floor.rooms.length} Rooms
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {floor.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center font-bold text-white">
                        <span>Room {room.number}</span>
                        <span className="text-zinc-400 font-normal">
                          {room.type} ({room.occupants.length}/{room.capacity})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {room.occupants.map((occ) => (
                          <div
                            key={occ.id}
                            className="bg-zinc-950 px-2.5 py-1.5 rounded-lg text-zinc-300 font-medium flex items-center gap-2"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${occ.status === "RESERVED" ? "bg-amber-400" : "bg-emerald-400"}`}
                            />
                            {occ.name}
                          </div>
                        ))}
                        {Array.from({
                          length: room.capacity - room.occupants.length,
                        }).map((_, idx) => (
                          <div
                            key={`vacant-${idx}`}
                            className="bg-emerald-950/20 border border-emerald-500/20 border-dashed px-2.5 py-1.5 rounded-lg text-emerald-400/80 italic text-[11px]"
                          >
                            Vacant Bed
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!isEditing && floors.length === 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-12 shadow-xl flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">No PG Data Yet</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              No floors or rooms have been configured. Add your first floor to
              get started, or seed sample data.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Add PG Data
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODE — per-entity save/delete */}
      {isEditing && (
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {floors.length === 0
                    ? "Add PG Data"
                    : "Edit PG Configuration"}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Save or delete each room and occupant individually. Save
                  buttons activate only when changes are made.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-xl border border-zinc-700 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>

            {floors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <Building2 className="w-8 h-8 text-zinc-600" />
                <p className="text-sm text-zinc-500">
                  No floors yet. Click &ldquo;Add Floor&rdquo; below to start.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {floors.map((floor, fIdx) => (
                  <div
                    key={floor.id}
                    className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
                      <div className="px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                        Floor #{floor.floorNumber}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddRoom(floor)}
                          disabled={actionKey === `add-room-${floor.id}`}
                          className="text-xs bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer font-semibold disabled:opacity-50"
                        >
                          {actionKey === `add-room-${floor.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          Add Room
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFloor(floor)}
                          disabled={actionKey === `del-floor-${floor.id}`}
                          className="text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 p-1.5 rounded-lg cursor-pointer disabled:opacity-50"
                          title="Delete Floor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {floor.rooms.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-2 text-center border border-dashed border-zinc-800 rounded-xl">
                        <DoorOpen className="w-6 h-6 text-zinc-600" />
                        <p className="text-xs text-zinc-500">
                          No rooms on this floor. Click &ldquo;Add Room&rdquo;.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {floor.rooms.map((room, rIdx) => {
                          const roomErrors = {
                            ...fieldErrors.rooms[room.id],
                            ...validateRoom(room, floors),
                          };
                          const roomDirty = isRoomDirty(room, savedFloors);
                          const roomValid =
                            Object.keys(validateRoom(room, floors)).length ===
                            0;
                          const canSaveRoom =
                            roomDirty &&
                            roomValid &&
                            actionKey !== `room-${room.id}`;

                          return (
                            <div
                              key={room.id}
                              className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-4 shadow-md"
                            >
                              <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2.5">
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-semibold text-zinc-400 mt-1">
                                    Room
                                  </span>
                                  <div>
                                    <input
                                      type="text"
                                      required
                                      value={room.number}
                                      onChange={(e) =>
                                        updateRoomField(
                                          fIdx,
                                          rIdx,
                                          "number",
                                          e.target.value,
                                        )
                                      }
                                      className={`w-20 bg-zinc-950 border rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none ${inputErrorClass(!!roomErrors.number)}`}
                                    />
                                    <FieldError message={roomErrors.number} />
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <label className="text-[11px] text-zinc-400">
                                        Cap:
                                      </label>
                                      <select
                                        value={room.capacity}
                                        onChange={(e) =>
                                          updateRoomField(
                                            fIdx,
                                            rIdx,
                                            "capacity",
                                            Number(e.target.value),
                                          )
                                        }
                                        className={`bg-zinc-950 border rounded-lg px-2 py-1 text-xs text-white focus:outline-none ${inputErrorClass(!!roomErrors.capacity)}`}
                                      >
                                        <option value={1}>1 (Single)</option>
                                        <option value={2}>2 (Double)</option>
                                        <option value={3}>3 (Triple)</option>
                                        <option value={4}>4 (Quad)</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveRoom(room)}
                                        disabled={!canSaveRoom}
                                        className={`p-1 disabled:opacity-30 disabled:cursor-not-allowed ${
                                          canSaveRoom
                                            ? "text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                            : "text-emerald-400/40"
                                        }`}
                                        title={
                                          !roomDirty
                                            ? "No changes to save"
                                            : !roomValid
                                              ? "Fix validation errors"
                                              : "Save Room"
                                        }
                                      >
                                        {actionKey === `room-${room.id}` ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Save className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteRoom(room)}
                                        disabled={
                                          actionKey === `del-room-${room.id}`
                                        }
                                        className="text-rose-400 hover:text-rose-300 p-1 disabled:opacity-50"
                                        title="Delete Room"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <FieldError message={roomErrors.capacity} />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="text-[11px] text-zinc-400 font-semibold">
                                  Occupants ({room.occupants.length}/
                                  {room.capacity})
                                </div>

                                {room.occupants.map((occ, oIdx) => {
                                  const occErrors =
                                    fieldErrors.occupants[occ.id] ?? {};
                                  const occDirty = isOccupantDirty(
                                    occ,
                                    savedFloors,
                                  );
                                  const occValid =
                                    Object.keys(validateOccupantName(occ.name))
                                      .length === 0;
                                  const canSaveOcc =
                                    occDirty &&
                                    occValid &&
                                    actionKey !== `occ-${occ.id}`;

                                  return (
                                    <div key={occ.id} className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={occ.name}
                                          onChange={(e) =>
                                            updateOccupantField(
                                              fIdx,
                                              rIdx,
                                              oIdx,
                                              "name",
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Occupant Full Name"
                                          className={`flex-1 min-w-0 bg-zinc-950 border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none ${inputErrorClass(!!occErrors.name)}`}
                                        />
                                        <select
                                          value={occ.status}
                                          onChange={(e) =>
                                            updateOccupantField(
                                              fIdx,
                                              rIdx,
                                              oIdx,
                                              "status",
                                              e.target.value,
                                            )
                                          }
                                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                                        >
                                          <option value="OCCUPIED">
                                            Occupied
                                          </option>
                                          <option value="RESERVED">
                                            Reserved
                                          </option>
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSaveOccupant(
                                              occ.id,
                                              occ.name,
                                              occ.status,
                                            )
                                          }
                                          disabled={!canSaveOcc}
                                          className={`p-1 disabled:opacity-30 disabled:cursor-not-allowed ${
                                            canSaveOcc
                                              ? "text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                              : "text-emerald-400/40"
                                          }`}
                                          title={
                                            !occDirty
                                              ? "No changes to save"
                                              : !occValid
                                                ? "Fix validation errors"
                                                : "Save Occupant"
                                          }
                                        >
                                          {actionKey === `occ-${occ.id}` ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Save className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteOccupant(
                                              occ.id,
                                              occ.name,
                                            )
                                          }
                                          disabled={
                                            actionKey === `del-occ-${occ.id}`
                                          }
                                          className="text-rose-400 hover:text-rose-300 p-1 disabled:opacity-50"
                                          title="Remove Occupant"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <FieldError message={occErrors.name} />
                                    </div>
                                  );
                                })}

                                {room.occupants.length < room.capacity && (
                                  <div className="space-y-0.5 pt-1">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={newOccupantNames[room.id] ?? ""}
                                        onChange={(e) => {
                                          setNewOccupantNames((prev) => ({
                                            ...prev,
                                            [room.id]: e.target.value,
                                          }));
                                          clearNewOccupantError(room.id);
                                        }}
                                        placeholder="New occupant name"
                                        className={`flex-1 bg-zinc-950 border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none ${inputErrorClass(!!fieldErrors.newOccupant[room.id])}`}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            void handleAddOccupant(room);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleAddOccupant(room)
                                        }
                                        disabled={
                                          actionKey === `add-occ-${room.id}`
                                        }
                                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      >
                                        {actionKey === `add-occ-${room.id}` ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Plus className="w-3 h-3" />
                                        )}
                                        Add
                                      </button>
                                    </div>
                                    <FieldError
                                      message={fieldErrors.newOccupant[room.id]}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={handleAddFloor}
                disabled={actionKey === "add-floor"}
                className="inline-flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {actionKey === "add-floor" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Floor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
