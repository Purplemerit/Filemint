"use client";

import Navbar from "../components/Navbar";
import { PDFDocument, rgb, degrees } from "pdf-lib";
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
  PiX,
  PiDropHalfBottom
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
export default function PdfWatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [watermark, setWatermark] = useState<string>("Confidential");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [watermarkedBlob, setWatermarkedBlob] = useState<Blob | null>(null);
  const instructionData = toolData["add-watermark"] 

  const [watermarkedBlobUrl, setWatermarkedBlobUrl] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(40);
  const [opacity, setOpacity] = useState<number>(0.5);
  const [rotation, setRotation] = useState<number>(-45);

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      if (file.type === "application/pdf") {
        setFile(file);
        setError(null);
        setWatermarkedBlobUrl(null);
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
        setWatermarkedBlobUrl(null);
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
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
      setWatermarkedBlobUrl(null);
    } else {
      setError("Only PDF files are supported.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError(null);
      setWatermarkedBlobUrl(null);
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
      setWatermarkedBlobUrl(null);
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
          setWatermarkedBlobUrl(null);
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
    setError(null);
    setWatermarkedBlobUrl(null);
  };

  const handleWatermark = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    if (!watermark.trim()) {
      setError("Please enter a watermark text.");
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
          x: width / 2 - watermark.length * (fontSize / 10),
          y: height / 2,
          size: fontSize,
          rotate: degrees(rotation),
          color: rgb(0.7, 0.7, 0.7),
          opacity: opacity,
        });
      });

      const modifiedPdf = await pdfDoc.save();
      const blob = new Blob([modifiedPdf], { type: "application/pdf" });
      setWatermarkedBlob(blob);
      const url = URL.createObjectURL(blob);
      setWatermarkedBlobUrl(url);
    } catch (err: any) {
      setError("Failed to process the PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadWatermarkedPdf = () => {
    if (!watermarkedBlobUrl) return;

    const a = document.createElement("a");
    a.href = watermarkedBlobUrl;
    a.download = "watermarked.pdf";
    a.click();
  };

  const handleShare = () => {
    if (!watermarkedBlob) {
      alert("Please apply watermark first before sharing");
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
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <PiDropHalfBottom size={32} style={{ color: "#007bff" }} />
          Add Watermark to PDF
        </h1>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: "3px solid rgba(0, 123, 255, 0.4)",
            backgroundColor: "rgba(0, 123, 255, 0.1)",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center",
            marginBottom: "2rem",
            position: "relative",
            minHeight: "280px",
          }}
        >
          {!file ? (
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
                  onClick={handleWatermark}
                  disabled={isProcessing}
                  style={{
                    backgroundColor: isProcessing ? "#ccc" : "#007bff",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: "500",
                    opacity: isProcessing ? 0.7 : 1,
                  }}
                >
                  <PiDropHalfBottom size={18} />
                  {isProcessing ? "Processing..." : "Apply Watermark"}
                </button>
                {watermarkedBlobUrl && (
                  <>
                    <button
                      onClick={downloadWatermarkedPdf}
                      style={{
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                      }}
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={handleShare}
                      style={{
                        backgroundColor: "white",
                        color: "#333",
                        border: "1px solid #e0e0e0",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                      }}
                    >
                      <TbShare3 />
                      Share
                    </button>
                  </>
                )}
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
                    <PiX size={35} />
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

              {/* Watermark Settings */}
              <div style={{ 
                backgroundColor: "white", 
                padding: "1.5rem", 
                borderRadius: "8px",
                marginBottom: "1rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ 
                  fontSize: "1rem", 
                  fontWeight: "600", 
                  marginBottom: "1rem",
                  color: "#333"
                }}>
                  Watermark Settings
                </h3>

                {/* Watermark Text */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "0.5rem", 
                    fontSize: "0.9rem", 
                    fontWeight: "500",
                    color: "#333"
                  }}>
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value)}
                    placeholder="Enter watermark text..."
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Font Size */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "0.5rem", 
                    fontSize: "0.9rem", 
                    fontWeight: "500",
                    color: "#333"
                  }}>
                    Font Size: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    style={{
                      width: "100%",
                    }}
                  />
                </div>

                {/* Opacity */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "0.5rem", 
                    fontSize: "0.9rem", 
                    fontWeight: "500",
                    color: "#333"
                  }}>
                    Opacity: {Math.round(opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    style={{
                      width: "100%",
                    }}
                  />
                </div>

                {/* Rotation */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "0.5rem", 
                    fontSize: "0.9rem", 
                    fontWeight: "500",
                    color: "#333"
                  }}>
                    Rotation: {rotation}°
                  </label>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    style={{
                      width: "100%",
                    }}
                  />
                </div>

                {/* Preview */}
                <div style={{
                  marginTop: "1.5rem",
                  padding: "2rem",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "6px",
                  position: "relative",
                  minHeight: "150px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden"
                }}>
                  <div style={{ fontSize: "0.8rem", color: "#999", position: "absolute", top: "0.5rem", left: "0.5rem" }}>
                    Preview
                  </div>
                  <div
                    style={{
                      fontSize: `${fontSize}px`,
                      color: `rgba(179, 179, 179, ${opacity})`,
                      transform: `rotate(${rotation}deg)`,
                      fontWeight: "bold",
                      userSelect: "none"
                    }}
                  >
                    {watermark || "Your Watermark"}
                  </div>
                </div>
              </div>

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
            Add custom watermarks to protect your PDF documents and establish ownership.
          </p>
          <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
            {[
              "Customize text, size, opacity, and rotation",
              "Preview watermark before applying",
              "Watermark appears on all pages",
              "Works on any device — desktop, tablet, or mobile"
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
            Your files are processed in the browser and not stored. Instant and safe.
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
            <img src="/norton-logo.png" alt="Norton" style={{ height: "30px" }} />          </div>
        </div>
        </div>

        {/* Right Ad */}
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
                  backgroundColor: "#007bff",
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
        steps={instructionData.steps} 
      />
      <Testimonials 
        title="What Our Users Say"
        testimonials={testimonialData.testimonials}
        autoScrollInterval={3000} 
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        fileBlob={watermarkedBlob}
        fileName="watermarked.pdf"
      />
      <Footer />
    </div>
  );
}