import {
  EnquiriesResponse,
  Enquiry,
  EnquiryResponse,
  zodCreateEnquirySchema,
  zodGetEnquiriesFilterSchema,
} from "./enquiry.types";
import { z } from "zod";
import { PropertyModel } from "../property/property.model";
import { EnquiryModel } from "./enquiry.model";

export class EnquiryService {
  static async createEnquiry(
    input: z.infer<typeof zodCreateEnquirySchema>,
  ): Promise<EnquiryResponse> {
    try {
      const validated = zodCreateEnquirySchema.parse(input);

      const property = await PropertyModel.getPropertyById(
        validated.propertyId,
      );

      if (!property) {
        throw new Error("Property not found");
      }

      const data = await EnquiryModel.createEnquiry({
        id: crypto.randomUUID(),
        ownerId: property.ownerId,
        propertyId: validated.propertyId,
        name: validated.name,
        contactNo: validated.contactNo,
        email: validated.email,
        roomType: validated.roomType,
        message: validated.message,
      });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create enquiry",
      };
    }
  }

  static async getOwnerEnquiries(
    ownerId: string,
    filter?: z.infer<typeof zodGetEnquiriesFilterSchema>,
  ): Promise<EnquiriesResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      if (filter?.propertyId && filter.propertyId !== "ALL") {
        const property = await PropertyModel.getPropertyById(filter.propertyId);
        if (!property || property.ownerId !== ownerId) {
          throw new Error("Unauthorized: You do not own this property");
        }
      }

      const result = await EnquiryModel.getEnquiriesByOwnerId(ownerId, filter);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load enquiries",
      };
    }
  }

  static async updateEnquiryStatus(
    ownerId: string,
    enquiryId: string,
    status: Enquiry["status"],
  ): Promise<EnquiryResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const enquiry = await EnquiryModel.getEnquiryById(enquiryId);
      if (!enquiry) {
        throw new Error("Enquiry not found");
      }
      if (enquiry.ownerId !== ownerId) {
        throw new Error("Unauthorized: You do not own this enquiry");
      }

      const updatedEnquiry = await EnquiryModel.updateEnquiryStatus(
        enquiryId,
        status,
      );
      return { success: true, data: updatedEnquiry };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update enquiry",
      };
    }
  }
}
