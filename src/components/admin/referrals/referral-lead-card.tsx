"use client";

import {
  Building2,
  Calendar,
  Gift,
  Mail,
  Phone,
  Plus,
  User,
  UserPlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReferralLeadWithDetails } from "@/app/actions/referrals/referral.types";
import { format } from "date-fns";

interface ReferralLeadCardProps {
  lead: ReferralLeadWithDetails;
}

export function ReferralLeadCard({ lead }: ReferralLeadCardProps) {
  const getStatusBadge = () => {
    if (!lead.referral) {
      return (
        <Badge
          variant="outline"
          className="text-xs font-medium text-sky-400 border-sky-500/30 bg-sky-500/10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5 animate-pulse" />
          PENDING
        </Badge>
      );
    }

    switch (lead.referral.status) {
      case "ACTIVE":
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium text-amber-400 border-amber-500/30 bg-amber-500/10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
            ACTIVE
          </Badge>
        );
      case "QUALIFIED":
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium text-violet-400 border-violet-500/30 bg-violet-500/10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mr-1.5" />
            QUALIFIED
          </Badge>
        );
      case "REWARDED":
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
          >
            <Gift className="w-3 h-3 mr-1" />
            REWARDED
          </Badge>
        );
      case "DISQUALIFIED":
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium text-zinc-400 border-zinc-700 bg-zinc-800/60"
          >
            DISQUALIFIED
          </Badge>
        );
    }
  };

  return (
    <Card className="bg-card border-border hover:border-border/80 transition-colors shadow-sm py-0">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-base text-foreground flex items-center gap-1.5">
                <User className="w-5 h-5" />
                {lead.refereeName}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {lead.property?.name || "Property"}
              </span>
              {getStatusBadge()}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
                <UserPlus className="w-3.5 h-3.5 text-primary" />
                Referred by {lead.referrer?.name || "Unknown"}
              </span>
              {lead.referral?.rewardedPoints &&
                lead.referral.status === "REWARDED" && (
                  <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-400">
                    <Plus className="w-3 h-3 mb-0.5" />
                    {lead.referral.rewardedPoints} points
                  </span>
                )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground/70 mb-1">
              Referee
            </p>
            <a
              href={`tel:${lead.refereeContactNo}`}
              className="flex items-center gap-1.5 hover:text-primary transition-colors truncate"
            >
              <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{lead.refereeContactNo}</span>
            </a>
            {lead.refereeEmail && (
              <a
                href={`mailto:${lead.refereeEmail}`}
                className="flex items-center gap-1.5 hover:text-primary transition-colors truncate mt-1"
              >
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{lead.refereeEmail}</span>
              </a>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground/70 mb-1">
              Referrer
            </p>
            <p className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{lead.referrer?.name}</span>
            </p>
            {lead.referrer?.contactNo && (
              <a
                href={`tel:${lead.referrer.contactNo}`}
                className="flex items-center gap-1.5 hover:text-primary transition-colors truncate mt-1"
              >
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{lead.referrer.contactNo}</span>
              </a>
            )}
            {lead.referrer?.email && (
              <a
                href={`mailto:${lead.referrer.email}`}
                className="flex items-center gap-1.5 hover:text-primary transition-colors truncate mt-1"
              >
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{lead.referrer.email}</span>
              </a>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground/70 mb-1">
              Points Earned
            </p>
            <p className="font-semibold text-foreground">
              {lead.referral?.rewardedPoints ?? 0} pts
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground/70 mb-1">
              {lead.referral
                ? lead.referral.rewardedAt
                  ? "Rewarded On"
                  : lead.referral.disqualifiedAt
                    ? "Disqualified On"
                    : lead.referral.qualifiedAt
                      ? "Qualified On"
                      : lead.referral.activatedAt
                        ? "Activated On"
                        : "Submitted On"
                : "Submitted On"}
            </p>

            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />

              <span>
                {format(
                  lead.referral?.rewardedAt ??
                    lead.referral?.disqualifiedAt ??
                    lead.referral?.qualifiedAt ??
                    lead.referral?.activatedAt ??
                    lead.createdAt,
                  "dd/MM/yyyy hh:mm a",
                )}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
