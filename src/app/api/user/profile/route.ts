import { NextRequest, NextResponse } from "next/server";
import connectMongo from "../../../routes/mongo";
import User from "../../../models/user";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    await connectMongo();

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectMongo();

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    console.log("🟢 [PUT] Body received:", body);

    const { firstName, lastName, email, currentPassword, newPassword } = body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;

    // ✅ Handle password change (for credentials provider only)
    if (user.provider === "credentials" && currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }

      user.password = newPassword;
    }

    console.log("🟢 [PUT] Saving updated user...");

    // ✅ --- CRITICAL FIX: bypass validation for OAuth users ---
    if (user.provider !== "credentials") {
      // Remove required-only fields manually
      user.set({
        password: undefined,
        termsAccepted: undefined,
      });

      // Save directly using updateOne (bypasses Mongoose validation completely)
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
        }
      );
    } else {
      // Normal save for credential users
      await user.save();
    }

    const updatedUser = await User.findById(user._id).select("-password");

    console.log("✅ [PUT] User updated successfully");
    return NextResponse.json(
      { message: "Profile updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [PUT /api/user/profile] Full error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ DELETE method for deleting account
export async function DELETE(req: NextRequest) {
  try {
    await connectMongo();

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await User.deleteOne({ _id: user._id });

    return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
