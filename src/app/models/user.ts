import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string | null;
  termsAccepted?: boolean;
  provider?: "credentials" | "google" | "github";
  subscriptionPlan?: "basic" | "premium";
  subscriptionStatus?: "active" | "inactive" | "cancelled" | "expired";
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: false  },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function (this: IUser) {
        return this.provider === "credentials";
      },
      select: false,
    },
    termsAccepted: {
      type: Boolean,
      required: function (this: IUser) {
        return this.provider === "credentials";
      },
    },
    provider: {
      type: String,
      enum: ["credentials", "google", "github"],
      default: "credentials",
    },
    subscriptionPlan: {
      type: String,
      enum: ["basic", "premium"],
      default: "basic",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "cancelled", "expired"],
      default: "inactive",
    },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    razorpaySubscriptionId: { type: String },
    razorpayCustomerId: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

// ✅ Hash password automatically if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// ✅ Method for comparing passwords safely
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// ✅ Always reuse model if it exists (important for Next.js hot reload)
const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
