"use client";

import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  MoreVertical,
  Phone,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EnquiryWithDetails } from "@/app/actions/enquiry/enquiry.types";
import { format } from "date-fns";

interface EnquiryCardProps {
  enquiry: EnquiryWithDetails;
  updatingId: string | null;
  onUpdateStatus: (
    id: string,
    status: "UNREAD" | "CONTACTED" | "CONVERTED" | "NOT_INTERESTED",
  ) => Promise<void>;
}

export function EnquiryCard({
  enquiry,
  updatingId,
  onUpdateStatus,
}: EnquiryCardProps) {
  const isUpdating = updatingId === enquiry.id;

  const getStatusBadge = () => {
    switch (enquiry.status) {
      case "UNREAD":
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium text-sky-400 border-sky-500/30 bg-sky-500/10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5 animate-pulse" />
            UNREAD
          </Badge>
        );
      case "CONTACTED":
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium text-amber-400 border-amber-500/30 bg-amber-500/10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
            CONTACTED
          </Badge>
        );
      case "CONVERTED":
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
            CONVERTED
          </Badge>
        );
      case "NOT_INTERESTED":
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium text-zinc-400 border-zinc-700 bg-zinc-800/60"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mr-1.5" />
            NOT INTERESTED
          </Badge>
        );
    }
  };

  return (
    <Card className="bg-card border-border hover:border-border/80 transition-colors shadow-sm py-0">
      <CardContent className="p-4 space-y-1">
        <div className=" flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Left: Enquiry details */}
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-base text-foreground flex items-center gap-1.5">
                <User className="w-5 h-5" />
                {enquiry.name}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />{" "}
                {enquiry.property?.name || "Property"}
              </span>
              <Badge
                variant="outline"
                className="text-[11px] font-normal text-muted-foreground border-border bg-muted/50"
              >
                {enquiry.roomType}
              </Badge>
              {getStatusBadge()}
            </div>
          </div>

          {/* Right: Quick Actions & 3-dot dropdown */}
          <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-border/50 shrink-0">
            {enquiry.status === "UNREAD" && (
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(enquiry.id, "CONTACTED")}
                className="text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Clock className="w-3.5 h-3.5 mr-1" />
                )}
                Mark Contacted
              </Button>
            )}

            {enquiry.status === "CONTACTED" && (
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(enquiry.id, "CONVERTED")}
                className="text-xs h-8 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                )}
                Mark Converted
              </Button>
            )}

            {/* 3-Dot Options Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                    disabled={isUpdating}
                  />
                }
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MoreVertical className="w-4 h-4" />
                )}
                <span className="sr-only">Enquiry options</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1">
                    Change Status
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => onUpdateStatus(enquiry.id, "UNREAD")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      Unread
                    </span>
                    {enquiry.status === "UNREAD" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onUpdateStatus(enquiry.id, "CONTACTED")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Contacted
                    </span>
                    {enquiry.status === "CONTACTED" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onUpdateStatus(enquiry.id, "CONVERTED")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Converted
                    </span>
                    {enquiry.status === "CONVERTED" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onUpdateStatus(enquiry.id, "NOT_INTERESTED")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-400" />
                      Not Interested
                    </span>
                    {enquiry.status === "NOT_INTERESTED" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1">
                    Direct Actions
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => window.open(`tel:${enquiry.contactNo}`)}
                    className="cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 mr-2 text-primary" />
                    Call Prospect
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => window.open(`mailto:${enquiry.email}`)}
                    className="cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 mr-2 text-primary" />
                    Send Email
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Contact Details & Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <a
            href={`tel:${enquiry.contactNo}`}
            className="flex items-center gap-1.5 hover:text-primary transition-colors truncate"
            title="Click to call"
          >
            <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{enquiry.contactNo}</span>
          </a>

          <a
            href={`mailto:${enquiry.email}`}
            className="flex items-center gap-1.5 hover:text-primary transition-colors truncate"
            title="Click to send email"
          >
            <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{enquiry.email}</span>
          </a>

          <span className="flex items-center gap-1.5 text-muted-foreground truncate">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{format(enquiry.createdAt, "dd/MM/yyyy hh:mm a")}</span>
          </span>
          {/* Optional Message */}
          {enquiry.message && (
            <div className="mt-2 text-xs bg-muted/40 border border-border/50 rounded-lg px-2 py-1.5 text-foreground/90 flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="line-clamp-1 truncate italic text-muted-foreground">
                &ldquo;{enquiry.message}&rdquo;
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
