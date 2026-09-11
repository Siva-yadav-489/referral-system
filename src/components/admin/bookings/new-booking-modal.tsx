"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BedWithRoomDetails,
  Property,
} from "@/app/actions/property/property.types";
import {
  createBookingAction,
  getAvailableBedsAction,
  getPropertiesAction,
} from "@/app/actions/admin-actions";
import { CustomerIdProofType } from "@/app/actions/booking/booking.types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface NewBookingFormData {
  propertyId: string;
  bedId: string;
  customerName: string;
  contactNo: string;
  email: string;
  idProofType: CustomerIdProofType;
  idProofNumber: string;
  emergencyContact: string;
  agreedMonthlyRent: number;
  depositAmountCollected: number;
  startDate: string;
  endDate: string;
}

export interface NewBookingModalProps {
  isOpen?: boolean;
  properties?: Property[];
  initialAvailableBeds?: BedWithRoomDetails[];
  preselectedPropertyId?: string;
  preselectedBedId?: string;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
}

const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ID_PROOF_REGEX: Record<CustomerIdProofType, RegExp> = {
  AADHAAR: /^\d{12}$/,
  PAN_CARD: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  PASSPORT: /^[A-PR-WYa-pr-wy][1-9]\d{7}$/,
  DRIVING_LICENSE: /^[A-Z]{2}[- ]?\d{2}[0-9]{4,11}$/,
  VOTER_ID: /^[A-Z]{3}[0-9]{7}$/,
};

const isValidPhone = (phone: string) => PHONE_REGEX.test(phone);

const isValidEmail = (email: string) => EMAIL_REGEX.test(email);

const validateIdProof = (
  type: CustomerIdProofType,
  number: string,
): string | null => {
  const value = number.trim().toUpperCase();

  if (!value) {
    return "ID proof number is required";
  }

  switch (type) {
    case "AADHAAR":
      if (!ID_PROOF_REGEX.AADHAAR.test(value)) {
        return "Aadhaar must be exactly 12 digits";
      }
      break;

    case "PAN_CARD":
      if (!ID_PROOF_REGEX.PAN_CARD.test(value)) {
        return "PAN must be in format ABCDE1234F";
      }
      break;

    case "PASSPORT":
      if (!ID_PROOF_REGEX.PASSPORT.test(value)) {
        return "Please enter a valid passport number";
      }
      break;

    case "DRIVING_LICENSE":
      if (!ID_PROOF_REGEX.DRIVING_LICENSE.test(value)) {
        return "Please enter a valid driving license number";
      }
      break;

    case "VOTER_ID":
      if (!ID_PROOF_REGEX.VOTER_ID.test(value)) {
        return "Voter ID must be in format ABC1234567";
      }
      break;

    default:
      return "Invalid ID proof type";
  }

  return null;
};

const buildDefaultFormData = (
  propertyId: string = "",
  bedId: string = "",
): NewBookingFormData => ({
  propertyId,
  bedId,
  customerName: "",
  contactNo: "",
  email: "",
  idProofType: "AADHAAR",
  idProofNumber: "",
  emergencyContact: "",
  agreedMonthlyRent: 8000,
  depositAmountCollected: 4000,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
});

export function NewBookingModal({
  isOpen = true,
  properties: initialProperties,
  initialAvailableBeds,
  preselectedPropertyId,
  preselectedBedId,
  onClose,
  onSuccess,
}: NewBookingModalProps) {
  const [fetchedProperties, setFetchedProperties] = useState<Property[]>([]);
  const propertiesList =
    initialProperties && initialProperties.length > 0
      ? initialProperties
      : fetchedProperties;

  const [availableBeds, setAvailableBeds] = useState<BedWithRoomDetails[]>(
    initialAvailableBeds || [],
  );
  const [formData, setFormData] = useState<NewBookingFormData>(() =>
    buildDefaultFormData(
      preselectedPropertyId || initialProperties?.[0]?.id || "",
      preselectedBedId || "",
    ),
  );
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch properties if none passed
  useEffect(() => {
    if (!initialProperties || initialProperties.length === 0) {
      let isMounted = true;
      void Promise.resolve().then(async () => {
        const res = await getPropertiesAction();
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setFetchedProperties(res.data);
          setFormData((prev) => ({
            ...prev,
            propertyId:
              prev.propertyId || preselectedPropertyId || res.data![0].id,
          }));
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [initialProperties, preselectedPropertyId]);

  // 2. Fetch available beds when selected propertyId changes or mounts
  const targetPropertyId =
    formData.propertyId || preselectedPropertyId || propertiesList[0]?.id;

  useEffect(() => {
    if (!targetPropertyId) return;

    let isMounted = true;
    void Promise.resolve().then(async () => {
      if (!isMounted) return;
      setLoadingBeds(true);
      const res = await getAvailableBedsAction(targetPropertyId);
      if (isMounted) {
        if (res.success && res.data) {
          setAvailableBeds(res.data);
          // If current bedId is not in the newly loaded beds, auto-pick first or keep preselected
          setFormData((prev) => {
            const hasPreselected =
              preselectedBedId &&
              res.data!.some((b) => b.id === preselectedBedId);
            const currentValid =
              prev.bedId && res.data!.some((b) => b.id === prev.bedId);

            if (hasPreselected && prev.propertyId === preselectedPropertyId) {
              return { ...prev, bedId: preselectedBedId };
            }
            if (!currentValid) {
              return { ...prev, bedId: res.data![0]?.id || "" };
            }
            return prev;
          });
        }
        setLoadingBeds(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [targetPropertyId, preselectedBedId, preselectedPropertyId]);

  if (!isOpen) return null;

  const idProofTypes: {
    value: CustomerIdProofType;
    label: string;
  }[] = [
    {
      value: "AADHAAR",
      label: "Aadhaar",
    },
    {
      value: "PAN_CARD",
      label: "PAN Card",
    },
    {
      value: "PASSPORT",
      label: "Passport",
    },
    {
      value: "DRIVING_LICENSE",
      label: "Driving License",
    },
    {
      value: "VOTER_ID",
      label: "Voter ID",
    },
  ];

  const handlePropertyChange = (newPropId: string | null) => {
    if (!newPropId) return;

    setFormData((prev) => ({
      ...prev,
      propertyId: newPropId,
      bedId: "",
    }));
  };

  const handleFormChange = (updates: Partial<NewBookingFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...updates };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.propertyId || !formData.bedId) {
      toast.error("Please select a property and an available bed");
      return;
    }
    if (!formData.customerName.trim() || !formData.contactNo.trim()) {
      toast.error("Customer name and contact number are required");
      return;
    }
    if (!isValidPhone(formData.contactNo)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (formData.email.trim() && !isValidEmail(formData.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (formData.idProofNumber.trim()) {
      const idProofError = validateIdProof(
        formData.idProofType,
        formData.idProofNumber,
      );

      if (idProofError) {
        toast.error(idProofError);
        return;
      }
    }

    if (formData.agreedMonthlyRent <= 0) {
      toast.error("Monthly rent must be greater than ₹0");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createBookingAction({
        propertyId: formData.propertyId,
        bedId: formData.bedId,
        customerName: formData.customerName.trim(),
        contactNo: formData.contactNo.trim(),
        email: formData.email.trim(),
        idProofType: formData.idProofType || undefined,
        idProofNumber: formData.idProofNumber.trim() || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        agreedMonthlyRent: Number(formData.agreedMonthlyRent),
        depositAmountCollected: Number(formData.depositAmountCollected),
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
      });

      if (res.success) {
        toast.success(
          "Booking confirmed! Bed is now occupied and initial invoice generated.",
        );
        onClose();
        if (onSuccess) {
          await onSuccess();
        }
      } else {
        toast.error(res.error || "Failed to create booking");
      }
    } catch {
      toast.error("Error creating booking");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBed = availableBeds.find((bed) => bed.id === formData.bedId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-in zoom-in-95 duration-150 relative">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground">
              New Bed Booking
            </h3>
            <p className="text-xs text-muted-foreground">
              Assign a vacant bed to an incoming tenant.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property & Bed Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2 rounded-lg bg-muted/20 border border-border/60">
            <div className="space-y-1.5">
              <Label htmlFor="propSelect" className="text-xs">
                Select Property *
              </Label>

              <Select
                value={formData.propertyId}
                onValueChange={handlePropertyChange}
                disabled={
                  submitting ||
                  (!!preselectedPropertyId && propertiesList.length <= 1)
                }
              >
                <SelectTrigger id="propSelect" className="w-full">
                  <SelectValue placeholder="Select Property">
                    {propertiesList.find(
                      (property) => property.id === formData.propertyId,
                    )?.name ?? "Select Property"}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    {propertiesList.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bedSelect" className="text-xs">
                  Select Vacant Bed *
                </Label>

                {loadingBeds && (
                  <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                )}
              </div>

              {loadingBeds ? (
                <div className="text-xs text-muted-foreground p-2 rounded bg-muted/30 border border-border">
                  Checking available beds...
                </div>
              ) : availableBeds.length === 0 ? (
                <div className="text-xs text-amber-500 dark:text-amber-400 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  No vacant beds in this property.
                </div>
              ) : (
                <Select
                  value={formData.bedId}
                  onValueChange={(value) => {
                    if (!value) return;

                    handleFormChange({
                      bedId: value,
                    });
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger id="bedSelect" className="w-full">
                    <SelectValue placeholder="Select Bed">
                      {selectedBed
                        ? `Bed ${selectedBed.bedNumber} (Room ${
                            selectedBed.room?.roomNumber || "N/A"
                          })`
                        : "Select Bed"}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {availableBeds.map((bed) => (
                        <SelectItem key={bed.id} value={bed.id}>
                          Bed {bed.bedNumber} (Room{" "}
                          {bed.room?.roomNumber || "N/A"})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tenant Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cName" className="text-xs">
                  Full Name *
                </Label>
                <Input
                  id="cName"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.customerName}
                  onChange={(e) =>
                    handleFormChange({ customerName: e.target.value })
                  }
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cPhone" className="text-xs">
                  Contact Number *
                </Label>
                <Input
                  id="cPhone"
                  placeholder="e.g. 9876543210"
                  value={formData.contactNo}
                  onChange={(e) =>
                    handleFormChange({ contactNo: e.target.value })
                  }
                  disabled={submitting}
                  required
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cEmail" className="text-xs">
                  Email
                </Label>
                <Input
                  id="cEmail"
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={formData.email}
                  onChange={(e) => handleFormChange({ email: e.target.value })}
                  disabled={submitting}
                  pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cProofType" className="text-xs">
                  ID Proof Type
                </Label>

                <Select
                  value={formData.idProofType}
                  onValueChange={(value) => {
                    if (!value) return;

                    handleFormChange({
                      idProofType: value as CustomerIdProofType,
                      idProofNumber: "",
                    });
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger id="cProofType" className="w-full">
                    <SelectValue placeholder="Select ID Proof Type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {idProofTypes.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cProofNum" className="text-xs">
                  ID Proof Number
                </Label>
                <Input
                  id="cProofNum"
                  placeholder="e.g. 1234-5678-9012"
                  value={formData.idProofNumber}
                  onChange={(e) =>
                    handleFormChange({ idProofNumber: e.target.value })
                  }
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cEmerg" className="text-xs">
                  Emergency Contact / Parent Phone
                </Label>
                <Input
                  id="cEmerg"
                  placeholder="e.g. 9123456780"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    handleFormChange({ emergencyContact: e.target.value })
                  }
                  disabled={submitting}
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                />
              </div>
            </div>
          </div>

          {/* Financial & Dates */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stay &amp; Financial Terms
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cost" className="text-xs">
                  Agreed Rent/Month (₹) *
                </Label>
                <Input
                  id="cost"
                  type="number"
                  min={100}
                  value={formData.agreedMonthlyRent}
                  onChange={(e) =>
                    handleFormChange({
                      agreedMonthlyRent: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="deposit" className="text-xs">
                  Security Deposit (₹) *
                </Label>
                <Input
                  id="deposit"
                  type="number"
                  min={0}
                  value={formData.depositAmountCollected}
                  onChange={(e) =>
                    handleFormChange({
                      depositAmountCollected: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sDate" className="text-xs">
                  Start Date *
                </Label>
                <Input
                  id="sDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleFormChange({ startDate: e.target.value })
                  }
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="eDate" className="text-xs">
                  End Date
                </Label>
                <Input
                  id="eDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    handleFormChange({ endDate: e.target.value })
                  }
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || availableBeds.length === 0}
              className="cursor-pointer text-xs font-semibold"
            >
              {submitting && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Confirm Booking &amp; Assign Bed
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
