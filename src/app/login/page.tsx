"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { oauthLogin } = useAuth();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "150px" }}>
      {/* Right Section with Login Form */}
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
            Log In To <span style={{ color: "#1D4ED8" }}>FileMint</span>
          </h1>

          {error && (
            <div
              style={{
                backgroundColor: "#fee",
                color: "#c33",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
                textAlign: "center",
                border: "1px solid #fcc",
                fontSize: "14px",
                lineHeight: "1.5"
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <input
                type="email"
                name="email"
                placeholder="Email"
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
            </div>
            <div style={{ marginBottom: "20px" }}>
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
            </div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 20px",
                  backgroundColor: loading ? "#999" : "#1D4ED8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  width: "100%",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </div>
            <div style={{ textAlign: "center" }}>
              <p>
                Don't have an account?{" "}
                <Link href="/signup" style={{ color: "#1D4ED8" }}>
                  Create Account
                </Link>
              </p>
            </div>
          </form>
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
                marginTop: "15px",
              }} onClick={() => oauthLogin("google")}
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
              }} onClick={() => oauthLogin("github")}
            >
              Continue with Github
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

