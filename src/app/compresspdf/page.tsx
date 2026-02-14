"use client";

import Navbar from "../components/Navbar";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { TbShare3 } from "react-icons/tb";
import {
  PiFiles,
  PiLink,
  PiClipboard,
  PiCaretDown,
  PiUploadSimple,
  PiCheckCircle,
  PiX
} from "react-icons/pi";
import { FaGoogleDrive, FaDropbox } from "react-icons/fa";
import ShareModal from "../components/ShareModal";
import { useGoogleDrivePicker } from "../hooks/useGoogleDrivePicker";
import { useDropboxPicker } from "../hooks/useDropboxPicker";
import ToolInstructions from "../components/ToolInstructions";
import toolData from "../data/toolInstructions.json";
import Testimonials from "../components/Testimonials";
import testimonialData from "../data/testimonials.json";
import Footer from "../components/footer";
import VerticalAdLeft from "../components/Verticaladleft";
import VerticalAdRight from "../components/Verticaladright";

export default function CompressPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [compressedFileBlob, setCompressedFileBlob] = useState<Blob | null>(null);
  const instructionData = toolData["compress-pdf"];

  const [isCompressing, setIsCompressing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isCompressed, setIsCompressed] = useState(false);
  const [stats, setStats] = useState<{ original: number; compressed: number; percent: number } | null>(null);

  const handleDownload = () => {
    if (!compressedFileBlob) return;
    const url = window.URL.createObjectURL(compressedFileBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compressed_${files[0]?.name || "document.pdf"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Auto-download effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isCompressed && compressedFileBlob) {
      timeoutId = setTimeout(() => {
        handleDownload();
      }, 7000); // 7 seconds delay
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isCompressed, compressedFileBlob]);

  const handleReset = () => {
    setFiles([]);
    setCompressedFileBlob(null);
    setIsCompressed(false);
    setStats(null);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCompress = async () => {
    if (files.length === 0) {
      setError("Please upload a PDF file.");
      return;
    }

    setIsCompressing(true);
    setError(null);

    const originalSize = files[0].size;
    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const response = await fetch("/api/compresspdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Compression failed");
      }

      const reductionPercent = parseInt(response.headers.get("X-Reduction-Percent") || "0");
      const blob = await response.blob();

      setCompressedFileBlob(blob);
      setStats({
        original: originalSize,
        compressed: blob.size,
        percent: reductionPercent
      });
      setIsCompressed(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsCompressing(false);
    }
  };

  const { openPicker: openGoogleDrivePicker, isLoaded: isGoogleLoaded } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      setFiles([file]);
      setIsDropdownOpen(false);
    },
  });

  const { openPicker: openDropboxPicker, isLoaded: isDropboxLoaded } = useDropboxPicker({
    onFilePicked: (file) => {
      setFiles([file]);
      setIsDropdownOpen(false);
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );
    if (droppedFiles.length > 0) {
      setFiles([droppedFiles[0]]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles([e.target.files[0]]);
      setError(null);
    }
    setIsDropdownOpen(false);
  };

  const handleFromDevice = () => {
    fileInputRef.current?.click();
  };

  const handlePasteUrl = async () => {
    setShowUrlModal(true);
    setIsDropdownOpen(false);
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    try {
      setIsUploading(true);
      const response = await fetch(urlInput);
      const blob = await response.blob();

      if (blob.type !== "application/pdf") {
        alert("URL must point to a PDF file");
        return;
      }

      const fileName = urlInput.split("/").pop() || "downloaded.pdf";
      const file = new File([blob], fileName, { type: "application/pdf" });
      setFiles([file]);
      setUrlInput("");
      setShowUrlModal(false);
      setError(null);
    } catch (error) {
      alert("Failed to fetch PDF from URL");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoogleDrive = () => {
    openGoogleDrivePicker();
  };

  const handleDropbox = () => {
    openDropboxPicker();
  };

  const handleFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        if (item.types.includes("application/pdf")) {
          const blob = await item.getType("application/pdf");
          const file = new File([blob], "clipboard.pdf", { type: "application/pdf" });
          setFiles([file]);
          setError(null);
          break;
        }
      }
    } catch (error) {
      alert("No PDF found in clipboard or clipboard access denied");
    }
    setIsDropdownOpen(false);
  };

  const removeFile = () => {
    setFiles([]);
    setCompressedFileBlob(null);
    setIsCompressed(false);
    setError(null);
  };

  const handleShare = () => {
    if (!compressedFileBlob) {
      alert("Please compress the file first before sharing");
      return;
    }
    setShowShareModal(true);
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: handleGoogleDrive },
    { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: handleDropbox },
    { icon: <PiClipboard size={18} />, label: "From Clipboard", onClick: handleFromClipboard },
  ];

  return (
    <div>
      <Navbar />

      <div style={{
        display: "flex",
        maxWidth: "1400px",
        margin: "4rem auto",
        padding: "0 2rem",
        gap: "2rem",
        alignItems: "flex-start"
      }}>
        {/* Left Ad */}
        <VerticalAdLeft />

        {/* Main Content */}
        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "600",
            marginBottom: "2rem",
            textAlign: "left",
            color: "#1a1a1a",
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
            Compress PDF
          </h1>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{
              border: "3px solid rgba(144, 238, 144, 0.5)",
              backgroundColor: "rgba(144, 238, 144, 0.2)",
              borderRadius: "12px",
              padding: "2rem",
              textAlign: "center",
              marginBottom: "2rem",
              position: "relative",
              minHeight: "280px",
            }}
          >
            {isCompressed ? (
              /* Success State - Download */
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "1.5rem",
              }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#e8f5e9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2e7d32",
                  marginBottom: "0.5rem"
                }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0, textAlign: "center" }}>
                  PDF Compressed Successfully!
                </h2>

                {stats && (
                  <div style={{
                    display: "flex",
                    gap: "2rem",
                    padding: "1rem 2rem",
                    backgroundColor: "#f9fafb",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    marginTop: "0.5rem"
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280", textTransform: "uppercase" }}>Original</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "#374151" }}>{formatSize(stats.original)}</div>
                    </div>
                    <div style={{ width: "1px", backgroundColor: "#e5e7eb" }}></div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280", textTransform: "uppercase" }}>Compressed</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "#e11d48" }}>{formatSize(stats.compressed)}</div>
                    </div>
                    <div style={{ width: "1px", backgroundColor: "#e5e7eb" }}></div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280", textTransform: "uppercase" }}>Savings</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "#059669" }}>{stats.percent}%</div>
                    </div>
                  </div>
                )}

                <p style={{ color: "#666", textAlign: "center", maxWidth: "400px" }}>
                  Your PDF has been compressed. Download your file below.
                </p>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    onClick={handleDownload}
                    className="download-button"
                    style={{
                      backgroundColor: "#e11d48", // Brand color
                      color: "white",
                      padding: "1rem 2.5rem",
                      borderRadius: "8px",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)"
                    }}
                  >
                    Download Compressed PDF
                  </button>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    onClick={handleShare}
                    style={{
                      background: "transparent",
                      color: "#666",
                      border: "1px solid #ccc",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <TbShare3 /> Share
                  </button>
                  <button
                    onClick={handleReset}
                    style={{
                      background: "transparent",
                      color: "#666",
                      border: "1px solid #ccc",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Compress Another PDF
                  </button>
                </div>
              </div>
            ) : files.length === 0 ? (
              /* Empty State - Show upload UI */
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "300px",
                minHeight: "220px",
              }}>
                {/* Cloud Upload Icon */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <img src="./upload.svg" alt="Upload Icon" />
                </div>

                {/* Dropdown Button */}
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      backgroundColor: "white",
                      padding: "0.6rem 1rem",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      color: "#333",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <PiFiles size={18} />
                    Select File
                    <PiCaretDown size={14} style={{ marginLeft: "0.25rem" }} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "white",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 1000,
                        minWidth: "180px",
                        overflow: "hidden",
                      }}
                    >
                      {menuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={item.onClick}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.7rem 1rem",
                            width: "100%",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            color: "#333",
                            textAlign: "left",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f5f5f5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <span style={{ color: "#666", display: "flex", alignItems: "center" }}>
                            {item.icon}
                          </span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            ) : (
              /* File Uploaded State - Show single file card */
              <div>
                {/* Download and Share buttons */}
                <div style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginBottom: "1.5rem",
                }}>
                  <button
                    onClick={handleCompress}
                    disabled={isCompressing}
                    style={{
                      backgroundColor: "#e11d48",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: isCompressing ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      opacity: isCompressing ? 0.7 : 1,
                    }}
                  >
                    {isCompressing ? "Compressing..." : "Compress PDF"}
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={!compressedFileBlob}
                    style={{
                      backgroundColor: "white",
                      color: "#333",
                      border: "1px solid #e0e0e0",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: !compressedFileBlob ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      opacity: !compressedFileBlob ? 0.5 : 1
                    }}
                  >
                    <TbShare3 />
                    Share
                  </button>
                </div>

                {/* Single File Card */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <div
                    style={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      width: "120px",
                      height: "140px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      position: "relative",
                    }}
                  >
                    {/* Remove button */}
                    <button
                      onClick={removeFile}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        background: "rgba(255, 255, 255, 1)",
                        border: "none",
                        borderRadius: "50%",
                        width: "25px",
                        height: "25px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "black",
                      }}
                    >
                      <PiX size={18} />
                    </button>

                    <img src="./pdf.svg" alt="PDF Icon" style={{ width: "40px", height: "50px", marginBottom: "0.5rem" }} />
                    <span style={{
                      fontSize: "0.65rem",
                      color: "#666",
                      maxWidth: "100px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      padding: "0 0.5rem"
                    }}>
                      {files[0].name}
                    </span>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <p style={{
                    color: "#dc2626",
                    fontSize: "0.85rem",
                    marginTop: "1rem",
                    textAlign: "center"
                  }}>
                    {error}
                  </p>
                )}

                {/* Quick action icons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                    marginTop: "1.5rem",
                    opacity: 0.4,
                  }}
                >
                  <PiUploadSimple size={18} />
                  <PiLink size={18} />
                  <FaGoogleDrive size={16} />
                  <FaDropbox size={16} />
                  <PiClipboard size={18} />
                </div>
              </div>
            )}

            {/* Quick action icons for empty state */}
            {files.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "90%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  gap: "0.5rem",
                  opacity: 0.4,
                }}
              >
                <PiUploadSimple size={20} />
                <PiLink size={20} />
                <FaGoogleDrive size={18} />
                <FaDropbox size={18} />
                <PiClipboard size={20} />
              </div>
            )}
          </div>

          {/* Info Section */}
          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>
              Easily compress your PDF files to reduce their size while maintaining quality.
            </p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {[
                "Compress files in seconds with drag-and-drop simplicity",
                "Works on any device — desktop, tablet, or mobile",
                "Trusted by users worldwide for secure and fast compression"
              ].map((text, index) => (
                <li key={index} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <PiCheckCircle size={18} style={{ color: "green", flexShrink: 0 }} />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Security Section */}
          <div
            style={{
              marginTop: "3rem",
              padding: "1.5rem",
              backgroundColor: "#f0f9ff",
              border: "1px solid #cce5ff",
              borderRadius: "10px",
              fontSize: "0.95rem",
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            <strong>Protected. Encrypted. Automatically Deleted.</strong>
            <p style={{ marginTop: "0.5rem", color: "#555" }}>
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
                filter: "grayscale(100%)",
              }}
            >
              <img src="/google-cloud-logo.png" alt="Google Cloud" style={{ height: "30px" }} />
              <img src="/onedrive-logo.png" alt="OneDrive" style={{ height: "30px" }} />
              <img src="/dropbox-logo.png" alt="Dropbox" style={{ height: "30px" }} />
              <img src="/norton-logo.png" alt="Norton" style={{ height: "30px" }} />
            </div>
          </div>
        </div>
        <VerticalAdRight />

      </div>

      {/* URL Input Modal */}
      {showUrlModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setShowUrlModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "500px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "1rem" }}>Paste PDF URL</h3>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/document.pdf"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "0.9rem",
                marginBottom: "1rem",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowUrlModal(false)}
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUrlSubmit}
                disabled={isUploading}
                style={{
                  padding: "0.5rem 1rem",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: "#e11d48",
                  color: "white",
                  cursor: isUploading ? "not-allowed" : "pointer",
                  opacity: isUploading ? 0.7 : 1,
                }}
              >
                {isUploading ? "Loading..." : "Add PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToolInstructions
        title={instructionData.title}
        steps={instructionData.steps as any}
      />
      <Testimonials
        title="What Our Users Say"
        testimonials={testimonialData.testimonials}
        autoScrollInterval={3000}
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        fileBlob={compressedFileBlob}
        fileName="compressed.pdf"
      />
      <Footer />
    </div>
  );
}