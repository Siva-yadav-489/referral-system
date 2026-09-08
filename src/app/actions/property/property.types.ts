import { properties, floors, rooms, beds } from "@/db/schema";
import { z } from "zod";

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Floor = typeof floors.$inferSelect;
export type NewFloor = typeof floors.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Bed = typeof beds.$inferSelect;
export type NewBed = typeof beds.$inferInsert;

export const zodCreatePropertySchema = z.object({
  name: z.string().min(2, "Property name required"),
  address: z.string().min(5, "Address required"),
  contactNo: z.string().min(10, "Valid contact number required"),
  noOfFloors: z
    .number()
    .int()
    .min(1, "Number of floors required")
    .max(7, "Number of floors cannot exceed 7"),
});

export const zodCreateFloorSchema = z.object({
  propertyId: z.string().min(1, "Property ID required"),
  floorNumber: z.number().int().min(0, "Floor number required"),
});

export const zodCreateRoomSchema = z.object({
  propertyId: z.string().min(1, "Property ID required"),
  floorId: z.string().min(1, "Floor ID required"),
  roomNumber: z.string().min(1, "Room number required"),
  type: z.enum(["2-Sharing", "3-Sharing"]),
  capacity: z.coerce
    .number()
    .int()
    .min(2, "Capacity must be at least 2")
    .max(3, "Capacity must be at most 3"),
});

export type RoomResponse = {
  success: boolean;
  data?: Room;
  error?: string;
};

export type PropertyResponse = {
  success: boolean;
  data?: Property;
  error?: string;
};

export type PropertiesResponse = {
  success: boolean;
  data?: Property[];
  error?: string;
};

export type PropertyWithStructure = Property & {
  floors: (Floor & {
    rooms: (Room & {
      beds: Bed[];
    })[];
  })[];
};

export type PropertyStructureResponse = {
  success: boolean;
  data?: PropertyWithStructure;
  error?: string;
};

export type BedWithRoomDetails = Bed & {
  room: Room;
};
