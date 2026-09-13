// import { NextRequest, NextResponse } from "next/server";
// import { ReferralService } from "@/app/actions/referrals/referral.service";

// function isAuthorizedCronRequest(request: NextRequest) {
//   const cronSecret = process.env.CRON_SECRET;

//   if (!cronSecret) {
//     return false;
//   }

//   const headerSecret = request.headers.get("x-cron-secret");
//   const authorization = request.headers.get("authorization");
//   const bearerToken = authorization?.startsWith("Bearer ")
//     ? authorization.slice(7)
//     : null;

//   return headerSecret === cronSecret || bearerToken === cronSecret;
// }

// async function processDueReferrals(request: NextRequest) {
//   try {
//     if (!isAuthorizedCronRequest(request)) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Unauthorized to process referrals",
//         },
//         { status: 401 },
//       );
//     }

//     const result = await ReferralService.processDueReferrals();
//     console.log("job result", result);

//     return NextResponse.json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     console.error("POST /api/referrals/process error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: "Internal server error",
//       },
//       { status: 500 },
//     );
//   }
// }

// export async function GET(request: NextRequest) {
//   return processDueReferrals(request);
// }

import { NextRequest, NextResponse } from "next/server";
import { ReferralService } from "@/app/actions/referrals/referral.service";

function isAuthorizedCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");

  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized to process referrals",
        },
        { status: 401 },
      );
    }

    const result = await ReferralService.processDueReferrals();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("GET /api/referrals/process error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
