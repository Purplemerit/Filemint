"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
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

export default function DeletePdfPagesPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectMode, setSelectMode] = useState<"individual" | "range">("individual");
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const instructionData = toolData["delete-pdf"];

  // Google Drive picker
  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setIsDropdownOpen(false);
    },
  });

  // Dropbox picker
  const { openPicker: openDropboxPicker } = useDropboxPicker({
    onFilePicked: (file) => {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setIsDropdownOpen(false);
    },
  });

  // Load PDF.js
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      // @ts-ignore
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Close dropdown when clicking outside
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
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
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
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setUrlInput("");
      setShowUrlModal(false);
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
          setPdfFile(file);
          const url = URL.createObjectURL(file);
          setPdfUrl(url);
          break;
        }
      }
    } catch (error) {
      alert("No PDF found in clipboard or clipboard access denied");
    }
    setIsDropdownOpen(false);
  };

  const removeFile = () => {
    setPdfFile(null);
    setPdfUrl("");
  };

  const loadPdf = async (url: string) => {
    try {
      setIsProcessing(true);
      // @ts-ignore
      const loadingTask = window.pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);

      const images: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.8 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        images.push(canvas.toDataURL());
      }
      setPageImages(images);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Error loading PDF. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleStartEditing = async () => {
    if (pdfFile && pdfUrl) {
      setIsEditingMode(true);
      await loadPdf(pdfUrl);
    }
  };

  const togglePageSelection = (pageNum: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum);
    } else {
      newSelected.add(pageNum);
    }
    setSelectedPages(newSelected);
  };

  const selectPageRange = () => {
    if (rangeStart && rangeEnd && rangeStart <= rangeEnd) {
      const newSelected = new Set(selectedPages);
      for (let i = rangeStart; i <= rangeEnd; i++) {
        newSelected.add(i);
      }
      setSelectedPages(newSelected);
      setRangeStart(null);
      setRangeEnd(null);
    }
  };

  const selectAllPages = () => {
    const allPages = new Set<number>();
    for (let i = 1; i <= totalPages; i++) {
      allPages.add(i);
    }
    setSelectedPages(allPages);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const deletePagesAndDownload = async () => {
    if (!pdfDoc || selectedPages.size === 0) {
      alert("Please select at least one page to delete.");
      return;
    }

    if (selectedPages.size >= totalPages) {
      alert("Cannot delete all pages. At least one page must remain.");
      return;
    }

    try {
      setIsProcessing(true);

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";

      await new Promise((resolve) => {
        script.onload = resolve;
        document.head.appendChild(script);
      });

      // @ts-ignore
      const { PDFDocument } = window.PDFLib;

      const arrayBuffer = await pdfFile!.arrayBuffer();
      const pdfDocLib = await PDFDocument.load(arrayBuffer);

      const newPdf = await PDFDocument.create();

      const pagesToKeep: number[] = [];
      for (let i = 1; i <= totalPages; i++) {
        if (!selectedPages.has(i)) {
          pagesToKeep.push(i - 1);
        }
      }

      const copiedPages = await newPdf.copyPages(pdfDocLib, pagesToKeep);
      copiedPages.forEach((page: any) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `modified_${pdfFile!.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(
        `PDF modified successfully! Deleted ${selectedPages.size} pages, kept ${totalPages - selectedPages.size} pages.`
      );
      setIsProcessing(false);
    } catch (error) {
      console.error("Error modifying PDF:", error);
      alert("Error modifying PDF. Please try again.");
      setIsProcessing(false);
    }
  };

  const goBack = () => {
    setIsEditingMode(false);
    setSelectedPages(new Set());
    setPageImages([]);
    setPdfDoc(null);
    setRangeStart(null);
    setRangeEnd(null);
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
    { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: openDropboxPicker },
    { icon: <PiClipboard size={18} />, label: "From Clipboard", onClick: handleFromClipboard },
  ];

  // Editing Mode UI (unchanged)
  if (isEditingMode) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
        <style>{`
          @media (max-width: 768px) {
            .header-controls-delete {
              flex-direction: column !important;
              gap: 1rem !important;
            }
            .header-controls-delete > * {
              width: 100% !important;
            }
            .main-container-delete {
              flex-direction: column !important;
            }
            .control-panel-delete {
              width: 100% !important;
              position: static !important;
              margin-bottom: 1.5rem;
            }
            .page-grid-delete {
              grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
            }
          }
          @media (max-width: 480px) {
            .page-grid-delete {
              grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
              gap: 0.75rem !important;
            }
            .control-panel-delete {
              padding: 1rem !important;
            }
          }
        `}</style>
        
        <div
          className="header-controls-delete"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={goBack}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
              minWidth: "100px",
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", margin: 0 }}>Delete PDF Pages</h1>
          <button
            onClick={deletePagesAndDownload}
            disabled={selectedPages.size === 0 || isProcessing}
            style={{
              backgroundColor: selectedPages.size > 0 && !isProcessing ? "#dc3545" : "#6c757d",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "5px",
              cursor: selectedPages.size > 0 && !isProcessing ? "pointer" : "not-allowed",
              fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
              minWidth: "100px",
            }}
          >
            {isProcessing ? "Processing..." : `Delete ${selectedPages.size} Pages`}
          </button>
        </div>

        <div className="main-container-delete" style={{ display: "flex", gap: "2rem" }}>
          {/* Control Panel */}
          <div
            className="control-panel-delete"
            style={{
              width: "300px",
              backgroundColor: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "10px",
              height: "fit-content",
              position: "sticky",
              top: "2rem",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "clamp(1rem, 3vw, 1.17rem)" }}>
              Page Selection
            </h3>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Selection Mode</h4>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <button
                  onClick={() => setSelectMode("individual")}
                  style={{
                    backgroundColor: selectMode === "individual" ? "#007bff" : "white",
                    color: selectMode === "individual" ? "white" : "#007bff",
                    border: "1px solid #007bff",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                    flex: 1,
                  }}
                >
                  Individual
                </button>
                <button
                  onClick={() => setSelectMode("range")}
                  style={{
                    backgroundColor: selectMode === "range" ? "#007bff" : "white",
                    color: selectMode === "range" ? "white" : "#007bff",
                    border: "1px solid #007bff",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                    flex: 1,
                  }}
                >
                  Range
                </button>
              </div>
            </div>

            {selectMode === "range" && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Select Page Range</h4>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                  <input
                    type="number"
                    placeholder="From"
                    min="1"
                    max={totalPages}
                    value={rangeStart || ""}
                    onChange={(e) => setRangeStart(parseInt(e.target.value) || null)}
                    style={{
                      width: "60px",
                      padding: "0.3rem",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                    }}
                  />
                  <span style={{ fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}>to</span>
                  <input
                    type="number"
                    placeholder="To"
                    min="1"
                    max={totalPages}
                    value={rangeEnd || ""}
                    onChange={(e) => setRangeEnd(parseInt(e.target.value) || null)}
                    style={{
                      width: "60px",
                      padding: "0.3rem",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                    }}
                  />
                </div>
                <button
                  onClick={selectPageRange}
                  disabled={!rangeStart || !rangeEnd || rangeStart > rangeEnd}
                  style={{
                    backgroundColor: rangeStart && rangeEnd && rangeStart <= rangeEnd ? "#28a745" : "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "3px",
                    cursor: rangeStart && rangeEnd && rangeStart <= rangeEnd ? "pointer" : "not-allowed",
                    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                    width: "100%",
                  }}
                >
                  Select Range
                </button>
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Quick Actions</h4>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <button
                  onClick={selectAllPages}
                  style={{
                    backgroundColor: "#ffc107",
                    color: "#212529",
                    border: "none",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                    flex: 1,
                  }}
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                    flex: 1,
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: "#e3f2fd", padding: "1rem", borderRadius: "5px", marginBottom: "1rem" }}>
              <div style={{ fontSize: "clamp(0.8rem, 2vw, 0.9rem)", marginBottom: "0.5rem" }}>
                <strong>Total Pages:</strong> {totalPages}
              </div>
              <div style={{ fontSize: "clamp(0.8rem, 2vw, 0.9rem)", marginBottom: "0.5rem" }}>
                <strong>Selected for Deletion:</strong> {selectedPages.size}
              </div>
              <div style={{ fontSize: "clamp(0.8rem, 2vw, 0.9rem)", color: "#28a745" }}>
                <strong>Remaining Pages:</strong> {totalPages - selectedPages.size}
              </div>
            </div>

            <div style={{ backgroundColor: "#fff3cd", padding: "1rem", borderRadius: "5px", fontSize: "clamp(0.8rem, 2vw, 0.9rem)", border: "1px solid #ffeaa7" }}>
              <strong>How to use:</strong>
              <br />
              1. Click pages to select/deselect
              <br />
              2. Or use range selection
              <br />
              3. Selected pages will be deleted
              <br />
              4. Click "Delete Pages" when ready
            </div>
          </div>

          {/* PDF Pages Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isProcessing ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", fontSize: "clamp(1rem, 3vw, 1.2rem)", color: "#666" }}>
                Loading PDF pages...
              </div>
            ) : (
              <div
                className="page-grid-delete"
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", padding: "1rem" }}
              >
                {pageImages.map((imageUrl, index) => {
                  const pageNum = index + 1;
                  const isSelected = selectedPages.has(pageNum);
                  return (
                    <div
                      key={pageNum}
                      onClick={() => selectMode === "individual" && togglePageSelection(pageNum)}
                      style={{
                        border: isSelected ? "3px solid #dc3545" : "2px solid #dee2e6",
                        borderRadius: "8px",
                        padding: "0.5rem",
                        backgroundColor: isSelected ? "#f8d7da" : "white",
                        cursor: selectMode === "individual" ? "pointer" : "default",
                        position: "relative",
                        boxShadow: isSelected ? "0 4px 12px rgba(220, 53, 69, 0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Page ${pageNum}`}
                        style={{ width: "100%", height: "auto", display: "block", borderRadius: "4px", opacity: isSelected ? 0.7 : 1 }}
                      />
                      <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "clamp(0.8rem, 2vw, 0.9rem)", fontWeight: "bold", color: isSelected ? "#dc3545" : "#495057" }}>
                        Page {pageNum}
                      </div>
                      {isSelected && (
                        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", backgroundColor: "#dc3545", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(0.7rem, 2vw, 0.8rem)", fontWeight: "bold" }}>
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Upload UI
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
          Delete PDF Pages
        </h1>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
             border: "3px solid rgba(57, 185, 57, 0.4)",
            backgroundColor: "rgba(144, 238, 144, 0.2)",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center",
            marginBottom: "2rem",
            position: "relative",
            minHeight: "280px",
          }}
        >
          {!pdfFile ? (
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
                  accept="application/pdf"
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
                  onClick={handleStartEditing}
                  style={{
                    backgroundColor: "rgba(57, 185, 57, 1)",
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
                  Start Editing Pages
                </button>
              </div>

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
                    {pdfFile.name}
                  </span>
                </div>
              </div>

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

          {!pdfFile && (
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
            Remove unwanted pages from your PDF documents with precision and ease.
          </p>
          <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
            {[
              "Select individual pages or ranges to delete",
              "Preview all pages before making changes",
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