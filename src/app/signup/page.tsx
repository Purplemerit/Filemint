"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    termsAccepted: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { oauthLogin } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!formData.termsAccepted) {
      setError("You must accept the Terms & Conditions");
      return;
    }

    setLoading(true);

    try {
      // Call signup API directly (don't use AuthContext.signup)
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if email verification is required
        if (data.requiresVerification) {
          // Redirect to verification page
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        } else {
          // If no verification needed (shouldn't happen with credentials), redirect to login
          router.push("/login");
        }
      } else {
        setError(data.message || "Signup failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "150px" }}>
      {/* Centered Signup Form Section */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
          padding: "20px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <h1 style={{ textAlign: "center", color: "black" }}>
            Create a <span style={{ color: "#1D4ED8" }}>FileMint</span> Account
          </h1>

          <p
            style={{
              textAlign: "center",
              color: "#666",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            We'll send you a verification code to your email
          </p>

          {error && (
            <div
              style={{
                backgroundColor: "#fee",
                color: "#c33",
                padding: "10px",
                borderRadius: "5px",
                marginBottom: "15px",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email (no temporary emails)"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
                required
              />
              <small
                style={{
                  color: "#888",
                  fontSize: "12px",
                  display: "block",
                  marginTop: "5px",
                }}
              >
                Must be 8+ characters with uppercase, lowercase, number, and special character
              </small>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "14px" }}>
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  required
                  style={{ marginRight: "8px" }}
                />
                I agree to the{" "}
                <Link href="/terms" style={{ color: "#1D4ED8", textDecoration: "underline" }}>
                  Terms & Conditions
                </Link>
              </label>
            </div>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: loading ? "#999" : "#1D4ED8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  width: "100%",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#666", fontSize: "14px" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "#1D4ED8", fontWeight: "600" }}>
                  Log In
                </Link>
              </p>
            </div>
          </form>

          <div
            style={{
              margin: "20px 0",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                borderTop: "1px solid #ddd",
                position: "relative",
                margin: "20px 0",
              }}
            >
              <span
                style={{
                  background: "#fff",
                  padding: "0 10px",
                  position: "relative",
                  top: "-12px",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                OR
              </span>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              style={{
                backgroundColor: "#fff",
                color: "#1D4ED8",
                border: "1px solid #1D4ED8",
                padding: "10px 20px",
                borderRadius: "5px",
                width: "100%",
                cursor: "pointer",
                marginTop: "10px",
                fontSize: "14px",
                fontWeight: "600",
              }}
              onClick={() => oauthLogin("google")}
            >
              Continue with Google
            </button>
            <button
              style={{
                backgroundColor: "#fff",
                color: "#1D4ED8",
                border: "1px solid #1D4ED8",
                padding: "10px 20px",
                borderRadius: "5px",
                width: "100%",
                cursor: "pointer",
                marginTop: "10px",
                fontSize: "14px",
                fontWeight: "600",
              }}
              onClick={() => oauthLogin("github")}
            >
              Continue with Github
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
