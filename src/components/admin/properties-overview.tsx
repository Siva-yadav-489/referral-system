"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Building2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "./page-header";
import { PropertyCard, PropertyWithStatsItem } from "./property-card";
import { createPropertyAction } from "@/app/actions/admin-actions";

interface PropertiesOverviewProps {
  initialProperties: PropertyWithStatsItem[];
}

export function PropertiesOverview({
  initialProperties,
}: PropertiesOverviewProps) {
  const router = useRouter();
  const [properties, setProperties] =
    useState<PropertyWithStatsItem[]>(initialProperties);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPropertyData, setNewPropertyData] = useState({
    name: "",
    address: "",
    contactNo: "",
    noOfFloors: 7,
  });

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newPropertyData.name.trim() ||
      !newPropertyData.address.trim() ||
      !newPropertyData.contactNo.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setCreating(true);
      const res = await createPropertyAction({
        name: newPropertyData.name.trim(),
        address: newPropertyData.address.trim(),
        contactNo: newPropertyData.contactNo.trim(),
        noOfFloors: Number(newPropertyData.noOfFloors) || 1,
      });

      if (res.success && res.data) {
        toast.success(
          `Property "${res.data.name}" created with ${newPropertyData.noOfFloors} floors!`,
        );
        setShowAddModal(false);
        setNewPropertyData({
          name: "",
          address: "",
          contactNo: "",
          noOfFloors: 2,
        });
        // Optimistically add or refresh
        router.refresh();
        setProperties((prev) => [
          {
            ...res.data!,
            floorsCount: Number(newPropertyData.noOfFloors) || 1,
            totalRooms: 0,
            totalBeds: 0,
            occupiedBeds: 0,
            vacantBeds: 0,
            maintenanceBeds: 0,
            occupancyRate: 0,
          },
          ...prev,
        ]);
      } else {
        toast.error(res.error || "Failed to create property");
      }
    } catch {
      toast.error("An unexpected error occurred creating property");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Reusable Header */}
      <PageHeader
        title="Property Management"
        description="Configure buildings, floors, rooms, and bed allocations."
      >
        <Button
          onClick={() => setShowAddModal(true)}
          size="sm"
          className="font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Property
        </Button>
      </PageHeader>

      {/* Properties Grid or Empty State */}
      {properties.length === 0 ? (
        <Card className="bg-card border-dashed border-2 border-border text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              No properties yet
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm">
              Add your first PG building to configure floors, rooms, and beds
              for tenant bookings.
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              size="sm"
              className="mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Add New PG Property
                </h3>
                <p className="text-xs text-muted-foreground">
                  Create a building and automatically initialize its floors.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="prop-name" className="text-xs">
                  Property Name *
                </Label>
                <Input
                  id="prop-name"
                  placeholder="e.g. Beyond Stays Elite PG"
                  value={newPropertyData.name}
                  onChange={(e) =>
                    setNewPropertyData({
                      ...newPropertyData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-address" className="text-xs">
                  Address *
                </Label>
                <Input
                  id="prop-address"
                  placeholder="e.g. Plot 42, Hitech City, Hyderabad"
                  value={newPropertyData.address}
                  onChange={(e) =>
                    setNewPropertyData({
                      ...newPropertyData,
                      address: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-contact" className="text-xs">
                  Contact Phone *
                </Label>
                <Input
                  id="prop-contact"
                  placeholder="e.g. 9876543210"
                  value={newPropertyData.contactNo}
                  onChange={(e) =>
                    setNewPropertyData({
                      ...newPropertyData,
                      contactNo: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-floors" className="text-xs">
                  Number of Floors (1 to 7) *
                </Label>
                <Input
                  id="prop-floors"
                  type="number"
                  min={1}
                  max={7}
                  value={newPropertyData.noOfFloors}
                  onChange={(e) =>
                    setNewPropertyData({
                      ...newPropertyData,
                      noOfFloors: Math.min(
                        7,
                        Math.max(1, parseInt(e.target.value) || 1),
                      ),
                    })
                  }
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Floors 1 through {newPropertyData.noOfFloors} will be
                  automatically created.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={creating}
                  className="cursor-pointer text-xs font-semibold"
                >
                  {creating && (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  )}
                  Create Property
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
