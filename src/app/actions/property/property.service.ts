import { db } from "@/db";
import { rooms, beds, properties, floors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import {
  zodCreatePropertySchema,
  zodCreateFloorSchema,
  zodCreateRoomSchema,
  PropertyResponse,
  PropertiesResponse,
  PropertyStructureResponse,
  PropertyWithStructure,
  RoomResponse,
  Room,
} from "./property.types";
import { PropertyModel } from "./property.model";

export class PropertyService {
  static async createProperty(
    ownerId: string,
    input: z.infer<typeof zodCreatePropertySchema>,
  ): Promise<PropertyResponse> {
    try {
      const validatedData = zodCreatePropertySchema.parse(input);

      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      return await db.transaction(async (tx) => {
        const [property] = await tx
          .insert(properties)
          .values({
            id: crypto.randomUUID(),
            ownerId,
            ...validatedData,
          })
          .returning();

        if (validatedData.noOfFloors) {
          const createdFloors = Array.from(
            { length: validatedData.noOfFloors },
            (_, index) => ({
              id: crypto.randomUUID(),
              propertyId: property.id,
              floorNumber: index + 1,
            }),
          );
          await tx.insert(floors).values(createdFloors);
        }

        return {
          success: true,
          data: property,
        };
      });
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create property",
      };
    }
  }

  static async updateProperty(
    ownerId: string,
    propertyId: string,
    input: Partial<z.infer<typeof zodCreatePropertySchema>>,
  ) {
    try {
      const validatedData = zodCreatePropertySchema.parse(input);
      const property = await PropertyModel.getPropertyById(propertyId);
      if (!property) {
        throw new Error("Property not found");
      }
      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }
      const updatedProperty = await PropertyModel.updateProperty(
        propertyId,
        validatedData,
      );
      return { success: true, data: updatedProperty };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update property",
      };
    }
  }

  static async deleteProperty(
    ownerId: string,
    propertyId: string,
  ): Promise<PropertyResponse> {
    try {
      const property = await PropertyModel.getPropertyById(propertyId);
      if (!property) {
        throw new Error("Property not found");
      }
      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }
      const deletedProperty = await PropertyModel.deleteProperty(propertyId);
      return { success: true, data: deletedProperty };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete property",
      };
    }
  }

  static async addFloor(
    ownerId: string,
    input: z.infer<typeof zodCreateFloorSchema>,
  ) {
    try {
      const validatedData = zodCreateFloorSchema.parse(input);
      if (!ownerId) {
        throw new Error("Unauthorized");
      }
      const property = await PropertyModel.getPropertyById(
        validatedData.propertyId,
      );
      if (!property) {
        throw new Error("Property not found");
      }
      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }

      const existingFloors = await PropertyModel.getFloorsByPropertyId(
        property.id,
      );

      if (existingFloors.length >= 7) {
        throw new Error("This property already has the maximum of 7 floors.");
      }

      const floorNumber = validatedData.floorNumber;

      const alreadyExists = existingFloors.some(
        (floor) => floor.floorNumber === floorNumber,
      );

      if (alreadyExists) {
        throw new Error(`Floor ${floorNumber} already exists.`);
      }

      const newFloor = await PropertyModel.createFloor({
        id: crypto.randomUUID(),
        propertyId: property.id,
        floorNumber,
      });

      return {
        success: true,
        data: newFloor,
      };
    } catch (error) {
      console.error("PropertyService.addFloor:", error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to add floor. Please try again.",
      };
    }
  }

  static async deleteFloor(ownerId: string, floorId: string) {
    try {
      const floor = await PropertyModel.getFloorById(floorId);
      if (!floor) {
        throw new Error("Floor not found");
      }
      const property = await PropertyModel.getPropertyById(floor.propertyId);
      if (!property) {
        throw new Error("Property not found");
      }
      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }
      const deletedFloor = await PropertyModel.deleteFloor(floorId);
      return { success: true, data: deletedFloor };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete floor",
      };
    }
  }

  static async addRoom(
    ownerId: string,
    input: z.infer<typeof zodCreateRoomSchema>,
  ): Promise<RoomResponse> {
    try {
      const validated = zodCreateRoomSchema.parse(input);
      if (!ownerId) {
        throw new Error("Unauthorized");
      }
      const floor = await PropertyModel.getFloorById(input.floorId);
      if (!floor) {
        throw new Error("Floor not found");
      }
      const property = await PropertyModel.getPropertyById(floor.propertyId);
      if (!property) {
        throw new Error("Property not found");
      }
      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }

      const existingRooms = await PropertyModel.getAllRoomsByFloorId(floor.id);

      if (existingRooms.length >= 10) {
        throw new Error(
          `Floor ${floor.floorNumber} already has the maximum of 10 rooms.`,
        );
      }

      const roomNumber = validated.roomNumber;

      const roomAlreadyExists = existingRooms.some(
        (room) => room.roomNumber === roomNumber,
      );

      if (roomAlreadyExists) {
        throw new Error(
          `Room ${roomNumber} already exists on Floor ${floor.floorNumber}.`,
        );
      }

      const expectedCapacity =
        validated.type === "1-Sharing"
          ? 1
          : validated.type === "2-Sharing"
            ? 2
            : 3;

      if (validated.capacity !== expectedCapacity) {
        throw new Error(
          `${validated.type} rooms must have exactly ${expectedCapacity} bed${expectedCapacity > 1 ? "s" : ""}.`,
        );
      }

      return await db.transaction(async (tx) => {
        const [room] = await tx
          .insert(rooms)
          .values({
            id: crypto.randomUUID(),
            ...validated,
          })
          .returning();

        const bedValues = Array.from(
          { length: validated.capacity },
          (_, index) => ({
            id: crypto.randomUUID(),
            propertyId: validated.propertyId,
            floorId: validated.floorId,
            roomId: room.id,
            bedNumber: `${validated.roomNumber}-${String.fromCharCode(
              65 + index,
            )}`,
            status: "VACANT" as const,
          }),
        );

        await tx.insert(beds).values(bedValues);

        return {
          success: true,
          data: room,
        };
      });
    } catch (error) {
      console.error("Error in PropertyService.addRoom:", error);
      let errorMsg =
        error instanceof Error ? error.message : "Failed to create room";
      if (
        errorMsg.includes("unique_floor_room") ||
        errorMsg.includes("duplicate key")
      ) {
        errorMsg = `Room "${input.roomNumber}" already exists on this floor. Please use a different room number.`;
      }
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  static async updateRoomType(
    ownerId: string,
    roomId: string,
    roomType: z.infer<typeof zodCreateRoomSchema>["type"],
  ) {
    try {
      const validatedData = z
        .object({ type: zodCreateRoomSchema.shape.type })
        .parse({ type: roomType });

      const room = await PropertyModel.getRoomById(roomId);

      if (!room) {
        throw new Error("Room not found.");
      }

      const property = await PropertyModel.getPropertyById(room.propertyId);

      if (!property) {
        throw new Error("Property not found.");
      }

      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized.");
      }

      const currentType = room.type;
      const newType = validatedData.type ?? currentType;

      const getCapacity = (type: string) => {
        if (type === "1-Sharing") return 1;
        if (type === "2-Sharing") return 2;
        return 3;
      };

      const oldCapacity = getCapacity(currentType);
      const newCapacity = getCapacity(newType);

      const typeChanged = currentType !== newType;

      if (!typeChanged) {
        return {
          success: false,
          error: "Type is already the same.",
        };
      }

      const updatedRoom = await db.transaction(async (tx) => {
        const existingBeds = await tx
          .select()
          .from(beds)
          .where(eq(beds.roomId, roomId))
          .orderBy(desc(beds.bedNumber));

        /** Reducing capacity (e.g., 3 -> 2, 3 -> 1, 2 -> 1) */
        if (newCapacity < oldCapacity) {
          const bedsToRemoveCount = oldCapacity - newCapacity;
          const sortedBeds = [...existingBeds].sort((a, b) =>
            b.bedNumber.localeCompare(a.bedNumber),
          );
          const bedsToRemove = sortedBeds.slice(0, bedsToRemoveCount);

          const nonVacantBed = bedsToRemove.find(
            (bed) => bed.status !== "VACANT",
          );
          if (nonVacantBed) {
            throw new Error(
              `Cannot change to ${newType} because bed ${nonVacantBed.bedNumber} is ${nonVacantBed.status.toLowerCase()}. Only vacant beds can be removed.`,
            );
          }

          for (const bed of bedsToRemove) {
            await tx.delete(beds).where(eq(beds.id, bed.id));
          }
        }

        /** Increasing capacity (e.g., 1 -> 2, 1 -> 3, 2 -> 3) */
        if (newCapacity > oldCapacity) {
          for (let i = oldCapacity; i < newCapacity; i++) {
            const letter = String.fromCharCode(65 + i);
            const bedNumber = `${room.roomNumber}-${letter}`;

            const bedExists = existingBeds.some(
              (b) => b.bedNumber === bedNumber,
            );
            if (!bedExists) {
              await tx.insert(beds).values({
                id: crypto.randomUUID(),
                roomId,
                propertyId: room.propertyId,
                floorId: room.floorId,
                bedNumber,
                status: "VACANT",
              });
            }
          }
        }

        /** Update room */
        const [updated] = await tx
          .update(rooms)
          .set({
            type: newType,
            capacity: newCapacity,
            updatedAt: new Date(),
          })
          .where(eq(rooms.id, roomId))
          .returning();

        return updated;
      });

      return {
        success: true,
        data: updatedRoom,
      };
    } catch (error) {
      console.error("updateRoom failed:", error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update room.",
      };
    }
  }

  static async deleteRoom(ownerId: string, roomId: string) {
    try {
      const room = await PropertyModel.getRoomById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }
      const floor = await PropertyModel.getFloorById(room.floorId);
      if (!floor) {
        throw new Error("Floor not found");
      }
      const property = await PropertyModel.getPropertyById(room.propertyId);
      if (!property) {
        throw new Error("Property not found");
      }
      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }
      const deletedRoom = await PropertyModel.deleteRoom(roomId);
      return { success: true, data: deletedRoom };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete room",
      };
    }
  }

  static async updateBedStatus(
    ownerId: string,
    bedId: string,
    status: "VACANT" | "OCCUPIED" | "MAINTENANCE",
  ) {
    try {
      if (
        status !== "MAINTENANCE" &&
        status !== "VACANT" &&
        status !== "OCCUPIED"
      ) {
        throw new Error("Invalid status");
      }
      const bed = await PropertyModel.getBedById(bedId);
      if (!bed) {
        throw new Error("Bed not found");
      }
      const room = await PropertyModel.getRoomById(bed.roomId);
      if (!room) {
        throw new Error("Room not found");
      }
      const floor = await PropertyModel.getFloorById(room.floorId);
      if (!floor) {
        throw new Error("Floor not found");
      }
      const property = await PropertyModel.getPropertyById(floor.propertyId);
      if (!property) {
        throw new Error("Property not found");
      }
      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }

      const updatedBed = await PropertyModel.updateBed(bedId, {
        status,
        updatedAt: new Date(),
      });
      return { success: true, data: updatedBed };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update bed status",
      };
    }
  }

  static async deleteBed(ownerId: string, bedId: string) {
    try {
      const bed = await PropertyModel.getBedById(bedId);
      if (!bed) {
        throw new Error("Bed not found");
      }
      const room = await PropertyModel.getRoomById(bed.roomId);
      if (!room) {
        throw new Error("Room not found");
      }
      const floor = await PropertyModel.getFloorById(room.floorId);
      if (!floor) {
        throw new Error("Floor not found");
      }
      const property = await PropertyModel.getPropertyById(floor.propertyId);
      if (!property) {
        throw new Error("Property not found");
      }
      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }
      const deletedBed = await PropertyModel.deleteBed(bedId);
      return { success: true, data: deletedBed };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete bed",
      };
    }
  }

  static async getProperties(ownerId: string): Promise<PropertiesResponse> {
    try {
      if (!ownerId) throw new Error("Unauthorized");
      const data = await PropertyModel.getPropertiesByOwnerId(ownerId);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch properties",
      };
    }
  }

  static async getPropertyDetails(
    ownerId: string,
    propertyId: string,
  ): Promise<PropertyStructureResponse> {
    try {
      if (!ownerId) throw new Error("Unauthorized");
      const property = await PropertyModel.getPropertyById(propertyId);
      if (!property) throw new Error("Property not found");
      if (property.ownerId !== ownerId) throw new Error("Unauthorized");

      const data = await PropertyModel.getPropertyWithStructure(propertyId);
      return { success: true, data: data as PropertyWithStructure };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch property details",
      };
    }
  }

  static async getPropertiesWithStats(ownerId: string) {
    try {
      if (!ownerId) throw new Error("Unauthorized");
      const ownerProperties = await db.query.properties.findMany({
        where: eq(properties.ownerId, ownerId),
        with: {
          floors: {
            with: {
              rooms: {
                with: {
                  beds: true,
                },
              },
            },
          },
        },
      });

      const data = ownerProperties.map((prop) => {
        let totalRooms = 0;
        let totalBeds = 0;
        let occupiedBeds = 0;
        let vacantBeds = 0;
        let maintenanceBeds = 0;

        for (const floor of prop.floors) {
          totalRooms += floor.rooms.length;
          for (const room of floor.rooms) {
            totalBeds += room.beds.length;
            for (const bed of room.beds) {
              if (bed.status === "OCCUPIED") occupiedBeds++;
              else if (bed.status === "VACANT") vacantBeds++;
              else if (bed.status === "MAINTENANCE") maintenanceBeds++;
            }
          }
        }

        const occupancyRate =
          totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

        return {
          id: prop.id,
          name: prop.name,
          address: prop.address,
          contactNo: prop.contactNo,
          ownerId: prop.ownerId,
          createdAt: prop.createdAt,
          updatedAt: prop.updatedAt,
          floorsCount: prop.floors.length,
          totalRooms,
          totalBeds,
          occupiedBeds,
          vacantBeds,
          maintenanceBeds,
          occupancyRate,
        };
      });

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch properties with stats",
      };
    }
  }

  static async addRoomsBulk(
    ownerId: string,
    input: {
      propertyId: string;
      floorId: string;
      oneSharingCount?: number;
      twoSharingCount?: number;
      threeSharingCount?: number;
    },
  ): Promise<{ success: boolean; data?: Room[]; error?: string }> {
    try {
      if (!ownerId) throw new Error("Unauthorized");
      const floor = await PropertyModel.getFloorById(input.floorId);
      if (!floor) throw new Error("Floor not found");
      const property = await PropertyModel.getPropertyById(floor.propertyId);
      if (!property) throw new Error("Property not found");
      if (property.ownerId !== ownerId) throw new Error("Unauthorized");

      const existingRooms = await PropertyModel.getAllRoomsByFloorId(
        input.floorId,
      );

      const oneCount = Math.max(0, input.oneSharingCount || 0);
      const twoCount = Math.max(0, input.twoSharingCount || 0);
      const threeCount = Math.max(0, input.threeSharingCount || 0);
      const totalToCreate = oneCount + twoCount + threeCount;

      if (totalToCreate <= 0) {
        throw new Error("At least one room count must be greater than 0");
      }

      if (existingRooms.length + totalToCreate > 10) {
        throw new Error(
          `Floor ${floor.floorNumber} only has ${10 - existingRooms.length} slot(s) remaining. Adding ${totalToCreate} rooms would exceed the maximum of 10 rooms per floor.`,
        );
      }

      const floorNum = floor.floorNumber;
      const usedSuffixes = new Set<number>();
      for (const r of existingRooms) {
        const match = r.roomNumber.match(/\d+$/);
        if (match) {
          const val = parseInt(match[0], 10);
          const suffix = val >= floorNum * 100 ? val - floorNum * 100 : val;
          usedSuffixes.add(suffix);
        }
      }

      const availableSuffixes: number[] = [];
      for (let i = 1; i <= 10; i++) {
        if (!usedSuffixes.has(i)) {
          availableSuffixes.push(i);
        }
      }

      if (availableSuffixes.length < totalToCreate) {
        throw new Error(
          `Floor ${floor.floorNumber} only has ${availableSuffixes.length} available room number slot(s) (1-10).`,
        );
      }

      return await db.transaction(async (tx) => {
        const createdRooms = [];

        // 1-Sharing Rooms (1 Bed: A)
        for (let i = 0; i < oneCount; i++) {
          const suffix = availableSuffixes.shift()!;
          const roomNumber = `${floorNum}${suffix < 10 ? `0${suffix}` : suffix}`;
          const [room] = await tx
            .insert(rooms)
            .values({
              id: crypto.randomUUID(),
              propertyId: input.propertyId,
              floorId: input.floorId,
              roomNumber,
              type: "1-Sharing",
              capacity: 1,
            })
            .returning();

          const bedValues = [
            {
              id: crypto.randomUUID(),
              propertyId: input.propertyId,
              floorId: input.floorId,
              roomId: room.id,
              bedNumber: `${roomNumber}-A`,
              status: "VACANT" as const,
            },
          ];
          await tx.insert(beds).values(bedValues);
          createdRooms.push(room);
        }

        // 2-Sharing Rooms (2 Beds: A, B)
        for (let i = 0; i < twoCount; i++) {
          const suffix = availableSuffixes.shift()!;
          const roomNumber = `${floorNum}${suffix < 10 ? `0${suffix}` : suffix}`;
          const [room] = await tx
            .insert(rooms)
            .values({
              id: crypto.randomUUID(),
              propertyId: input.propertyId,
              floorId: input.floorId,
              roomNumber,
              type: "2-Sharing",
              capacity: 2,
            })
            .returning();

          const bedValues = [
            {
              id: crypto.randomUUID(),
              propertyId: input.propertyId,
              floorId: input.floorId,
              roomId: room.id,
              bedNumber: `${roomNumber}-A`,
              status: "VACANT" as const,
            },
            {
              id: crypto.randomUUID(),
              propertyId: input.propertyId,
              floorId: input.floorId,
              roomId: room.id,
              bedNumber: `${roomNumber}-B`,
              status: "VACANT" as const,
            },
          ];
          await tx.insert(beds).values(bedValues);
          createdRooms.push(room);
        }

        // 3-Sharing Rooms (3 Beds: A, B, C)
        for (let i = 0; i < threeCount; i++) {
          const suffix = availableSuffixes.shift()!;
          const roomNumber = `${floorNum}${suffix < 10 ? `0${suffix}` : suffix}`;
          const [room] = await tx
            .insert(rooms)
            .values({
              id: crypto.randomUUID(),
              propertyId: input.propertyId,
              floorId: input.floorId,
              roomNumber,
              type: "3-Sharing",
              capacity: 3,
            })
            .returning();

          const bedValues = [
            {
              id: crypto.randomUUID(),
              propertyId: input.propertyId,
              floorId: input.floorId,
              roomId: room.id,
              bedNumber: `${roomNumber}-A`,
              status: "VACANT" as const,
            },
            {
              id: crypto.randomUUID(),
              propertyId: input.propertyId,
              floorId: input.floorId,
              roomId: room.id,
              bedNumber: `${roomNumber}-B`,
              status: "VACANT" as const,
            },
            {
              id: crypto.randomUUID(),
              propertyId: input.propertyId,
              floorId: input.floorId,
              roomId: room.id,
              bedNumber: `${roomNumber}-C`,
              status: "VACANT" as const,
            },
          ];
          await tx.insert(beds).values(bedValues);
          createdRooms.push(room);
        }

        return { success: true, data: createdRooms };
      });
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to add rooms in bulk",
      };
    }
  }
}
