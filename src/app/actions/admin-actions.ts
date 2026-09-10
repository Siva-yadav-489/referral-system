"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PropertyService } from "./property/property.service";
import { BookingService } from "./booking/booking.service";
import { BillingService } from "./billing/billing.service";
import { PropertyModel } from "./property/property.model";
import { BookingModel } from "./booking/booking.model";
import { BillingModel } from "./billing/billing.model";
import {
  zodCreatePropertySchema,
  zodCreateFloorSchema,
  zodCreateRoomSchema,
} from "./property/property.types";
import {
  zodCreateBookingSchema,
  zodExtendBookingSchema,
} from "./booking/booking.types";
import {
  zodUpdateInvoiceStatusSchema,
  zodGetInvoicesFilterSchema,
} from "./billing/billing.types";
import { EnquiryService } from "./enquiry/enquiry.service";
import {
  zodGetEnquiriesFilterSchema,
  zodUpdateEnquiryStatusSchema,
} from "./enquiry/enquiry.types";
import { z } from "zod";

async function getAdminOwnerId(): Promise<string> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return session.user.id;
}

// -------------------------------------------------------------
// DASHBOARD STATS
// -------------------------------------------------------------
export async function getDashboardStatsAction() {
  try {
    const ownerId = await getAdminOwnerId();

    const properties = await PropertyModel.getPropertiesByOwnerId(ownerId);
    let totalRooms = 0;
    let totalBeds = 0;
    let occupiedBeds = 0;
    let vacantBeds = 0;
    let maintenanceBeds = 0;

    for (const prop of properties) {
      const beds = await PropertyModel.getAllBedsByPropertyId(prop.id);
      totalBeds += beds.length;
      for (const bed of beds) {
        if (bed.status === "OCCUPIED") occupiedBeds++;
        else if (bed.status === "VACANT") vacantBeds++;
        else if (bed.status === "MAINTENANCE") maintenanceBeds++;
      }
      const rooms = await PropertyModel.getAllRoomsByPropertyId(prop.id);
      totalRooms += rooms.length;
    }

    const activeBookings =
      await BookingModel.getActiveBookingsByOwnerId(ownerId);
    const allBookings = await BookingModel.getAllBookingsByOwnerId(ownerId);
    const invoices = await BillingModel.getInvoicesByOwnerId(ownerId);

    let pendingAmount = 0;
    let collectedAmount = 0;

    for (const inv of invoices) {
      const amt = Number(inv.amount) || 0;
      if (inv.status === "PAID") {
        collectedAmount += amt;
      } else if (inv.status === "PENDING" || inv.status === "OVERDUE") {
        pendingAmount += amt;
      }
    }

    return {
      success: true,
      data: {
        totalProperties: properties.length,
        totalRooms,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        maintenanceBeds,
        occupancyRate:
          totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        activeBookingsCount: activeBookings.length,
        totalBookingsCount: allBookings.length,
        pendingAmount,
        collectedAmount,
        recentBookings: allBookings.slice(0, 5),
        recentInvoices: invoices.slice(0, 5),
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load dashboard statistics",
    };
  }
}

// -------------------------------------------------------------
// PROPERTY ACTIONS
// -------------------------------------------------------------
export async function getPropertiesAction() {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.getProperties(ownerId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function getPropertyDetailsAction(propertyId: string) {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.getPropertyDetails(ownerId, propertyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function createPropertyAction(
  input: z.infer<typeof zodCreatePropertySchema>,
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.createProperty(ownerId, input);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function updatePropertyAction(
  propertyId: string,
  input: Partial<z.infer<typeof zodCreatePropertySchema>>,
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.updateProperty(ownerId, propertyId, input);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function deletePropertyAction(propertyId: string) {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.deleteProperty(ownerId, propertyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function addFloorAction(
  input: z.infer<typeof zodCreateFloorSchema>,
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.addFloor(ownerId, input);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function deleteFloorAction(floorId: string) {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.deleteFloor(ownerId, floorId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function addRoomAction(
  input: z.infer<typeof zodCreateRoomSchema>,
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.addRoom(ownerId, input);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function addRoomsBulkAction(input: {
  propertyId: string;
  floorId: string;
  twoSharingCount: number;
  threeSharingCount: number;
}) {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.addRoomsBulk(ownerId, input);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function updateRoomTypeAction(
  roomId: string,
  roomType: z.infer<typeof zodCreateRoomSchema>["type"],
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.updateRoomType(ownerId, roomId, roomType);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function deleteRoomAction(roomId: string) {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.deleteRoom(ownerId, roomId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function updateBedStatusAction(
  bedId: string,
  status: "VACANT" | "OCCUPIED" | "MAINTENANCE",
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await PropertyService.updateBedStatus(ownerId, bedId, status);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

// -------------------------------------------------------------
// BOOKING ACTIONS
// -------------------------------------------------------------
export async function getBookingsAction(propertyId?: string) {
  try {
    const ownerId = await getAdminOwnerId();
    return await BookingService.getAllBookings(ownerId, propertyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function getActiveBookingsAction(propertyId?: string) {
  try {
    const ownerId = await getAdminOwnerId();
    return await BookingService.getActiveBookings(ownerId, propertyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function getAvailableBedsAction(propertyId?: string) {
  try {
    const ownerId = await getAdminOwnerId();
    return await BookingService.getAvailableBeds(ownerId, propertyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function createBookingAction(
  input: z.infer<typeof zodCreateBookingSchema>,
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await BookingService.createBooking(ownerId, input);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function extendStayAction(
  bookingId: string,
  input: z.infer<typeof zodExtendBookingSchema>,
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await BookingService.extendStay(ownerId, bookingId, input);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function checkoutTenantAction(bookingId: string) {
  try {
    const ownerId = await getAdminOwnerId();
    return await BookingService.checkoutTenant(ownerId, bookingId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function cancelBookingAction(bookingId: string) {
  try {
    const ownerId = await getAdminOwnerId();
    return await BookingService.cancelBooking(ownerId, bookingId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

// -------------------------------------------------------------
// BILLING ACTIONS
// -------------------------------------------------------------
export async function getInvoicesAction(
  filter?: z.infer<typeof zodGetInvoicesFilterSchema>,
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await BillingService.getOwnerInvoices(ownerId, filter);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  input: z.infer<typeof zodUpdateInvoiceStatusSchema>,
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await BillingService.updateInvoiceStatus(ownerId, invoiceId, input);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

export async function generateMonthlyInvoicesAction() {
  try {
    const ownerId = await getAdminOwnerId();
    return await BillingService.generateMonthlyInvoices(ownerId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}

// -------------------------------------------------------------
// ENQUIRY ACTIONS
// -------------------------------------------------------------
export async function getEnquiriesAction(
  filter?: z.infer<typeof zodGetEnquiriesFilterSchema>,
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await EnquiryService.getOwnerEnquiries(ownerId, filter);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load enquiries",
    };
  }
}

export async function updateEnquiryStatusAction(
  enquiryId: string,
  input: z.infer<typeof zodUpdateEnquiryStatusSchema>,
) {
  try {
    const ownerId = await getAdminOwnerId();
    return await EnquiryService.updateEnquiryStatus(
      ownerId,
      enquiryId,
      input.status,
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}
