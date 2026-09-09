import { NextRequest, NextResponse } from "next/server";
import { zodCreateEnquirySchema } from "@/app/actions/enquiry/enquiry.types";
import { EnquiryService } from "@/app/actions/enquiry/enquiry.service";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey || apiKey !== process.env.ENQUIRY_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const parsed = zodCreateEnquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid enquiry data",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await EnquiryService.createEnquiry(parsed.data);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/enquiries error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
