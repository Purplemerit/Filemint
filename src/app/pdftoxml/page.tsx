"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
// import { useState } from "react";
import Navbar from "../components/Navbar";

export default function PdfToXmlPage() {
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
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") {
      setFile(f); setError(null);
    } else {
      setError("Only PDF files are supported.");
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f?.type === "application/pdf") {
      setFile(f); setError(null);
    } else {
      setError("Only PDF files are supported.");
    }
  };

  const convert = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }
    setIsConverting(true);
    setError(null);

    const fd = new FormData();
    fd.append("files", file);

    try {
      const res = await fetch("/api/pdftoxml", { method: "POST", body: fd });
      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        let msg = "Conversion failed";
        if (ct.includes("application/json")) {
          const err = await res.json();
          msg = err.error || msg;
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.xml";
      a.click();
      window.URL.revokeObjectURL(url);
      setFile(null);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "4rem auto", padding: "0 2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Convert PDF to XML</h1>

        {error && (
          <div style={{ background: "#ffe6e6", padding: "1rem", borderRadius: "5px", color: "#d00", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: "2px dashed #90EE90",
            background: "#f0fff0",
            padding: "4rem",
            textAlign: "center",
            borderRadius: "10px",
            marginBottom: "2rem",
          }}
        >
          <i className="fas fa-cloud-upload-alt" style={{ fontSize: "3rem", color: "#888" }} />
          <p>Drag and drop a PDF file here</p>
          <label style={{ background: "white", padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer" }}>
            Select File
            <input type="file" accept=".pdf" onChange={onChange} style={{ display: "none" }} />
          </label>
        </div>

        {file && (
          <div style={{ background: "#f9f9f9", padding: "1rem", borderRadius: "5px", marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
            <span>
              <i className="fas fa-file-pdf" style={{ color: "#d00", marginRight: ".5rem" }} />
              {file.name}
            </span>
            <button onClick={() => setFile(null)} style={{ background: "none", border: "none", color: "#c00", cursor: "pointer" }}>
              <i className="fas fa-trash-alt" />
            </button>
          </div>
        )}

        <button
          onClick={convert}
          disabled={isConverting}
          style={{
            background: isConverting ? "#ccc" : "#28a745",
            color: "white",
            padding: "0.6rem 1.2rem",
            borderRadius: "5px",
            border: "none",
            cursor: isConverting ? "not-allowed" : "pointer",
            fontSize: "1rem",
          }}
        >
          {isConverting ? "Converting..." : <><i className="fas fa-file-code" style={{ marginRight: ".5rem" }} />Convert to XML</>}
        </button>
      </div>
    </div>
  );
}
