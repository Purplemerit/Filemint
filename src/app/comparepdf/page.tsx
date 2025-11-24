"use client";

import Navbar from "../components/Navbar";
import { PDFDocument } from "pdf-lib";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
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
import { useGoogleDrivePicker } from "../hooks/useGoogleDrivePicker";
import { useDropboxPicker } from "../hooks/useDropboxPicker";
import ToolInstructions from "../components/ToolInstructions";
import toolData from "../data/toolInstructions.json";
import Testimonials from "../components/Testimonials";
import testimonialData from "../data/testimonials.json";
import Footer from "../components/footer";

export default function ComparePdfPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [pdf1, setPdf1] = useState<File | null>(null);
  const [pdf2, setPdf2] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  
  const [isDropdown1Open, setIsDropdown1Open] = useState(false);
  const [isDropdown2Open, setIsDropdown2Open] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [activeUpload, setActiveUpload] = useState<1 | 2>(1);
  
  const dropdown1Ref = useRef<HTMLDivElement>(null);
  const dropdown2Ref = useRef<HTMLDivElement>(null);
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  
  const instructionData = toolData["compare-pdf"];

  // Google Drive picker for PDF 1
  const { openPicker: openGoogleDrivePicker1 } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      setPdf1(file);
      setIsDropdown1Open(false);
    },
  });

  // Google Drive picker for PDF 2
  const { openPicker: openGoogleDrivePicker2 } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      setPdf2(file);
      setIsDropdown2Open(false);
    },
  });

  // Dropbox picker for PDF 1
  const { openPicker: openDropboxPicker1 } = useDropboxPicker({
    onFilePicked: (file) => {
      setPdf1(file);
      setIsDropdown1Open(false);
    },
  });

  // Dropbox picker for PDF 2
  const { openPicker: openDropboxPicker2 } = useDropboxPicker({
    onFilePicked: (file) => {
      setPdf2(file);
      setIsDropdown2Open(false);
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdown1Ref.current && !dropdown1Ref.current.contains(event.target as Node)) {
        setIsDropdown1Open(false);
      }
      if (dropdown2Ref.current && !dropdown2Ref.current.contains(event.target as Node)) {
        setIsDropdown2Open(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, pdfNum: 1 | 2) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type === "application/pdf"
    );
    if (droppedFiles.length > 0) {
      if (pdfNum === 1) {
        setPdf1(droppedFiles[0]);
      } else {
        setPdf2(droppedFiles[0]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, pdfNum: 1 | 2) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        if (pdfNum === 1) {
          setPdf1(file);
          setIsDropdown1Open(false);
        } else {
          setPdf2(file);
          setIsDropdown2Open(false);
        }
      }
    }
  };

  const handleFromDevice = (pdfNum: 1 | 2) => {
    if (pdfNum === 1) {
      fileInput1Ref.current?.click();
    } else {
      fileInput2Ref.current?.click();
    }
  };

  const handlePasteUrl = (pdfNum: 1 | 2) => {
    setActiveUpload(pdfNum);
    setShowUrlModal(true);
    setIsDropdown1Open(false);
    setIsDropdown2Open(false);
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
      
      if (activeUpload === 1) {
        setPdf1(file);
      } else {
        setPdf2(file);
      }
      
      setUrlInput("");
      setShowUrlModal(false);
    } catch (error) {
      alert("Failed to fetch PDF from URL");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFromClipboard = async (pdfNum: 1 | 2) => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        if (item.types.includes("application/pdf")) {
          const blob = await item.getType("application/pdf");
          const file = new File([blob], "clipboard.pdf", { type: "application/pdf" });
          if (pdfNum === 1) {
            setPdf1(file);
          } else {
            setPdf2(file);
          }
          break;
        }
      }
    } catch (error) {
      alert("No PDF found in clipboard or clipboard access denied");
    }
    setIsDropdown1Open(false);
    setIsDropdown2Open(false);
  };

  const removeFile = (pdfNum: 1 | 2) => {
    if (pdfNum === 1) {
      setPdf1(null);
    } else {
      setPdf2(null);
    }
    setResult(null);
  };

  const comparePDFs = async () => {
    if (!pdf1 || !pdf2) {
      setResult("Please upload both PDFs.");
      return;
    }

    setIsComparing(true);
    setResult(null);

    try {
      const [array1, array2] = await Promise.all([
        pdf1.arrayBuffer(),
        pdf2.arrayBuffer(),
      ]);

      const [doc1, doc2] = await Promise.all([
        PDFDocument.load(array1),
        PDFDocument.load(array2),
      ]);

      const pageCount1 = doc1.getPageCount();
      const pageCount2 = doc2.getPageCount();

      if (array1.byteLength === array2.byteLength && pageCount1 === pageCount2) {
        setResult("The PDFs appear to be identical in size and page count.");
      } else {
        setResult(
          `PDFs differ:\n- PDF 1: ${pageCount1} pages (${(array1.byteLength / 1024).toFixed(1)} KB)\n- PDF 2: ${pageCount2} pages (${(array2.byteLength / 1024).toFixed(1)} KB)`
        );
      }
    } catch (error) {
      setResult("An error occurred while comparing the PDFs.");
    } finally {
      setIsComparing(false);
    }
  };

  const getMenuItems = (pdfNum: 1 | 2) => [
    { 
      icon: <PiUploadSimple size={18} />, 
      label: "From Device", 
      onClick: () => handleFromDevice(pdfNum) 
    },
    { 
      icon: <PiLink size={18} />, 
      label: "Paste URL", 
      onClick: () => handlePasteUrl(pdfNum) 
    },
    { 
      icon: <FaGoogleDrive size={16} />, 
      label: "Google Drive", 
      onClick: () => pdfNum === 1 ? openGoogleDrivePicker1() : openGoogleDrivePicker2() 
    },
    { 
      icon: <FaDropbox size={16} />, 
      label: "Drop Box", 
      onClick: () => pdfNum === 1 ? openDropboxPicker1() : openDropboxPicker2() 
    },
    { 
      icon: <PiClipboard size={18} />, 
      label: "From Clipboard", 
      onClick: () => handleFromClipboard(pdfNum) 
    },
  ];

  const renderUploadZone = (
    pdfNum: 1 | 2,
    file: File | null,
    isDropdownOpen: boolean,
    setIsDropdownOpen: (open: boolean) => void,
    dropdownRef: React.RefObject<HTMLDivElement>,
    fileInputRef: React.RefObject<HTMLInputElement>
  ) => (
    <div
      onDrop={(e) => handleDrop(e, pdfNum)}
      onDragOver={(e) => e.preventDefault()}
      style={{
        border: "3px solid rgba(27, 149, 248, 0.3)",
        backgroundColor: "rgb(230, 240, 255)",
        borderRadius: "12px",
        padding: "1.5rem",
        textAlign: "center",
        position: "relative",
        minHeight: "200px",
        flex: 1,
      }}
    >
      <h3 style={{ 
        fontSize: "1rem", 
        fontWeight: "600", 
        marginBottom: "1rem",
        color: "#1a1a1a"
      }}>
        PDF {pdfNum}
      </h3>

      {!file ? (
        /* Empty State */
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "140px",
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <img src="./upload.svg" alt="Upload Icon" style={{ width: "40px", height: "40px" }} />
          </div>

          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                backgroundColor: "white",
                padding: "0.5rem 0.8rem",
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8rem",
                fontWeight: "500",
                color: "#333",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <PiFiles size={16} />
              Select File
              <PiCaretDown size={12} />
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
                  minWidth: "160px",
                  overflow: "hidden",
                }}
              >
                {getMenuItems(pdfNum).map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.6rem 0.8rem",
                      width: "100%",
                      border: "none",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      fontSize: "0.8rem",
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
              accept="application/pdf"
              onChange={(e) => handleFileChange(e, pdfNum)}
              style={{ display: "none" }}
            />
          </div>
        </div>
      ) : (
        /* File Uploaded State */
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "140px",
        }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              width: "100px",
              height: "120px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              position: "relative",
            }}
          >
            <button
              onClick={() => removeFile(pdfNum)}
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                background: "rgba(255, 255, 255, 1)",
                border: "none",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "black",
              }}
            >
              <PiX size={28} />
            </button>
            
            <img src="./pdf.svg" alt="PDF Icon" style={{ width: "35px", height: "45px", marginBottom: "0.4rem" }} />
            <span style={{ 
              fontSize: "0.6rem", 
              color: "#666", 
              maxWidth: "85px", 
              overflow: "hidden", 
              textOverflow: "ellipsis", 
              whiteSpace: "nowrap",
              padding: "0 0.3rem"
            }}>
              {file.name}
            </span>
          </div>
        </div>
      )}

      {/* Quick action icons */}
      <div
        style={{
          position: "absolute",
          right: "0.5rem",
          bottom: "0.5rem",
          display: "flex",
          gap: "0.4rem",
          opacity: 0.3,
        }}
      >
        <PiUploadSimple size={14} />
        <PiLink size={14} />
        <FaGoogleDrive size={12} />
        <FaDropbox size={12} />
        <PiClipboard size={14} />
      </div>
    </div>
  );

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
          Compare PDF Files
        </h1>

        {/* Two Upload Zones Side by Side */}
        <div style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}>
          {renderUploadZone(
            1,
            pdf1,
            isDropdown1Open,
            setIsDropdown1Open,
            dropdown1Ref as React.RefObject<HTMLDivElement>,
            fileInput1Ref as React.RefObject<HTMLInputElement>
          )}
          {renderUploadZone(
            2,
            pdf2,
            isDropdown2Open,
            setIsDropdown2Open,
            dropdown2Ref as React.RefObject<HTMLDivElement>,
            fileInput2Ref as React.RefObject<HTMLInputElement>
          )}
        </div>

        {/* Compare Button */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <button
            onClick={comparePDFs}
            disabled={!pdf1 || !pdf2 || isComparing}
            style={{
              backgroundColor: pdf1 && pdf2 ? "#007bff" : "#ccc",
              color: "white",
              padding: "0.7rem 1.5rem",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: "500",
              cursor: pdf1 && pdf2 && !isComparing ? "pointer" : "not-allowed",
              opacity: isComparing ? 0.7 : 1,
            }}
          >
            {isComparing ? "Comparing..." : "Compare PDFs"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: result.includes("identical") ? "#e9f7ef" : "#fff3cd",
              border: `1px solid ${result.includes("identical") ? "#c3e6cb" : "#ffc107"}`,
              borderRadius: "10px",
              whiteSpace: "pre-wrap",
              fontSize: "0.95rem",
              marginBottom: "2rem",
            }}
          >
            <strong>Result:</strong>
            <p style={{ marginTop: "0.5rem", marginBottom: 0 }}>{result}</p>
          </div>
        )}

        {/* Info Section */}
        <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
          <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>
            Quickly compare two PDF files to check for differences in size and page count.
          </p>
          <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
            {[
              "Compare files in seconds with drag-and-drop simplicity",
              "Works on any device — desktop, tablet, or mobile",
              "Trusted by users worldwide for secure and fast comparison"
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
      <Footer />
    </div>
  );
}