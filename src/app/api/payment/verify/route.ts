import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/user";
import Payment from "../../../models/Payment";

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

    const {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      plan,
      amount,
    } = await req.json();

    // Verify signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json(
        { message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Calculate subscription dates
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month subscription

    // Update user subscription
    user.subscriptionPlan = "premium";
    user.subscriptionStatus = "active";
    user.subscriptionStartDate = subscriptionStartDate;
    user.subscriptionEndDate = subscriptionEndDate;
    await user.save();

    // Save payment record
    await Payment.create({
      userId: user._id,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      amount: amount / 100, // Convert paise to rupees
      currency: "INR",
      status: "completed",
      plan,
      subscriptionDuration: 1, // 1 month
    });

    return NextResponse.json({
      message: "Payment verified successfully",
      subscription: {
        plan: user.subscriptionPlan,
        status: user.subscriptionStatus,
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate,
      },
    });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { message: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
