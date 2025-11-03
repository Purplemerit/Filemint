"use client";

// import { useState } from "react";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
export default function PdfToEpubPage() {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError(null);
    } else {
      setError("Only PDF files are supported.");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Only PDF files are supported.");
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setIsConverting(true);
    setError(null);

    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await fetch("/api/pdftoepub", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Conversion failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.epub";
      a.click();
      window.URL.revokeObjectURL(url);
      setFile(null);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Convert PDF to EPUB</h1>

        {error && (
          <div style={{ backgroundColor: "#ffe6e6", padding: "1rem", borderRadius: "5px", color: "#d00", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: "2px dashed #90EE90",
            backgroundColor: "#f0fff0",
            borderRadius: "10px",
            padding: "4rem",
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          <i className="fas fa-cloud-upload-alt" style={{ fontSize: "3rem", color: "#888" }}></i>
          <p style={{ marginTop: "1rem", marginBottom: "1rem" }}>Drag and drop a PDF file here</p>
          <label
            htmlFor="fileInput"
            style={{
              backgroundColor: "white",
              padding: "0.5rem 1rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              cursor: "pointer",
              display: "inline-block",
            }}
          >
            Select File
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {file && (
          <div style={{ backgroundColor: "#f9f9f9", padding: "1rem", borderRadius: "5px", marginBottom: "1rem" }}>
            <span>
              <i className="fas fa-file-pdf" style={{ color: "#d00", marginRight: "0.5rem" }}></i>
              {file.name}
            </span>
            <button
              onClick={() => setFile(null)}
              style={{
                marginLeft: "1rem",
                background: "none",
                border: "none",
                color: "#c00",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={isConverting}
          style={{
            marginTop: "1rem",
            backgroundColor: isConverting ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            padding: "0.6rem 1.2rem",
            borderRadius: "5px",
            cursor: isConverting ? "not-allowed" : "pointer",
            fontSize: "1rem",
          }}
        >
          <i className="fas fa-book" style={{ marginRight: "0.5rem" }}></i>
          {isConverting ? "Converting..." : "Convert to EPUB"}
        </button>
      </div>
    </div>
  );
}
