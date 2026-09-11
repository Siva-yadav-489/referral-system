import { z } from "zod";
import {
  zodCreateBookingSchema,
  zodExtendBookingSchema,
  BookingResponse,
  BookingWithDetailsResponse,
  BookingsWithDetailsResponse,
  BookingTransactionResponse,
} from "./booking.types";
import { BookingModel } from "./booking.model";
import { PropertyModel } from "../property/property.model";

export class BookingService {
  static async createBooking(
    ownerId: string,
    input: z.infer<typeof zodCreateBookingSchema>,
  ): Promise<BookingTransactionResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const validated = zodCreateBookingSchema.parse(input);

      // 1. Verify property exists and is owned by the user
      const property = await PropertyModel.getPropertyById(
        validated.propertyId,
      );
      if (!property) {
        throw new Error("Property not found");
      }
      if (property.ownerId !== ownerId) {
        throw new Error("Unauthorized: You do not own this property");
      }

      // 2. Verify Bed existence, ownership, and availability via PropertyModel
      const bed = await PropertyModel.getBedById(validated.bedId);
      if (!bed) {
        throw new Error("Bed not found");
      }
      if (bed.propertyId !== validated.propertyId) {
        throw new Error("Bed does not belong to the specified property");
      }
      if (bed.status !== "VACANT") {
        throw new Error(
          `Bed is currently ${bed.status.toLowerCase()} and cannot be booked`,
        );
      }

      // 3. Run atomic transaction for customer, booking, bed status
      const result = await BookingModel.createBookingTransaction({
        ownerId,
        propertyId: validated.propertyId,
        bedId: validated.bedId,
        customerData: {
          name: validated.customerName,
          contactNo: validated.contactNo,
          email: validated.email || "",
          idProofType: validated.idProofType || undefined,
          idProofNumber: validated.idProofNumber || undefined,
          emergencyContact: validated.emergencyContact || undefined,
        },
        agreedMonthlyRent: validated.agreedMonthlyRent,
        startDate: validated.startDate,
        endDate: validated.endDate || undefined,
        depositAmountCollected: validated.depositAmountCollected,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create booking",
      };
    }
  }

  static async getAllBookings(
    ownerId: string,
    propertyId?: string,
  ): Promise<BookingsWithDetailsResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const bookingsList = await BookingModel.getAllBookingsByOwnerId(
        ownerId,
        propertyId,
      );
      return {
        success: true,
        data: bookingsList,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch bookings",
      };
    }
  }

  static async getActiveBookings(
    ownerId: string,
    propertyId?: string,
  ): Promise<BookingsWithDetailsResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const activeBookings = await BookingModel.getActiveBookingsByOwnerId(
        ownerId,
        propertyId,
      );
      return {
        success: true,
        data: activeBookings,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch active bookings",
      };
    }
  }

  static async getBookingById(
    ownerId: string,
    bookingId: string,
  ): Promise<BookingWithDetailsResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const booking = await BookingModel.getBookingWithDetailsById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }
      if (booking.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }

      return {
        success: true,
        data: booking,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch booking",
      };
    }
  }

  static async extendStay(
    ownerId: string,
    bookingId: string,
    input: z.infer<typeof zodExtendBookingSchema>,
  ): Promise<BookingResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const validated = zodExtendBookingSchema.parse(input);

      const booking = await BookingModel.getBookingById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }
      if (booking.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }
      if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
        throw new Error(
          `Cannot extend a ${booking.status.toLowerCase()} booking`,
        );
      }

      const updatedBooking = await BookingModel.updateBooking(bookingId, {
        endDate: validated.newEndDate,
        status: "EXTENDED",
      });

      return {
        success: true,
        data: updatedBooking,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to extend booking",
      };
    }
  }

  static async checkoutTenant(
    ownerId: string,
    bookingId: string,
  ): Promise<BookingResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const booking = await BookingModel.getBookingById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }
      if (booking.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }
      if (booking.status === "COMPLETED") {
        throw new Error("Booking is already completed");
      }

      const closedBooking = await BookingModel.checkoutTenantTransaction(
        bookingId,
        booking.bedId,
      );

      return {
        success: true,
        data: closedBooking,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to checkout tenant",
      };
    }
  }

  static async cancelBooking(
    ownerId: string,
    bookingId: string,
  ): Promise<BookingResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const booking = await BookingModel.getBookingById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }
      if (booking.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }
      if (booking.status === "COMPLETED") {
        throw new Error("Completed bookings cannot be cancelled");
      }

      const cancelledBooking = await BookingModel.cancelBookingTransaction(
        bookingId,
        booking.bedId,
      );

      return {
        success: true,
        data: cancelledBooking,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to cancel booking",
      };
    }
  }

  static async getAvailableBeds(ownerId: string, propertyId?: string) {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const beds = await BookingModel.getAvailableBeds(ownerId, propertyId);
      return {
        success: true,
        data: beds,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch available beds",
      };
    }
  }
}
