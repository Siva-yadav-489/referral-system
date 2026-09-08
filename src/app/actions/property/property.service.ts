import { db } from "@/db";
import { rooms, beds, properties, floors } from "@/db/schema";
import { eq } from "drizzle-orm";
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
      const property = await PropertyModel.getPropertyById(
        validatedData.propertyId,
      );
      if (!property) {
        throw new Error("Property not found");
      }
      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }
      const newFloor = await PropertyModel.createFloor({
        id: crypto.randomUUID(),
        ...validatedData,
      });
      return { success: true, data: newFloor };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create floor",
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

  static async updateRoom(
    ownerId: string,
    roomId: string,
    input: Partial<z.infer<typeof zodCreateRoomSchema>>,
  ) {
    try {
      const validatedData = zodCreateRoomSchema.partial().parse(input);
      const room = await PropertyModel.getRoomById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }
      const property = await PropertyModel.getPropertyById(room.propertyId);
      if (!property) {
        throw new Error("Property not found");
      }
      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }
      const updatedRoom = await PropertyModel.updateRoom(roomId, validatedData);
      return { success: true, data: updatedRoom };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update room",
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
      if (status !== "MAINTENANCE" && status !== "VACANT" && status !== "OCCUPIED") {
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
      twoSharingCount: number;
      threeSharingCount: number;
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

      let highestNum = 0;
      const floorNum = floor.floorNumber;
      for (const r of existingRooms) {
        const match = r.roomNumber.match(/\d+$/);
        if (match) {
          const val = parseInt(match[0], 10);
          const suffix = val >= floorNum * 100 ? val - floorNum * 100 : val;
          if (suffix > highestNum) highestNum = suffix;
        }
      }

      const totalToCreate =
        (input.twoSharingCount || 0) + (input.threeSharingCount || 0);
      if (totalToCreate <= 0) {
        throw new Error("At least one room count must be greater than 0");
      }

      return await db.transaction(async (tx) => {
        const createdRooms = [];
        let curSuffix = highestNum;

        for (let i = 0; i < (input.twoSharingCount || 0); i++) {
          curSuffix++;
          const roomNumber = `${floorNum}${curSuffix < 10 ? `0${curSuffix}` : curSuffix}`;
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

        for (let i = 0; i < (input.threeSharingCount || 0); i++) {
          curSuffix++;
          const roomNumber = `${floorNum}${curSuffix < 10 ? `0${curSuffix}` : curSuffix}`;
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
