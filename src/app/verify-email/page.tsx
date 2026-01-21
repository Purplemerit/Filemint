"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";

function VerifyEmailContent() {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // If no email in URL, redirect to signup
      router.push("/signup");
    }
  }, [searchParams, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Email verified successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResending(true);

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("New verification code sent! Check your email.");
      } else {
        setError(data.message || "Failed to resend code");
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only numbers
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          background: "white",
          borderRadius: "16px",
          padding: "2.5rem",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "2.5rem",
            }}
          >
            📧
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              color: "#323D68",
              marginBottom: "0.5rem",
            }}
          >
            Verify Your Email
          </h1>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>
            We sent a 6-digit verification code to
          </p>
          <p
            style={{
              color: "#667eea",
              fontWeight: "600",
              fontSize: "1rem",
              marginTop: "0.5rem",
            }}
          >
            {email}
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="otp"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#323D68",
              }}
            >
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={handleOtpChange}
              placeholder="Enter 6-digit code"
              style={{
                width: "100%",
                padding: "0.875rem",
                fontSize: "1.5rem",
                letterSpacing: "0.5rem",
                textAlign: "center",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                outline: "none",
                fontFamily: "'Courier New', monospace",
                fontWeight: "700",
              }}
              maxLength={6}
              autoFocus
            />
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666",
                marginTop: "0.5rem",
                textAlign: "center",
              }}
            >
              Code expires in 10 minutes
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "#fee",
                border: "1px solid #fcc",
                color: "#c33",
                padding: "0.875rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: "#efe",
                border: "1px solid #cfc",
                color: "#3c3",
                padding: "0.875rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            style={{
              width: "100%",
              padding: "0.875rem",
              background:
                loading || otp.length !== 6
                  ? "#ccc"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer",
              transition: "opacity 0.3s",
            }}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            paddingTop: "1.5rem",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: "transparent",
              color: "#667eea",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: resending ? "not-allowed" : "pointer",
              textDecoration: "underline",
            }}
          >
            {resending ? "Sending..." : "Resend Code"}
          </button>
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>
            Wrong email?{" "}
            <a
              href="/signup"
              style={{
                color: "#667eea",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Sign up again
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div style={{ textAlign: "center", color: "white" }}>
        <p>Loading...</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<LoadingFallback />}>
        <VerifyEmailContent />
      </Suspense>
      <Footer />
    </>
  );
}
