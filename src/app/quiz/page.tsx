"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
export default function PdfQuizGenerator() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  // ✅ Redirect if not logged in
  // useEffect(() => {
  //   if (!isLoading && !token) {
  //     router.push("/login");
  //   }
  // }, [isLoading, token, router]);

  // if (isLoading || !token) {
  //   return (
  //     <div
  //       style={{
  //         textAlign: "center",
  //         marginTop: "5rem",
  //         fontSize: "1.5rem",
  //         fontWeight: "bold",
  //       }}
  //     >
  //       Checking authentication...
  //     </div>
  //   );
  // }
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!file) return alert("Please upload a PDF first");

    setLoading(true);
    setQuestions("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "question");

    const res = await fetch("/api/pdf-tools", { method: "POST", body: formData });
    const data = await res.json();

    setQuestions(data.result || data.error);
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f0f4ff, #ffffff)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "3rem 1rem",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          borderRadius: "16px",
          padding: "2.5rem",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            textAlign: "center",
            color: "#1e2b50",
            marginBottom: "1.5rem",
          }}
        >
          🧠 PDF Question Generator
        </h1>

        <label
          htmlFor="file-upload"
          style={{
            display: "block",
            marginBottom: "1rem",
            fontWeight: 500,
            color: "#333",
          }}
        >
          Upload your PDF file:
        </label>

        <input
          id="file-upload"
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            border: "2px dashed #b0b8d9",
            borderRadius: "8px",
            cursor: "pointer",
            background: "#fafbff",
            color: "#333",
            marginBottom: "1.5rem",
          }}
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 20px",
            backgroundColor: loading ? "#9da9cf" : "#1e2b50",
            color: "white",
            fontWeight: 600,
            borderRadius: "8px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background-color 0.3s ease, transform 0.2s ease",
          }}
          onMouseOver={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = "#2e3c6a";
          }}
          onMouseOut={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = "#1e2b50";
          }}
          onMouseDown={(e) => {
            if (!loading) e.currentTarget.style.transform = "scale(0.98)";
          }}
          onMouseUp={(e) => {
            if (!loading) e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {loading ? "Generating..." : "Generate Questions"}
        </button>

        {questions && (
          <div
            style={{
              marginTop: "2rem",
              background: "#f8faff",
              padding: "1.5rem",
              borderRadius: "10px",
              border: "1px solid #e0e6f5",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                fontSize: "1.2rem",
                color: "#1e2b50",
                marginBottom: "0.8rem",
              }}
            >
              Generated Questions:
            </h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "0.95rem",
                lineHeight: "1.6",
                color: "#333",
                background: "#ffffff",
                padding: "1rem",
                borderRadius: "6px",
                border: "1px solid #eaeaea",
              }}
            >
              {questions}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
