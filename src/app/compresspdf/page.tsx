"use client";

// import { useState } from "react";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
export default function CompressPdfPage() {
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
  const [files, setFiles] = useState<File[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.name.endsWith(".pdf")
    );
    if (droppedFiles.length < e.dataTransfer.files.length) {
      setError("Only PDF files are supported.");
    }
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        file.name.endsWith(".pdf")
      );
      if (selectedFiles.length < e.target.files.length) {
        setError("Only PDF files are supported.");
      }
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setError(null);
  };

  const handleCompress = async () => {
    if (files.length === 0) {
      setError("Please upload a PDF file.");
      return;
    }
    if (files.length > 1) {
      setError("Only one PDF file can be compressed at a time.");
      return;
    }

    setIsCompressing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const response = await fetch("/api/compresspdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Compression failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compressed.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
      setFiles([]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Compress PDF</h1>

        {error && (
          <div style={{ backgroundColor: "#ffe6e6", padding: "1rem", borderRadius: "5px", color: "#d00" }}>
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
          <p style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            Drag and drop a PDF file here
          </p>
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
            Select PDF
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              multiple={false}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {files.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            {files.map((file, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#f9f9f9",
                  padding: "0.75rem 1rem",
                  borderRadius: "5px",
                  marginBottom: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  <i className="fas fa-file-pdf" style={{ color: "#c00", marginRight: "0.5rem" }}></i>
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(index)}
                  style={{
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
            ))}

            <button
              onClick={handleCompress}
              disabled={isCompressing}
              style={{
                marginTop: "1rem",
                backgroundColor: isCompressing ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                padding: "0.6rem 1.2rem",
                borderRadius: "5px",
                cursor: isCompressing ? "not-allowed" : "pointer",
                fontSize: "1rem",
              }}
            >
              <i className="fas fa-compress-alt" style={{ marginRight: "0.5rem" }}></i>
              {isCompressing ? "Compressing..." : "Compress PDF"}
            </button>
          </div>
        )}

        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.95rem" }}>
            Easily compress PDF files to reduce their size while maintaining quality.
          </p>
        </div>

        <div
          style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            backgroundColor: "#f0fff0",
            border: "1px solid #90EE90",
            borderRadius: "10px",
            fontSize: "0.95rem",
            textAlign: "center",
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.5rem" }}>
            Protected. Encrypted. Automatically Deleted.
          </strong>
          <p>
            Your PDF files are encrypted during upload and automatically deleted after 2 hours. No tracking. No storage. Full privacy.
          </p>
        </div>
      </div>
    </div>
  );
}