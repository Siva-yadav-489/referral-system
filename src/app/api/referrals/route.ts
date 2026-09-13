import { NextRequest, NextResponse } from "next/server";
import { zodCreateReferralLeadSchema } from "@/app/actions/referrals/referral.types";
import { ReferralService } from "@/app/actions/referrals/referral.service";

function unauthorizedResponse({ message }: { message?: string }) {
  return NextResponse.json(
    {
      success: false,
      error: message || "Unauthorized",
    },
    { status: 401 },
  );
}

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // 1. Verify HTTP method / content type
    // --------------------------------------------------

    const contentType = request.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "Content-Type must be application/json",
        },
        { status: 415 },
      );
    }

    // --------------------------------------------------
    // 2. Authenticate API request
    // --------------------------------------------------

    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = process.env.REFERRAL_API_KEY;

    if (!expectedApiKey || !apiKey) {
      return unauthorizedResponse({ message: "API key is required." });
    }

    if (apiKey !== expectedApiKey) {
      return unauthorizedResponse({ message: "Invalid API key." });
    }

    // --------------------------------------------------
    // 4. Parse JSON safely
    // --------------------------------------------------

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON body.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 5. Validate request schema
    // --------------------------------------------------

    const parsed = zodCreateReferralLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid referral data.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 6. Business-level validation
    // --------------------------------------------------

    const data = parsed.data;

    // both email and contact number should exist for the referrer.
    if (!data.referrerEmail || !data.referrerContactNo) {
      return NextResponse.json(
        {
          success: false,
          error: "Referrer email and contact number is required.",
        },
        { status: 400 },
      );
    }

    // both email and contact number should exist for the referee.
    if (!data.refereeEmail || !data.refereeContactNo) {
      return NextResponse.json(
        {
          success: false,
          error: "Referee email and contact number is required.",
        },
        { status: 400 },
      );
    }

    // Referrer and referee cannot be the same person.
    if (
      data.referrerEmail &&
      data.refereeEmail &&
      data.referrerEmail.trim().toLowerCase() ===
        data.refereeEmail.trim().toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A person cannot refer themselves.",
        },
        { status: 400 },
      );
    }

    if (
      data.referrerContactNo &&
      data.refereeContactNo &&
      data.referrerContactNo.replace(/\D/g, "") ===
        data.refereeContactNo.replace(/\D/g, "")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A person cannot refer themselves.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 7. Create referral lead
    // --------------------------------------------------

    const result = await ReferralService.createReferralLead(data);

    if (!result.success) {
      return NextResponse.json(result, {
        status: result.error === "Property not found" ? 404 : 400,
      });
    }

    // --------------------------------------------------
    // 8. Success
    // --------------------------------------------------

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/referrals error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error.",
      },
      { status: 500 },
    );
  }
}
