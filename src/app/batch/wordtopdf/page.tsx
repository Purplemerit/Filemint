"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import VerticalAdLeft from "../../components/Verticaladleft";
import VerticalAdRight from "../../components/Verticaladright";
import { PiCheckCircle, PiFileDoc, PiTrash, PiCloudArrowUp } from "react-icons/pi";

export default function DocToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.includes("msword") || file.type.includes("officedocument")
    );
    if (droppedFiles.length < e.dataTransfer.files.length) {
      setError("Only DOC/DOCX files are supported.");
    }
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        file.type.includes("msword") || file.type.includes("officedocument")
      );
      if (selectedFiles.length < e.target.files.length) {
        setError("Only DOC/DOCX files are supported.");
      }
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  // Remove file from list
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setError(null);
  };

  // Handle batch convert
  const handleConvert = async () => {
    if (files.length === 0) {
      setError("Please upload at least one DOC/DOCX file.");
      return;
    }

    setIsConverting(true);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/batch/wordtopdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Conversion failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/);
      const filename = filenameMatch?.[1] || "converted_files.zip";

      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      setFiles([]); // Reset
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error occurred";
      setError(message);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div>
      {/* Font Awesome CDN */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      <Navbar />

      <div className="main-layout">
        <VerticalAdLeft />

        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 className="tool-title">
            Batch Word to PDF
          </h1>

          {error && (
            <div
              style={{
                backgroundColor: "#ffe6e6",
                padding: "1rem",
                borderRadius: "10px",
                marginBottom: "1.5rem",
                color: "#d00",
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="drop-zone-container"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <PiCloudArrowUp size={64} style={{ color: "#888", marginBottom: '1rem' }} />
            <p style={{ marginTop: "1rem", marginBottom: "1.5rem", fontSize: '1.1rem', color: '#444' }}>
              Drag & drop DOC/DOCX files here
            </p>
            <label
              htmlFor="fileInput"
              className="primary-btn"
              style={{
                padding: "0.8rem 2rem",
                fontSize: "1rem",
                display: "inline-block",
                cursor: 'pointer'
              }}
            >
              Select Files
              <input
                id="fileInput"
                type="file"
                accept=".doc,.docx"
                multiple={true}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {files.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {files.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: "white",
                      padding: "1rem",
                      borderRadius: "12px",
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      border: '1px solid #eee',
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                      <PiFileDoc size={24} style={{ color: "#2b579a", flexShrink: 0 }} />
                      <span style={{ fontSize: '0.9rem', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        cursor: "pointer",
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <PiTrash size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="primary-btn"
                  style={{
                    padding: "1rem 3rem",
                    fontSize: "1.1rem",
                    opacity: isConverting ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  {isConverting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      Convert to PDF
                      <PiCheckCircle size={22} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "1rem", color: "#555" }}>
              Easily convert multiple DOC, DOCX files to PDF in one go with high fidelity.
            </p>
          </div>

          <div
            style={{
              marginTop: "3rem",
              padding: "2rem",
              backgroundColor: "#f0f9ff",
              border: "1px solid #cce5ff",
              borderRadius: "12px",
              fontSize: "0.95rem",
              fontFamily: 'Georgia, serif'
            }}
          >
            <strong style={{ fontSize: '1.1rem', color: '#0369a1' }}>Private. Encrypted. Automatically Deleted.</strong>
            <p style={{ marginTop: "0.75rem", color: "#555", lineHeight: '1.6' }}>
              Every document you upload is encrypted and automatically deleted after 2 hours.
              Your data stays yours—always. We process thousands of files daily with zero data retention.
            </p>
          </div>
        </div>
        <VerticalAdRight />
      </div>
    </div>
  );
}
