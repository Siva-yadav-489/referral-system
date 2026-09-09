import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { Enquiry, NewEnquiry, EnquiryWithDetails } from "./enquiry.types";
import { eq, and, gte, lte } from "drizzle-orm";

export class EnquiryModel {
  static async createEnquiry(input: NewEnquiry): Promise<Enquiry> {
    const [newEnquiry] = await db.insert(enquiries).values(input).returning();
    return newEnquiry;
  }

  static async getEnquiriesByOwnerId(
    ownerId: string,
    filter?: {
      month?: number;
      year?: number;
      status?: "UNREAD" | "CONTACTED" | "CONVERTED" | "NOT_INTERESTED";
      propertyId?: string;
    },
  ): Promise<EnquiryWithDetails[]> {
    const conditions = [eq(enquiries.ownerId, ownerId)];

    if (filter?.propertyId && filter.propertyId !== "ALL") {
      conditions.push(eq(enquiries.propertyId, filter.propertyId));
    }

    if (filter?.status) {
      conditions.push(eq(enquiries.status, filter.status));
    }

    if (filter?.year && filter?.month) {
      const startDate = new Date(filter.year, filter.month - 1, 1, 0, 0, 0);
      const lastDay = new Date(filter.year, filter.month, 0).getDate();
      const endDate = new Date(
        filter.year,
        filter.month - 1,
        lastDay,
        23,
        59,
        59,
        999,
      );
      conditions.push(
        gte(enquiries.createdAt, startDate),
        lte(enquiries.createdAt, endDate),
      );
    } else if (filter?.year) {
      const startDate = new Date(filter.year, 0, 1, 0, 0, 0);
      const endDate = new Date(filter.year, 11, 31, 23, 59, 59, 999);
      conditions.push(
        gte(enquiries.createdAt, startDate),
        lte(enquiries.createdAt, endDate),
      );
    }

    const results = await db.query.enquiries.findMany({
      where: and(...conditions),
      with: {
        property: true,
      },
      orderBy: (enquiries, { desc }) => [desc(enquiries.createdAt)],
    });

    return results as EnquiryWithDetails[];
  }

  static async getEnquiryById(enquiryId: string): Promise<Enquiry> {
    const [enquiry] = await db
      .select()
      .from(enquiries)
      .where(eq(enquiries.id, enquiryId));
    return enquiry;
  }

  static async updateEnquiryStatus(
    enquiryId: string,
    status: Enquiry["status"],
  ): Promise<Enquiry> {
    const [updatedEnquiry] = await db
      .update(enquiries)
      .set({ status, updatedAt: new Date() })
      .where(eq(enquiries.id, enquiryId))
      .returning();
    return updatedEnquiry;
  }
}
