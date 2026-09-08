"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { checkoutTenantAction } from "@/app/actions/admin-actions";

export interface CheckoutTenantTarget {
  id: string; // bookingId
  name: string; // tenant name
  bedNumber?: string;
}

interface CheckoutTenantDialogProps {
  target: CheckoutTenantTarget | null;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
}

export function CheckoutTenantDialog({
  target,
  onClose,
  onSuccess,
}: CheckoutTenantDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirmCheckout = async () => {
    if (!target) return;
    try {
      setLoading(true);
      const res = await checkoutTenantAction(target.id);
      if (res.success) {
        toast.success(
          `Tenant ${target.name} checked out. Bed is now VACANT.`,
        );
        onClose();
        if (onSuccess) {
          await onSuccess();
        }
      } else {
        toast.error(res.error || "Failed to checkout tenant");
      }
    } catch {
      toast.error("Error during checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={!!target}
      title="Confirm Checkout"
      description={`Are you sure you want to check out ${target?.name || "this tenant"}${
        target?.bedNumber ? ` from Bed ${target.bedNumber}` : ""
      }? This will complete the booking and make the bed VACANT.`}
      confirmText="Check Out"
      variant="destructive"
      isLoading={loading}
      onConfirm={handleConfirmCheckout}
      onClose={onClose}
    />
  );
}
