import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/user";

export async function GET(req: NextRequest) {
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

    // Check if subscription has expired
    if (
      user.subscriptionEndDate &&
      new Date(user.subscriptionEndDate) < new Date() &&
      user.subscriptionStatus === "active"
    ) {
      user.subscriptionStatus = "expired";
      user.subscriptionPlan = "basic";
      await user.save();
    }

    return NextResponse.json({
      subscriptionPlan: user.subscriptionPlan || "basic",
      subscriptionStatus: user.subscriptionStatus || "inactive",
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
    });
  } catch (error: any) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to get subscription status" },
      { status: 500 }
    );
  }
}
