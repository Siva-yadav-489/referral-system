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

export interface NewBookingFormData {
  propertyId: string;
  bedId: string;
  customerName: string;
  contactNo: string;
  email: string;
  idProofType: string;
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

const buildDefaultFormData = (
  propertyId: string = "",
  bedId: string = "",
): NewBookingFormData => ({
  propertyId,
  bedId,
  customerName: "",
  contactNo: "",
  email: "",
  idProofType: "",
  idProofNumber: "",
  emergencyContact: "",
  agreedMonthlyRent: 8000,
  depositAmountCollected: 4000,
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
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

  const handlePropertyChange = (newPropId: string) => {
    setFormData((prev) => ({
      ...prev,
      propertyId: newPropId,
      bedId: "",
    }));
  };

  const handleFormChange = (updates: Partial<NewBookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
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

    try {
      setSubmitting(true);
      const res = await createBookingAction({
        propertyId: formData.propertyId,
        bedId: formData.bedId,
        customerName: formData.customerName.trim(),
        contactNo: formData.contactNo.trim(),
        email: formData.email.trim() || undefined,
        idProofType: formData.idProofType.trim() || undefined,
        idProofNumber: formData.idProofNumber.trim() || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        agreedMonthlyRent: Number(formData.agreedMonthlyRent),
        depositAmountCollected: Number(formData.depositAmountCollected),
        startDate: formData.startDate,
        endDate: formData.endDate,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/20 border border-border/60">
            <div className="space-y-1.5">
              <Label htmlFor="propSelect" className="text-xs">
                Select Property *
              </Label>
              <select
                id="propSelect"
                value={formData.propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                disabled={submitting || (!!preselectedPropertyId && propertiesList.length <= 1)}
                className="w-full bg-background text-foreground border border-border rounded-lg text-xs p-2.5 cursor-pointer disabled:opacity-75"
                required
              >
                {propertiesList.length === 0 ? (
                  <option value="">Loading properties...</option>
                ) : (
                  propertiesList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
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
                <select
                  id="bedSelect"
                  value={formData.bedId}
                  onChange={(e) => handleFormChange({ bedId: e.target.value })}
                  disabled={submitting}
                  className="w-full bg-background text-foreground border border-border rounded-lg text-xs p-2.5 cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    -- Select Bed --
                  </option>
                  {availableBeds.map((bed) => (
                    <option key={bed.id} value={bed.id}>
                      Bed {bed.bedNumber} (Room {bed.room?.roomNumber || "N/A"})
                    </option>
                  ))}
                </select>
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
                <Label htmlFor="cName" className="text-xs">Full Name *</Label>
                <Input
                  id="cName"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.customerName}
                  onChange={(e) => handleFormChange({ customerName: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cPhone" className="text-xs">Contact Number *</Label>
                <Input
                  id="cPhone"
                  placeholder="e.g. 9876543210"
                  value={formData.contactNo}
                  onChange={(e) => handleFormChange({ contactNo: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cEmail" className="text-xs">Email</Label>
                <Input
                  id="cEmail"
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={formData.email}
                  onChange={(e) => handleFormChange({ email: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cProofType" className="text-xs">ID Proof Type</Label>
                <Input
                  id="cProofType"
                  placeholder="e.g. Aadhaar / PAN / Passport"
                  value={formData.idProofType}
                  onChange={(e) => handleFormChange({ idProofType: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cProofNum" className="text-xs">ID Proof Number</Label>
                <Input
                  id="cProofNum"
                  placeholder="e.g. 1234-5678-9012"
                  value={formData.idProofNumber}
                  onChange={(e) => handleFormChange({ idProofNumber: e.target.value })}
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
                  onChange={(e) => handleFormChange({ emergencyContact: e.target.value })}
                  disabled={submitting}
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
                <Label htmlFor="cost" className="text-xs">Agreed Rent / Mo (₹) *</Label>
                <Input
                  id="cost"
                  type="number"
                  min={100}
                  value={formData.agreedMonthlyRent}
                  onChange={(e) =>
                    handleFormChange({ agreedMonthlyRent: parseFloat(e.target.value) || 0 })
                  }
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="deposit" className="text-xs">Security Deposit (₹) *</Label>
                <Input
                  id="deposit"
                  type="number"
                  min={0}
                  value={formData.depositAmountCollected}
                  onChange={(e) =>
                    handleFormChange({ depositAmountCollected: parseFloat(e.target.value) || 0 })
                  }
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sDate" className="text-xs">Start Date *</Label>
                <Input
                  id="sDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleFormChange({ startDate: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="eDate" className="text-xs">End Date *</Label>
                <Input
                  id="eDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleFormChange({ endDate: e.target.value })}
                  disabled={submitting}
                  required
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
