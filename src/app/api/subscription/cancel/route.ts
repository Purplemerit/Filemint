import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/user";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return NextResponse.json(
        { message: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.subscriptionStatus !== "active") {
      return NextResponse.json(
        { message: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    // Cancel subscription (will remain active until end date)
    user.subscriptionStatus = "cancelled";
    await user.save();

    return NextResponse.json({
      message: "Subscription cancelled successfully. You will have access until the end of your billing period.",
      subscription: {
        plan: user.subscriptionPlan,
        status: user.subscriptionStatus,
        endDate: user.subscriptionEndDate,
      },
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
