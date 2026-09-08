import { db } from "@/db";
import {
  Bed,
  Floor,
  NewBed,
  NewFloor,
  NewProperty,
  NewRoom,
  Property,
  Room,
} from "./property.types";
import { beds, floors, properties, rooms } from "@/db/schema";
import { eq } from "drizzle-orm";

export class PropertyModel {
  static async createProperty(data: NewProperty): Promise<Property> {
    const [newProperty] = await db.insert(properties).values(data).returning();

    return newProperty;
  }

  static async createFloor(data: NewFloor): Promise<Floor> {
    const [newFloor] = await db.insert(floors).values(data).returning();
    return newFloor;
  }

  static async createRoom(data: NewRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(data).returning();
    return newRoom;
  }

  static async createBed(data: NewBed): Promise<Bed> {
    const [newBed] = await db.insert(beds).values(data).returning();
    return newBed;
  }

  static async updateProperty(
    id: string,
    data: Partial<Property>,
  ): Promise<Property> {
    const [updatedProperty] = await db
      .update(properties)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  static async updateRoom(id: string, data: Partial<Room>): Promise<Room> {
    const [updatedRoom] = await db
      .update(rooms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();
    return updatedRoom;
  }

  static async updateBed(id: string, data: Partial<Bed>): Promise<Bed> {
    const [updatedBed] = await db
      .update(beds)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(beds.id, id))
      .returning();
    return updatedBed;
  }

  static async deleteProperty(id: string): Promise<Property> {
    const [deletedProperty] = await db
      .delete(properties)
      .where(eq(properties.id, id))
      .returning();
    return deletedProperty;
  }

  static async deleteFloor(id: string): Promise<Floor> {
    const [deletedFloor] = await db
      .delete(floors)
      .where(eq(floors.id, id))
      .returning();
    return deletedFloor;
  }

  static async deleteRoom(id: string): Promise<Room> {
    const [deletedRoom] = await db
      .delete(rooms)
      .where(eq(rooms.id, id))
      .returning();
    return deletedRoom;
  }

  static async deleteBed(id: string): Promise<Bed> {
    const [deletedBed] = await db
      .delete(beds)
      .where(eq(beds.id, id))
      .returning();
    return deletedBed;
  }

  static async getAllProperties(): Promise<Property[]> {
    const allProperties = await db.select().from(properties);
    return allProperties;
  }

  static async getPropertyById(id: string): Promise<Property> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id));
    return property;
  }

  static async getFloorById(id: string): Promise<Floor> {
    const [floor] = await db.select().from(floors).where(eq(floors.id, id));
    return floor;
  }

  static async getRoomById(id: string): Promise<Room> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  static async getBedById(id: string): Promise<Bed> {
    const [bed] = await db.select().from(beds).where(eq(beds.id, id));
    return bed;
  }

  static async getPropertiesByOwnerId(ownerId: string): Promise<Property[]> {
    const allOwnerProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, ownerId));
    return allOwnerProperties;
  }

  static async getFloorsByPropertyId(propertyId: string): Promise<Floor[]> {
    const allFloors = await db
      .select()
      .from(floors)
      .where(eq(floors.propertyId, propertyId));
    return allFloors;
  }

  static async getAllRoomsByFloorId(floorId: string): Promise<Room[]> {
    const allRooms = await db
      .select()
      .from(rooms)
      .where(eq(rooms.floorId, floorId));
    return allRooms;
  }

  static async getAllRoomsByPropertyId(propertyId: string): Promise<Room[]> {
    const allRooms = await db
      .select()
      .from(rooms)
      .where(eq(rooms.propertyId, propertyId));
    return allRooms;
  }

  static async getAllBedsByPropertyId(propertyId: string): Promise<Bed[]> {
    const allBeds = await db
      .select()
      .from(beds)
      .where(eq(beds.propertyId, propertyId));
    return allBeds;
  }

  static async getAllBedsByFloorId(floorId: string): Promise<Bed[]> {
    const allBeds = await db
      .select()
      .from(beds)
      .where(eq(beds.floorId, floorId));
    return allBeds;
  }

  static async getAllBedsByRoomId(roomId: string): Promise<Bed[]> {
    const allBeds = await db.select().from(beds).where(eq(beds.roomId, roomId));
    return allBeds;
  }

  static async getPropertyWithStructure(propertyId: string) {
    return await db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
      with: {
        floors: {
          orderBy: (floors, { asc }) => [asc(floors.floorNumber)],
          with: {
            rooms: {
              orderBy: (rooms, { asc }) => [asc(rooms.roomNumber)],
              with: {
                beds: {
                  orderBy: (beds, { asc }) => [asc(beds.bedNumber)],
                },
              },
            },
          },
        },
      },
    });
  }
}
