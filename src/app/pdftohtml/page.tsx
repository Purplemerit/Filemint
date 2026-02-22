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
import { useAutoDownload } from "../hooks/useAutoDownload";
import ToolInstructions from "../components/ToolInstructions";
import toolData from "../data/toolInstructions.json";
import Testimonials from "../components/Testimonials";
import testimonialData from "../data/testimonials.json";
import Footer from "../components/footer";
import VerticalAdLeft from "../components/Verticaladleft";
import VerticalAdRight from "../components/Verticaladright";
import FilePreview from "../components/FilePreview";
import RecommendedTools from "../components/RecommendedTools";

export default function PdfToHtmlPage() {
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
  const [htmlBlob, setHtmlBlob] = useState<Blob | null>(null);
  const instructionData = toolData["pdf-to-html"];

  const [isConverting, setIsConverting] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlResult, setHtmlResult] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setIsConverting(true);
    setError(null);
    setHtmlResult(null);

    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await fetch("/api/pdftohtml", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Conversion failed.");

      const html = await res.text();
      setHtmlResult(html);

      const blob = new Blob([html], { type: "text/html" });
      setHtmlBlob(blob);
      setIsConverted(true);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!htmlResult) return;
    const blob = new Blob([htmlResult], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.html";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setHtmlBlob(null);
    setHtmlResult(null);
    setIsConverted(false);
    setError(null);
  };

  // Smart auto-download: fires after 10s only if user hasn't clicked manually
  const triggerDownload = useAutoDownload(isConverted && !!htmlResult, handleDownload, 10000);

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      setFile(file);
      setIsDropdownOpen(false);
    },
  });

  const { openPicker: openDropboxPicker } = useDropboxPicker({
    onFilePicked: (file) => {
      setFile(file);
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
    setHtmlBlob(null);
    setHtmlResult(null);
    setIsConverted(false);
    setError(null);
  };

  const handleShare = () => {
    if (!htmlBlob) {
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

      <style>{`
        .main-container {
          display: flex;
          max-width: 1400px;
          margin: 4rem auto;
          padding: 0 1rem;
          gap: 2rem;
          align-items: flex-start;
        }
        .ad-column {
          width: 160px;
          flex-shrink: 0;
        }
        .content-area {
          flex: 1;
          min-width: 0;
        }
        .drop-zone-container {
          border: 3px solid rgba(216, 121, 253, 0.4);
          background-color: #F3E6FF;
          border-radius: 12px;
          padding: 2.5rem 1rem;
          text-align: center;
          position: relative;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .tool-title {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 3rem;
          color: #1a1a1a;
          font-family: Georgia, serif;
          text-align: left;
        }
        @media (max-width: 1024px) {
          .main-container {
            flex-direction: column !important;
            padding: 0 1rem !important;
            margin: 2rem auto !important;
          }
          .ad-column {
            display: none !important;
          }
          .content-area {
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="main-container">
        <div className="ad-column">
          <VerticalAdLeft />
        </div>

        <div className="content-area">
          <h1 className="tool-title">PDF to HTML</h1>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="drop-zone-container"
          >
            {!file ? (
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
                      backgroundColor: "#D879FD",
                      padding: "0.6rem 1rem",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "white",
                      boxShadow: "0 2px 4px rgba(216, 121, 253, 0.3)",
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
                      backgroundColor: "#D879FD",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1.5rem",
                      borderRadius: "6px",
                      cursor: isConverting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      opacity: isConverting ? 0.7 : 1,
                      boxShadow: "0 4px 6px rgba(216, 121, 253, 0.25)"
                    }}
                  >
                    {isConverting ? "Converting..." : "Convert to HTML"}
                  </button>
                  {htmlResult && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={triggerDownload}
                        style={{
                          backgroundColor: "#2e7d32",
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
                        Download HTML
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
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div
                    style={{
                      backgroundColor: "white",
                      borderRadius: "16px",
                      width: "140px",
                      height: "180px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      position: "relative",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <button
                      onClick={removeFile}
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        background: "#ef4444",
                        border: "2px solid white",
                        borderRadius: "50%",
                        width: "26px",
                        height: "26px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "white",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      <PiX size={14} />
                    </button>

                    <div style={{ width: "100px", height: "130px", marginBottom: "0.5rem" }}>
                      <FilePreview file={file} style={{ width: "100%", height: "100%", borderRadius: '8px' }} />
                    </div>
                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      color: "#374151",
                      maxWidth: "110px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {file.name}
                    </span>
                  </div>
                </div>

                {error && (
                  <p style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "1rem", textAlign: "center" }}>{error}</p>
                )}
              </div>
            )}

            {file === null && (
              <div style={{ position: "absolute", right: "1rem", top: "90%", transform: "translateY(-50%)", display: "flex", gap: "0.5rem", opacity: 0.4 }}>
                <PiUploadSimple size={20} /> <PiLink size={20} /> <FaGoogleDrive size={18} /> <FaDropbox size={18} /> <PiClipboard size={20} />
              </div>
            )}
          </div>

          {htmlResult && (
            <div style={{ backgroundColor: "#f8f9fa", padding: "1.5rem", borderRadius: "10px", marginBottom: "2rem", border: "1px solid #e0e0e0" }}>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", fontFamily: 'Georgia, serif', fontWeight: "600" }}>Converted HTML Preview:</h2>
              <div style={{ backgroundColor: "white", padding: "1rem", borderRadius: "5px", fontFamily: "monospace", fontSize: "0.85rem", maxHeight: "400px", overflowY: "auto", border: "1px solid #ddd" }}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{htmlResult}</pre>
              </div>
            </div>
          )}

          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>Convert your PDF files to HTML format for web publishing and editing with our seamless online tool.</p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {["Extract content and structure from PDFs", "Works on any device — desktop, tablet, or mobile", "Trusted by users worldwide for secure and fast conversion"].map((text, index) => (
                <li key={index} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <PiCheckCircle size={18} style={{ color: "green", flexShrink: 0 }} /> {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ad-column">
          <VerticalAdRight />
        </div>
      </div>

      {showUrlModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowUrlModal(false)}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem", fontFamily: "Georgia, serif" }}>Paste PDF URL</h3>
            <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com/document.pdf" style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "6px", marginBottom: "1rem" }} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowUrlModal(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", background: "white", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleUrlSubmit} disabled={isUploading} style={{ padding: "0.5rem 1rem", border: "none", background: "#D879FD", color: "white", borderRadius: "6px", cursor: isUploading ? "not-allowed" : "pointer", opacity: isUploading ? 0.7 : 1 }}>{isUploading ? "Loading..." : "Add PDF"}</button>
            </div>
          </div>
        </div>
      )}

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={htmlBlob} fileName="converted.html" />
      <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
      <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 2rem 4rem' }}>
        <RecommendedTools />
      </div>
      <Footer />
    </div>
  );
}