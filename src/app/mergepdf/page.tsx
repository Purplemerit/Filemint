"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
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
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.includes("pdf")
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        file.type.includes("pdf")
      );
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch("/api/merge", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      alert("Merge failed");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged.pdf";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>

      <Navbar />

      <div
        style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 2rem" }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>
          Merge PDF Files
        </h1>

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
            position: "relative",
          }}
        >
          <i
            className="fas fa-cloud-upload-alt"
            style={{ fontSize: "3rem", color: "#888" }}
          ></i>
          <p style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            Drag and drop PDF files here
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
            Select Files
            <input
              id="fileInput"
              type="file"
              accept="application/pdf"
              multiple
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
                  <i
                    className="fas fa-file-pdf"
                    style={{ color: "#c00", marginRight: "0.5rem" }}
                  ></i>
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
              onClick={handleMerge}
              style={{
                marginTop: "1rem",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "0.6rem 1.2rem",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: "0.5rem" }}></i>
              Merge PDFs
            </button>
          </div>
        )}

        <div style={{ marginTop: "3rem" }}>
          <p style={{ marginBottom: "1rem", fontSize: "0.95rem" }}>
           Easily switch between PDFs, Word, Excel, PPT, and more with our seamless online tool.
          </p>
          <ul style={{ listStyleType:"none",fontSize: "0.95rem", paddingLeft: "1rem" }}>
            <li>
              <i
                className="fa-regular fa-check-circle"
                style={{ color: "green", marginRight: "0.5rem" }}
              ></i>
              Convert files in seconds with drag-and-drop simplicity
            </li>
            <li>
              <i
                className="fa-regular fa-check-circle"
                style={{ color: "green", marginRight: "0.5rem" }}
              ></i>
              Works on any device — desktop, tablet, or mobile 
            </li>
            <li>
              <i
                className="fa-regular fa-check-circle"
                style={{ color: "green", marginRight: "0.5rem" }}
              ></i>
              Trusted by users worldwide for secure and fast conversion
            </li>
          </ul>
        </div>

        <div
          style={{
            marginTop: "3rem",
            padding: "1.5rem",
            backgroundColor: "#f0f9ff",
            border: "1px solid #cce5ff",
            borderRadius: "10px",
            fontSize: "0.95rem",
          }}
        >
          <strong>Protected. Encrypted. Automatically Deleted.</strong>
          <p style={{ marginTop: "0.5rem" }}>
            For years, our platform has helped users convert and manage files
            securely—with no file tracking, no storage, and full privacy. Every
            document you upload is encrypted and automatically deleted after 2
            hours. Your data stays yours—always.
          </p>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <img
              src="/google-cloud-logo.png"
              alt="Google Cloud"
              style={{ height: "30px" }}
            />
            <img
              src="/onedrive-logo.png"
              alt="OneDrive"
              style={{ height: "30px" }}
            />
            <img src="/dropbox-logo.png" alt="Dropbox" style={{ height: "30px" }} />
            <img src="/norton-logo.png" alt="Norton" style={{ height: "30px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
