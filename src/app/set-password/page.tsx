"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
  const [email, setEmail] = useState("harshvardhansinghha@gmail.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("❌ Passwords don't match!");
      return;
    }

    if (password.length < 8) {
      setMessage("❌ Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ " + data.message);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error: any) {
      setMessage("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "12px",
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <h1 style={{ marginBottom: "10px", color: "#323D68", textAlign: "center" }}>
          🔐 Set Your Password
        </h1>

        <p style={{ marginBottom: "30px", color: "#666", textAlign: "center", fontSize: "14px" }}>
          Add a password to your Google/GitHub account so you can login with email and password too.
        </p>

        <form onSubmit={handleSetPassword}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#323D68" }}>
              Your Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "16px"
              }}
              required
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#323D68" }}>
              New Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "16px"
              }}
              required
            />
            <small style={{ color: "#888", fontSize: "12px", display: "block", marginTop: "5px" }}>
              Must be 8+ characters with uppercase, lowercase, number, and special character
            </small>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#323D68" }}>
              Confirm Password:
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "16px"
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "#ccc" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "20px"
            }}
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>

          {message && (
            <div style={{
              padding: "12px",
              borderRadius: "8px",
              background: message.startsWith("✅") ? "#efe" : "#fee",
              border: message.startsWith("✅") ? "1px solid #cfc" : "1px solid #fcc",
              color: message.startsWith("✅") ? "#3c3" : "#c33",
              textAlign: "center"
            }}>
              {message}
            </div>
          )}
        </form>

        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Already have a password?{" "}
            <a href="/login" style={{ color: "#667eea", fontWeight: "600", textDecoration: "none" }}>
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
