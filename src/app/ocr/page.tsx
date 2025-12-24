"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Tesseract from "tesseract.js";
import Image from "next/image";
import { jsPDF } from "jspdf";
import Navbar from "../components/Navbar";
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
export default function ImageTextExtractor() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const instructionData = toolData["extract-text-from-image"];

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      if (file.type.startsWith("image/")) {
        setImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError(null);
        setExtractedText("");
      }
      setIsDropdownOpen(false);
    },
  });

  const { openPicker: openDropboxPicker } = useDropboxPicker({
    onFilePicked: (file) => {
      if (file.type.startsWith("image/")) {
        setImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError(null);
        setExtractedText("");
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
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setImage(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      setError(null);
      setExtractedText("");
    } else {
      setError("Only image files are supported.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type.startsWith("image/")) {
      setImage(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setError(null);
      setExtractedText("");
    } else {
      setError("Only image files are supported.");
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
      
      if (!blob.type.startsWith("image/")) {
        alert("URL must point to an image file");
        return;
      }
      
      const fileName = urlInput.split("/").pop() || "downloaded.jpg";
      const file = new File([blob], fileName, { type: blob.type });
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setExtractedText("");
      setUrlInput("");
      setShowUrlModal(false);
    } catch (error) {
      alert("Failed to fetch image from URL");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const file = new File([blob], "clipboard.png", { type });
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
            setExtractedText("");
            break;
          }
        }
      }
    } catch (error) {
      alert("No image found in clipboard or clipboard access denied");
    }
    setIsDropdownOpen(false);
  };

  const removeFile = () => {
    setImage(null);
    setPreviewUrl(null);
    setExtractedText("");
    setPdfBlob(null);
    setError(null);
  };

  const extractText = async () => {
    if (!image) {
      setError("Please upload an image first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await Tesseract.recognize(image, "eng", {
        logger: (m) => console.log(m),
      });
      setExtractedText(result.data.text);
    } catch (err) {
      console.error(err);
      setError("Error processing image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = () => {
    if (!extractedText) {
      setError("No text to generate PDF from.");
      return;
    }

    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(extractedText, 180);
    doc.text("Extracted Text from Image", 15, 15);
    doc.text(lines, 15, 25);

    doc.setFontSize(10);
    doc.text("Generated by ImageTextExtractor", 15, doc.internal.pageSize.height - 10);
    
    const pdfBlob = doc.output("blob");
    setPdfBlob(pdfBlob);
    doc.save("extracted-text.pdf");
  };

  const handleShare = () => {
    if (!pdfBlob) {
      alert("Please generate the PDF first before sharing");
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
        }}>
          Extract Text from Image
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
          {!image ? (
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
                  Select Image
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
                  accept="image/*"
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
                  onClick={extractText}
                  disabled={isProcessing}
                  style={{
                    backgroundColor: isProcessing ? "#ccc" : "#9c27b0",
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
                  {isProcessing ? "Processing..." : "Extract Text"}
                </button>
                <button
                  onClick={generatePDF}
                  disabled={!extractedText}
                  style={{
                    backgroundColor: extractedText ? "#28a745" : "#ccc",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: extractedText ? "pointer" : "not-allowed",
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
              </div>

              {/* Preview Section */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {previewUrl && (
                  <div style={{ 
                    position: "relative", 
                    marginBottom: "1rem",
                    maxWidth: "400px",
                    width: "100%"
                  }}>
                    <button
                      onClick={removeFile}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(255, 255, 255, 0.9)",
                        border: "none",
                        borderRadius: "50%",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "black",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        zIndex: 10,
                      }}
                    >
                      <PiX size={20} />
                    </button>
                    <Image
                      src={previewUrl}
                      alt="Image preview"
                      width={400}
                      height={300}
                      style={{ 
                        objectFit: "contain", 
                        borderRadius: "8px",
                        width: "100%",
                        height: "auto",
                        maxHeight: "300px"
                      }}
                    />
                  </div>
                )}
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

          {!image && (
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

        {/* Extracted Text Display */}
        {extractedText && (
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "10px",
              marginBottom: "2rem",
              border: "1px solid #e0e0e0",
            }}
          >
            <h2 style={{ 
              fontSize: "1.2rem", 
              marginBottom: "1rem",
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: "600"
            }}>
              Extracted Text:
            </h2>
            <pre style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              fontFamily: "monospace",
              fontSize: "0.9rem",
              lineHeight: "1.6",
              margin: 0,
            }}>
              {extractedText}
            </pre>
          </div>
        )}

        {/* Info Section */}
        <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
          <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>
            Extract text from images using advanced OCR technology. Perfect for digitizing documents, receipts, and handwritten notes.
          </p>
          <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
            {[
              "Supports all major image formats (JPG, PNG, WEBP)",
              "Extract text in seconds with high accuracy",
              "Download extracted text as PDF"
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
            <h3 style={{ marginBottom: "1rem" }}>Paste Image URL</h3>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
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
                {isUploading ? "Loading..." : "Add Image"}
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
        fileBlob={pdfBlob}
        fileName="extracted-text.pdf"
      />
      <Footer />
    </div>
  );
}