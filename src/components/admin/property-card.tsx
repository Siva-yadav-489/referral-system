"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  Layers,
  DoorOpen,
  BedSingle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PropertyWithStatsItem {
  id: string;
  name: string;
  address: string;
  contactNo: string;
  noOfFloors?: number;
  floorsCount?: number;
  totalRooms?: number;
  totalBeds?: number;
  occupiedBeds?: number;
  vacantBeds?: number;
  maintenanceBeds?: number;
  occupancyRate?: number;
}

interface PropertyCardProps {
  property: PropertyWithStatsItem;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const floors = property.floorsCount ?? property.noOfFloors ?? 0;
  const rooms = property.totalRooms ?? 0;
  const totalBeds = property.totalBeds ?? 0;
  const occupiedBeds = property.occupiedBeds ?? 0;
  const occupancyRate = property.occupancyRate ?? 0;

  return (
    <Link
      href={`/admin/properties/${property.id}`}
      className="block group focus:outline-none"
    >
      <Card className="bg-card border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200 h-full flex flex-col justify-between overflow-hidden relative">
        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Top Row: Icon, Title & Occupancy Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {property.name}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                  <span className="line-clamp-1">{property.address}</span>
                </div>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-[11px] px-2 py-0.5 shrink-0 font-semibold ${
                occupancyRate >= 80
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  : occupancyRate >= 40
                  ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                  : "border-zinc-700 text-muted-foreground bg-muted/40"
              }`}
            >
              {occupancyRate}% Occupied
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Phone className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            <span>{property.contactNo}</span>
          </div>

          {/* Metrics Badges */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/60 text-center">
            <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                <Layers className="w-3 h-3" />
                <span>Floors</span>
              </div>
              <div className="text-sm font-bold text-foreground mt-0.5">
                {floors}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                <DoorOpen className="w-3 h-3" />
                <span>Rooms</span>
              </div>
              <div className="text-sm font-bold text-foreground mt-0.5">
                {rooms}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                <BedSingle className="w-3 h-3" />
                <span>Beds</span>
              </div>
              <div className="text-sm font-bold text-foreground mt-0.5">
                {occupiedBeds}/{totalBeds}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer Link Prompt */}
        <div className="px-5 py-2.5 bg-muted/20 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-primary group-hover:bg-primary/5 transition-colors">
          <span>Manage Structure & Beds</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  );
}
