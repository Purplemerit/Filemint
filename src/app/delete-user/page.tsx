"use client";
import { useState } from "react";

export default function DeleteUserPage() {
  const [email, setEmail] = useState("harshvardhansinghha@gmail.com");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the user: ${email}?`)) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}. You can now sign up again with this email.`);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
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
        <h1 style={{ marginBottom: "20px", color: "#323D68" }}>
          🗑️ Delete User Account
        </h1>

        <p style={{ marginBottom: "20px", color: "#666" }}>
          This is a temporary debugging tool. Use this to delete your account so you can sign up again with a fresh start.
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#323D68" }}>
            Email to delete:
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
          />
        </div>

        <button
          onClick={handleDelete}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#ccc" : "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "20px"
          }}
        >
          {loading ? "Deleting..." : "Delete User"}
        </button>

        {message && (
          <div style={{
            padding: "12px",
            borderRadius: "8px",
            background: message.startsWith("✅") ? "#efe" : "#fee",
            border: message.startsWith("✅") ? "1px solid #cfc" : "1px solid #fcc",
            color: message.startsWith("✅") ? "#3c3" : "#c33"
          }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
            After deleting, you can:
          </p>
          <ol style={{ fontSize: "14px", color: "#666", marginLeft: "20px" }}>
            <li>Go to <a href="/signup" style={{ color: "#667eea", fontWeight: "600" }}>Sign Up</a></li>
            <li>Create a new account with the same email</li>
            <li>Complete email verification</li>
            <li>Login successfully</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
