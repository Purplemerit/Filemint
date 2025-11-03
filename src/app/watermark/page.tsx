"use client";

// import { useState } from "react";
import Navbar from "../components/Navbar";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
export default function PdfWatermarkPage() {
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
  const [watermark, setWatermark] = useState<string>("Confidential");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError(null);
    } else {
      setError("Only PDF files are supported.");
    }
  };

  const handleWatermark = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    if (!watermark) {
      setError("Please enter a watermark.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const pdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(watermark, {
          x: width / 2 - watermark.length * 3.5,
          y: height / 2,
          size: 40,
          rotate: degrees(-45),
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.5,
        });
      });

      const modifiedPdf = await pdfDoc.save();
      const blob = new Blob([modifiedPdf], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "watermarked.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
      setFile(null);
    } catch (err: any) {
      setError("Failed to process the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Add Watermark to PDF</h1>

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
          <p style={{ marginBottom: "1rem" }}>Drag and drop a PDF file here</p>
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

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="watermarkInput" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Watermark Text
          </label>
          <input
            type="text"
            id="watermarkInput"
            value={watermark}
            onChange={(e) => setWatermark(e.target.value)}
            placeholder="Enter watermark text..."
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <button
          onClick={handleWatermark}
          disabled={isProcessing}
          style={{
            marginTop: "1rem",
            backgroundColor: isProcessing ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            padding: "0.6rem 1.2rem",
            borderRadius: "5px",
            cursor: isProcessing ? "not-allowed" : "pointer",
            fontSize: "1rem",
          }}
        >
          <i className="fas fa-file-pdf" style={{ marginRight: "0.5rem" }}></i>
          {isProcessing ? "Processing..." : "Apply Watermark"}
        </button>
      </div>
    </div>
  );
}
