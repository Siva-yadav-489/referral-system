"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, asc, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export interface OccupantData {
  id: string;
  name: string;
  userId?: string | null;
  status: "OCCUPIED" | "RESERVED";
}

export interface RoomData {
  id: string;
  number: string;
  type: "1-Sharing" | "2-Sharing" | "3-Sharing" | "4-Sharing";
  capacity: number;
  occupants: OccupantData[];
}

export interface FloorData {
  id: string;
  floorNumber: number;
  rooms: RoomData[];
}

type RoomType = RoomData["type"];

function capacityToType(capacity: number): RoomType {
  if (capacity === 1) return "1-Sharing";
  if (capacity === 2) return "2-Sharing";
  if (capacity === 3) return "3-Sharing";
  return "4-Sharing";
}

function revalidateOccupancyPaths() {
  revalidatePath("/dashboard/occupancy");
  revalidatePath("/admin");
}

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin role required.");
  }

  return session;
}

/**
 * Fetch all PG occupancy data from PostgreSQL
 */
export async function getOccupancyData(): Promise<FloorData[]> {
  try {
    const fetchedFloors = await db
      .select()
      .from(schema.floors)
      .orderBy(asc(schema.floors.floorNumber));

    const result: FloorData[] = [];

    for (const floor of fetchedFloors) {
      const fetchedRooms = await db
        .select()
        .from(schema.rooms)
        .where(eq(schema.rooms.floorId, floor.id))
        .orderBy(asc(schema.rooms.roomNumber));

      const roomsData: RoomData[] = [];

      for (const room of fetchedRooms) {
        const fetchedOccupants = await db
          .select()
          .from(schema.occupancies)
          .where(eq(schema.occupancies.roomId, room.id));

        roomsData.push({
          id: room.id,
          number: room.roomNumber,
          type: room.type,
          capacity: room.capacity,
          occupants: fetchedOccupants.map((occ) => ({
            id: occ.id,
            name: occ.occupantName,
            userId: occ.userId,
            status: occ.status,
          })),
        });
      }

      result.push({
        id: floor.id,
        floorNumber: floor.floorNumber,
        rooms: roomsData,
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching occupancy data:", error);
    return [];
  }
}

/**
 * Check if the currently logged-in user has ADMIN role
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session?.user?.role === "ADMIN";
  } catch {
    return false;
  }
}

/** Delete the entire PG layout (floors, rooms, occupants). */
export async function deleteAllOccupancyLayout() {
  await requireAdmin();

  await db.transaction(async (tx) => {
    await tx.delete(schema.occupancies);
    await tx.delete(schema.rooms);
    await tx.delete(schema.floors);
  });

  revalidateOccupancyPaths();
  return { success: true, message: "PG layout deleted successfully." };
}

/** Create a new floor. */
export async function createFloor(floorNumber: number) {
  await requireAdmin();

  if (floorNumber < 1) {
    throw new Error("Floor number must be at least 1.");
  }

  const floorId = `floor_${crypto.randomUUID()}`;
  await db.insert(schema.floors).values({
    id: floorId,
    floorNumber,
  });

  revalidateOccupancyPaths();
  return { success: true, message: "Floor created.", id: floorId };
}

/** Update an existing floor. */
export async function updateFloor(
  floorId: string,
  floorNumber: number,
  level: string,
) {
  await requireAdmin();

  const trimmedLevel = level.trim();
  if (!trimmedLevel) {
    throw new Error("Floor label is required.");
  }
  if (floorNumber < 1) {
    throw new Error("Floor number must be at least 1.");
  }

  const [existing] = await db
    .select()
    .from(schema.floors)
    .where(eq(schema.floors.id, floorId))
    .limit(1);

  if (!existing) {
    throw new Error("Floor not found.");
  }

  await db
    .update(schema.floors)
    .set({ floorNumber, updatedAt: new Date() })
    .where(eq(schema.floors.id, floorId));

  revalidateOccupancyPaths();
  return { success: true, message: "Floor updated." };
}

/** Delete a floor and all its rooms/occupants (cascade). */
export async function deleteFloor(floorId: string) {
  await requireAdmin();

  const [existing] = await db
    .select()
    .from(schema.floors)
    .where(eq(schema.floors.id, floorId))
    .limit(1);

  if (!existing) {
    throw new Error("Floor not found.");
  }

  await db.delete(schema.floors).where(eq(schema.floors.id, floorId));

  revalidateOccupancyPaths();
  return { success: true, message: "Floor deleted." };
}

/** Create a new room on a floor. */
export async function createRoom(
  floorId: string,
  roomNumber: string,
  capacity: number,
) {
  await requireAdmin();

  const trimmedNumber = roomNumber.trim();
  if (!trimmedNumber) {
    throw new Error("Room number is required.");
  }
  if (capacity < 1 || capacity > 4) {
    throw new Error("Capacity must be between 1 and 4.");
  }

  const [floor] = await db
    .select()
    .from(schema.floors)
    .where(eq(schema.floors.id, floorId))
    .limit(1);

  if (!floor) {
    throw new Error("Floor not found.");
  }

  const [duplicate] = await db
    .select({ id: schema.rooms.id })
    .from(schema.rooms)
    .where(eq(schema.rooms.roomNumber, trimmedNumber))
    .limit(1);

  if (duplicate) {
    throw new Error(`Room number "${trimmedNumber}" is already in use.`);
  }

  const roomId = `room_${crypto.randomUUID()}`;
  await db.insert(schema.rooms).values({
    id: roomId,
    floorId,
    roomNumber: trimmedNumber,
    type: capacityToType(capacity),
    capacity,
  });

  revalidateOccupancyPaths();
  return { success: true, message: "Room created.", id: roomId };
}

/** Update an existing room. */
export async function updateRoom(
  roomId: string,
  roomNumber: string,
  capacity: number,
) {
  await requireAdmin();

  const trimmedNumber = roomNumber.trim();
  if (!trimmedNumber) {
    throw new Error("Room number is required.");
  }
  if (capacity < 1 || capacity > 4) {
    throw new Error("Capacity must be between 1 and 4.");
  }

  const [room] = await db
    .select()
    .from(schema.rooms)
    .where(eq(schema.rooms.id, roomId))
    .limit(1);

  if (!room) {
    throw new Error("Room not found.");
  }

  const occupants = await db
    .select()
    .from(schema.occupancies)
    .where(eq(schema.occupancies.roomId, roomId));

  if (occupants.length > capacity) {
    throw new Error(
      `Cannot reduce capacity below current occupant count (${occupants.length}). Remove occupants first.`,
    );
  }

  if (trimmedNumber !== room.roomNumber) {
    const [duplicate] = await db
      .select({ id: schema.rooms.id })
      .from(schema.rooms)
      .where(
        and(
          eq(schema.rooms.roomNumber, trimmedNumber),
          ne(schema.rooms.id, roomId),
        ),
      )
      .limit(1);

    if (duplicate) {
      throw new Error(`Room number "${trimmedNumber}" is already in use.`);
    }
  }

  await db
    .update(schema.rooms)
    .set({
      roomNumber: trimmedNumber,
      capacity,
      type: capacityToType(capacity),
      updatedAt: new Date(),
    })
    .where(eq(schema.rooms.id, roomId));

  revalidateOccupancyPaths();
  return { success: true, message: "Room updated." };
}

/** Delete a room and its occupants (cascade). */
export async function deleteRoom(roomId: string) {
  await requireAdmin();

  const [existing] = await db
    .select()
    .from(schema.rooms)
    .where(eq(schema.rooms.id, roomId))
    .limit(1);

  if (!existing) {
    throw new Error("Room not found.");
  }

  await db.delete(schema.rooms).where(eq(schema.rooms.id, roomId));

  revalidateOccupancyPaths();
  return { success: true, message: "Room deleted." };
}

/** Add an occupant to a room. */
export async function createOccupant(roomId: string, occupantName: string) {
  await requireAdmin();

  const trimmedName = occupantName.trim();
  if (!trimmedName) {
    throw new Error("Occupant name is required.");
  }

  const [room] = await db
    .select()
    .from(schema.rooms)
    .where(eq(schema.rooms.id, roomId))
    .limit(1);

  if (!room) {
    throw new Error("Room not found.");
  }

  const occupants = await db
    .select()
    .from(schema.occupancies)
    .where(eq(schema.occupancies.roomId, roomId));

  if (occupants.length >= room.capacity) {
    throw new Error(
      `Room ${room.roomNumber} is full (capacity ${room.capacity}).`,
    );
  }

  const occupantId = `occ_${crypto.randomUUID()}`;
  await db.insert(schema.occupancies).values({
    id: occupantId,
    roomId,
    occupantName: trimmedName,
    status: "OCCUPIED",
  });

  revalidateOccupancyPaths();
  return { success: true, message: "Occupant added.", id: occupantId };
}

/** Update an occupant's name or status. */
export async function updateOccupant(
  occupantId: string,
  occupantName: string,
  status: "OCCUPIED" | "RESERVED" = "OCCUPIED",
) {
  await requireAdmin();

  const trimmedName = occupantName.trim();
  if (!trimmedName) {
    throw new Error("Occupant name is required.");
  }

  const [existing] = await db
    .select()
    .from(schema.occupancies)
    .where(eq(schema.occupancies.id, occupantId))
    .limit(1);

  if (!existing) {
    throw new Error("Occupant not found.");
  }

  await db
    .update(schema.occupancies)
    .set({ occupantName: trimmedName, status })
    .where(eq(schema.occupancies.id, occupantId));

  revalidateOccupancyPaths();
  return { success: true, message: "Occupant updated." };
}

/** Remove an occupant from a room. */
export async function deleteOccupant(occupantId: string) {
  await requireAdmin();

  const [existing] = await db
    .select()
    .from(schema.occupancies)
    .where(eq(schema.occupancies.id, occupantId))
    .limit(1);

  if (!existing) {
    throw new Error("Occupant not found.");
  }

  await db
    .delete(schema.occupancies)
    .where(eq(schema.occupancies.id, occupantId));

  revalidateOccupancyPaths();
  return { success: true, message: "Occupant removed." };
}

/**
 * Server Action: Reserve a Bed in a Room (For Logged-in Users)
 */
export async function reserveBedAction(roomId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Please sign in to reserve a bed.");
  }

  const [room] = await db
    .select()
    .from(schema.rooms)
    .where(eq(schema.rooms.id, roomId))
    .limit(1);

  if (!room) {
    throw new Error("Room not found.");
  }

  const currentOccupants = await db
    .select()
    .from(schema.occupancies)
    .where(eq(schema.occupancies.roomId, roomId));

  if (currentOccupants.length >= room.capacity) {
    throw new Error("This room is already fully occupied.");
  }

  await db.insert(schema.occupancies).values({
    id: `occ_${crypto.randomUUID()}`,
    roomId: roomId,
    userId: session.user.id,
    occupantName: session.user.name || "Reserved Guest",
    status: "RESERVED",
  });

  revalidateOccupancyPaths();
  return { success: true, message: `Bed reserved in Room ${room.roomNumber}!` };
}
