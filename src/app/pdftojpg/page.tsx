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
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export default function PdfToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [convertedFileBlob, setConvertedFileBlob] = useState<Blob | null>(null);
  const instructionData = toolData["pdf-to-jpg"];

  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConverted, setIsConverted] = useState(false);

  const handleDownload = () => {
    if (!convertedFileBlob) return;
    const url = window.URL.createObjectURL(convertedFileBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file?.name.replace(".pdf", "-images.zip") || "images.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Auto-download effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isConverted && convertedFileBlob) {
      timeoutId = setTimeout(() => {
        handleDownload();
      }, 7000); // 7 seconds delay
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isConverted, convertedFileBlob]);

  const handleReset = () => {
    setFile(null);
    setConvertedFileBlob(null);
    setIsConverted(false);
    setError(null);
    setProgress(0);
    setTotalPages(0);
  };
  const [progress, setProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [quality, setQuality] = useState<number>(0.95);

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      if (file.type === "application/pdf") {
        setFile(file);
        setError(null);
      } else {
        setError("Only PDF files are supported.");
      }
      setIsDropdownOpen(false);
    },
  });

  const { openPicker: openDropboxPicker } = useDropboxPicker({
    onFilePicked: (file) => {
      if (file.type === "application/pdf") {
        setFile(file);
        setError(null);
      } else {
        setError("Only PDF files are supported.");
      }
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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf"))) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Only PDF files are supported.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && (selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf"))) {
      setFile(selected);
      setError(null);
    } else {
      setError("Only PDF files are supported.");
    }
    setIsDropdownOpen(false);
  };

  const handleFromDevice = () => {
    fileInputRef.current?.click();
  };

  const handlePasteUrl = () => {
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
      setFile(file);
      setUrlInput("");
      setShowUrlModal(false);
      setError(null);
    } catch (error) {
      alert("Failed to fetch PDF from URL");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        if (item.types.includes("application/pdf")) {
          const blob = await item.getType("application/pdf");
          const file = new File([blob], "clipboard.pdf", { type: "application/pdf" });
          setFile(file);
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
    setFile(null);
    setConvertedFileBlob(null);
    setIsConverted(false);
    setError(null);
    setProgress(0);
    setTotalPages(0);
  };

  const handleConvert = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setError(null);

    try {
      // Read PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      setTotalPages(numPages);

      console.log(`Converting ${numPages} pages...`);

      // Create ZIP
      const zip = new JSZip();

      // Convert each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);

          // Set scale for quality (2.0 = high quality)
          const scale = 2.0;
          const viewport = page.getViewport({ scale });

          // Create canvas
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Could not get canvas context");
          }

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Render PDF page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          // Convert canvas to JPG blob
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Failed to create blob"));
              },
              "image/jpeg",
              quality
            );
          });

          // Add to ZIP with padded numbers
          const paddedPageNum = pageNum.toString().padStart(3, '0');
          zip.file(`page-${paddedPageNum}.jpg`, blob);

          // Update progress
          setProgress(Math.round((pageNum / numPages) * 100));

          console.log(`Page ${pageNum}/${numPages} converted`);
        } catch (pageError) {
          console.error(`Error converting page ${pageNum}:`, pageError);
        }
      }

      console.log("Generating ZIP file...");

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });


      setConvertedFileBlob(zipBlob);
      setIsConverted(true);

      console.log("Conversion complete!");
    } catch (err: any) {
      console.error("Conversion error:", err);
      setError(err.message || "Failed to convert PDF. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleShare = () => {
    if (!convertedFileBlob) {
      alert("Please convert the file first before sharing");
      return;
    }
    setShowShareModal(true);
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
    { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: openDropboxPicker },
    { icon: <PiClipboard size={18} />, label: "From Clipboard", onClick: handleFromClipboard },
  ];

  return (
    <div>
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 2rem" }}>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "600",
          marginBottom: "2rem",
          textAlign: "left",
          color: "#1a1a1a",
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}>
          PDF to JPG
        </h1>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: "3px solid rgba(216, 121, 253, 0.5)",
            backgroundColor: "rgb(243, 230, 255)",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center",
            marginBottom: "2rem",
            position: "relative",
            minHeight: "280px",
          }}
        >
          {isConverted ? (
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
                Converted Successfully!
              </h2>
              <p style={{ color: "#666", textAlign: "center", maxWidth: "400px" }}>
                Your PDF has been converted to JPG images. Download your ZIP file below.
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
                  Download Images (ZIP)
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
                  Convert Another File
                </button>
              </div>
            </div>
          ) : !file ? (
            /* Empty State */
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "300px",
              minHeight: "220px",
            }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <img src="./upload.svg" alt="Upload Icon" />
              </div>

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
            /* File Uploaded State */
            <div>
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
                marginBottom: "1.5rem",
              }}>
                <button
                  onClick={handleConvert}
                  disabled={isConverting}
                  style={{
                    backgroundColor: "#e11d48",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: isConverting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: "500",
                    opacity: isConverting ? 0.7 : 1,
                  }}
                >
                  {isConverting ? `Converting... ${progress}%` : "Convert to JPG"}
                </button>
                <button
                  onClick={handleShare}
                  disabled={!convertedFileBlob}
                  style={{
                    backgroundColor: "white",
                    color: "#333",
                    border: "1px solid #e0e0e0",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: !convertedFileBlob ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: "500",
                    opacity: !convertedFileBlob ? 0.5 : 1
                  }}
                >
                  <TbShare3 />
                  Share
                </button>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.5rem",
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
                    {file.name}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {isConverting && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: "100%",
                      backgroundColor: "#007bff",
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                  <p style={{
                    textAlign: "center",
                    fontSize: "0.85rem",
                    color: "#666",
                    marginTop: "0.5rem"
                  }}>
                    Converting page {Math.ceil(progress * totalPages / 100)} of {totalPages}
                  </p>
                </div>
              )}

              {/* Quality Slider */}
              {!isConverting && (
                <div style={{
                  backgroundColor: "white",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}>
                  <label style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    color: "#333",
                  }}>
                    Image Quality: {Math.round(quality * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    style={{
                      width: "100%",
                    }}
                  />
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "#666",
                    marginTop: "0.25rem",
                  }}>
                    <span>Smaller File</span>
                    <span>Higher Quality</span>
                  </div>
                </div>
              )}

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

          {!file && (
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
            Convert each page of your PDF into high-quality JPG images with our seamless online tool.
          </p>
          <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
            {[
              "100% browser-based - your files never leave your device",
              "Extract all pages as separate JPG images",
              "Download as a ZIP file containing all images",
              "Adjust quality for optimal file size"
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
          <strong>100% Private & Secure.</strong>
          <p style={{ marginTop: "0.5rem", color: "#555" }}>
            All conversion happens directly in your browser. Your PDF never gets uploaded to any server.
            Complete privacy guaranteed - your files never leave your computer.
          </p>
        </div>
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
        fileBlob={convertedFileBlob}
        fileName={file?.name.replace(".pdf", "-images.zip") || "converted.zip"}
      />
      <Footer />
    </div>
  );
}