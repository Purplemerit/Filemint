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
  PiX,
  PiScissors
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

export default function SplitPdfPage() {
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
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [splitBlobs, setSplitBlobs] = useState<Blob[]>([]);
  const instructionData = toolData["split-pdf"] ;

  const [error, setError] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<"extract" | "ranges" | "fixed">("extract");
  const [fixedPageCount, setFixedPageCount] = useState<number>(1);

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

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      if (file.type === "application/pdf") {
        setPdfFile(file);
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
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
        setPdfFile(file);
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
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
    if (droppedFile && droppedFile.type === "application/pdf") {
      setPdfFile(droppedFile);
      const url = URL.createObjectURL(droppedFile);
      setPdfUrl(url);
      setError(null);
    } else {
      setError("Only PDF files are supported.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setPdfFile(selected);
      const url = URL.createObjectURL(selected);
      setPdfUrl(url);
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
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
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
          setPdfFile(file);
          const url = URL.createObjectURL(file);
          setPdfUrl(url);
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
    setPdfFile(null);
    setPdfUrl("");
    setError(null);
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
      setError("Error loading PDF. Please try again.");
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

  const splitPdf = async () => {
    if (!pdfDoc) {
      alert("Please load a PDF file first.");
      return;
    }

    if (splitMode === "extract" && selectedPages.size === 0) {
      alert("Please select at least one page to extract.");
      return;
    }

    if (splitMode === "fixed" && fixedPageCount < 1) {
      alert("Please enter a valid number of pages per split.");
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
      const originalPdf = await PDFDocument.load(arrayBuffer);

      const blobs: Blob[] = [];

      if (splitMode === "extract") {
        // Extract selected pages into one PDF
        const newPdf = await PDFDocument.create();
        const selectedPagesArray = Array.from(selectedPages).sort((a, b) => a - b);
        const pagesToCopy = selectedPagesArray.map((pageNum) => pageNum - 1);

        const copiedPages = await newPdf.copyPages(originalPdf, pagesToCopy);
        copiedPages.forEach((page: any) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        blobs.push(blob);

        // Download immediately
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `extracted_pages_${pdfFile!.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`Extracted ${selectedPages.size} pages successfully!`);
      } else if (splitMode === "ranges") {
        // Split based on selected page ranges (each selection becomes a separate PDF)
        const selectedPagesArray = Array.from(selectedPages).sort((a, b) => a - b);
        
        if (selectedPagesArray.length === 0) {
          alert("Please select pages to define split ranges.");
          setIsProcessing(false);
          return;
        }

        // Create ranges based on consecutive pages
        const ranges: number[][] = [];
        let currentRange: number[] = [selectedPagesArray[0]];

        for (let i = 1; i < selectedPagesArray.length; i++) {
          if (selectedPagesArray[i] === selectedPagesArray[i - 1] + 1) {
            currentRange.push(selectedPagesArray[i]);
          } else {
            ranges.push(currentRange);
            currentRange = [selectedPagesArray[i]];
          }
        }
        ranges.push(currentRange);

        // Create a PDF for each range
        for (let i = 0; i < ranges.length; i++) {
          const newPdf = await PDFDocument.create();
          const pagesToCopy = ranges[i].map((pageNum) => pageNum - 1);
          const copiedPages = await newPdf.copyPages(originalPdf, pagesToCopy);
          copiedPages.forEach((page: any) => newPdf.addPage(page));

          const pdfBytes = await newPdf.save();
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          blobs.push(blob);

          // Download each split
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `split_${i + 1}_pages_${ranges[i][0]}-${ranges[i][ranges[i].length - 1]}_${pdfFile!.name}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        alert(`Created ${ranges.length} split PDFs successfully!`);
      } else if (splitMode === "fixed") {
        // Split into fixed page counts
        const pageCount = fixedPageCount;
        const numSplits = Math.ceil(totalPages / pageCount);

        for (let i = 0; i < numSplits; i++) {
          const newPdf = await PDFDocument.create();
          const startPage = i * pageCount;
          const endPage = Math.min((i + 1) * pageCount, totalPages);
          const pagesToCopy = Array.from({ length: endPage - startPage }, (_, idx) => startPage + idx);

          const copiedPages = await newPdf.copyPages(originalPdf, pagesToCopy);
          copiedPages.forEach((page: any) => newPdf.addPage(page));

          const pdfBytes = await newPdf.save();
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          blobs.push(blob);

          // Download each split
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `split_${i + 1}_${pdfFile!.name}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        alert(`Created ${numSplits} split PDFs successfully!`);
      }

      setSplitBlobs(blobs);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error splitting PDF:", error);
      setError("Error splitting PDF. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleShare = () => {
    if (splitBlobs.length === 0) {
      alert("Please split the PDF first before sharing");
      return;
    }
    setShowShareModal(true);
  };

  const goBack = () => {
    setIsEditingMode(false);
    setSelectedPages(new Set());
    setPageImages([]);
    setPdfDoc(null);
    setRangeStart(null);
    setRangeEnd(null);
    setSplitBlobs([]);
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
    { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: openDropboxPicker },
    { icon: <PiClipboard size={18} />, label: "From Clipboard", onClick: handleFromClipboard },
  ];

  if (isEditingMode) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
        <style>{`
          @media (max-width: 768px) {
            .header-controls {
              flex-direction: column !important;
              gap: 1rem !important;
            }
            .header-controls > * {
              width: 100% !important;
            }
            .main-container {
              flex-direction: column !important;
            }
            .control-panel {
              width: 100% !important;
              position: static !important;
              margin-bottom: 1.5rem;
            }
            .page-grid {
              grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
            }
          }
          @media (max-width: 480px) {
            .page-grid {
              grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
              gap: 0.75rem !important;
            }
            .control-panel {
              padding: 1rem !important;
            }
          }
        `}</style>
        
        <div
          className="header-controls"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            marginTop: "2rem",
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
              fontSize: "1rem",
              minWidth: "120px",
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", margin: 0, fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Split PDF
          </h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={splitPdf}
              disabled={isProcessing || (splitMode === "extract" && selectedPages.size === 0)}
              style={{
                backgroundColor: isProcessing || (splitMode === "extract" && selectedPages.size === 0) ? "#6c757d" : "#007bff",
                color: "white",
                border: "none",
                padding: "0.6rem 1.2rem",
                borderRadius: "5px",
                cursor: isProcessing || (splitMode === "extract" && selectedPages.size === 0) ? "not-allowed" : "pointer",
                fontSize: "1rem",
                minWidth: "120px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <PiScissors size={18} />
              {isProcessing ? "Processing..." : "Split PDF"}
            </button>
            {splitBlobs.length > 0 && (
              <button
                onClick={handleShare}
                style={{
                  backgroundColor: "white",
                  color: "#333",
                  border: "1px solid #e0e0e0",
                  padding: "0.6rem 1.2rem",
                  borderRadius: "5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "1rem",
                }}
              >
                <TbShare3 />
                Share
              </button>
            )}
          </div>
        </div>

        <div className="main-container" style={{ display: "flex", gap: "2rem" }}>
          {/* Control Panel */}
          <div
            className="control-panel"
            style={{
              width: "320px",
              backgroundColor: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "10px",
              height: "fit-content",
              position: "sticky",
              top: "2rem",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "clamp(1rem, 3vw, 1.17rem)" }}>
              Split Options
            </h3>

            {/* Split Mode */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Split Mode</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  onClick={() => setSplitMode("extract")}
                  style={{
                    backgroundColor: splitMode === "extract" ? "#007bff" : "white",
                    color: splitMode === "extract" ? "white" : "#007bff",
                    border: "1px solid #007bff",
                    padding: "0.5rem 0.8rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    textAlign: "left",
                  }}
                >
                  Extract Selected Pages
                </button>
                <button
                  onClick={() => setSplitMode("ranges")}
                  style={{
                    backgroundColor: splitMode === "ranges" ? "#007bff" : "white",
                    color: splitMode === "ranges" ? "white" : "#007bff",
                    border: "1px solid #007bff",
                    padding: "0.5rem 0.8rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    textAlign: "left",
                  }}
                >
                  Split by Ranges
                </button>
                <button
                  onClick={() => setSplitMode("fixed")}
                  style={{
                    backgroundColor: splitMode === "fixed" ? "#007bff" : "white",
                    color: splitMode === "fixed" ? "white" : "#007bff",
                    border: "1px solid #007bff",
                    padding: "0.5rem 0.8rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    textAlign: "left",
                  }}
                >
                  Fixed Page Count
                </button>
              </div>
            </div>

            {/* Fixed Page Count Input */}
            {splitMode === "fixed" && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Pages per Split</h4>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={fixedPageCount}
                  onChange={(e) => setFixedPageCount(parseInt(e.target.value) || 1)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "3px",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.5rem" }}>
                  This will create {Math.ceil(totalPages / fixedPageCount)} PDF files
                </p>
              </div>
            )}

            {/* Page Selection (only for extract and ranges modes) */}
            {(splitMode === "extract" || splitMode === "ranges") && (
              <>
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
                        fontSize: "0.9rem",
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
                        fontSize: "0.9rem",
                        flex: 1,
                      }}
                    >
                      Range
                    </button>
                  </div>
                </div>

                {/* Range Selection */}
                {selectMode === "range" && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Select Page Range</h4>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
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
                          fontSize: "0.9rem",
                        }}
                      />
                      <span>to</span>
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
                          fontSize: "0.9rem",
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
                        fontSize: "0.9rem",
                        width: "100%",
                      }}
                    >
                      Select Range
                    </button>
                  </div>
                )}

                {/* Quick Actions */}
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
                        fontSize: "0.9rem",
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
                        fontSize: "0.9rem",
                        flex: 1,
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Selection Summary */}
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "1rem",
                borderRadius: "5px",
                marginBottom: "1rem",
              }}
            >
              <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                <strong>Total Pages:</strong> {totalPages}
              </div>
              {(splitMode === "extract" || splitMode === "ranges") && (
                <div style={{ fontSize: "0.9rem", color: "#007bff" }}>
                  <strong>Selected Pages:</strong> {selectedPages.size}
                </div>
              )}
              {splitMode === "fixed" && (
                <div style={{ fontSize: "0.9rem", color: "#007bff" }}>
                  <strong>Will create:</strong> {Math.ceil(totalPages / fixedPageCount)} PDFs
                </div>
              )}
            </div>

            {/* Instructions */}
            <div
              style={{
                backgroundColor: "#fff3cd",
                padding: "1rem",
                borderRadius: "5px",
                fontSize: "0.85rem",
                border: "1px solid #ffeaa7",
              }}
            >
              <strong>How to use:</strong>
              <br />
              {splitMode === "extract" && (
                <>
                  1. Select pages to extract
                  <br />
                  2. Click "Split PDF" to create new PDF
                  <br />
                  3. Downloads automatically
                </>
              )}
              {splitMode === "ranges" && (
                <>
                  1. Select page ranges
                  <br />
                  2. Each consecutive range becomes a PDF
                  <br />
                  3. Multiple files will download
                </>
              )}
              {splitMode === "fixed" && (
                <>
                  1. Set pages per split
                  <br />
                  2. Click "Split PDF"
                  <br />
                  3. Multiple files will download
                </>
              )}
            </div>
          </div>

          {/* PDF Pages Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isProcessing ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "400px",
                  fontSize: "clamp(1rem, 3vw, 1.2rem)",
                  color: "#666",
                }}
              >
                Loading PDF pages...
              </div>
            ) : (
              <div
                className="page-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "1rem",
                  padding: "1rem",
                }}
              >
                {pageImages.map((imageUrl, index) => {
                  const pageNum = index + 1;
                  const isSelected = selectedPages.has(pageNum);
                  const isClickable = splitMode !== "fixed" && selectMode === "individual";
                  
                  return (
                    <div
                      key={pageNum}
                      onClick={() => isClickable && togglePageSelection(pageNum)}
                      style={{
                        border: isSelected ? "3px solid #007bff" : "2px solid #dee2e6",
                        borderRadius: "8px",
                        padding: "0.5rem",
                        backgroundColor: isSelected ? "#e3f2fd" : "white",
                        cursor: isClickable ? "pointer" : "default",
                        position: "relative",
                        boxShadow: isSelected ? "0 4px 12px rgba(0, 123, 255, 0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
                        transition: "all 0.2s ease",
                        opacity: splitMode === "fixed" ? 0.7 : 1,
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Page ${pageNum}`}
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                          borderRadius: "4px",
                          opacity: isSelected ? 0.8 : 1,
                        }}
                      />
                      <div
                        style={{
                          textAlign: "center",
                          marginTop: "0.5rem",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                          color: isSelected ? "#007bff" : "#495057",
                        }}
                      >
                        Page {pageNum}
                      </div>
                      {isSelected && (splitMode === "extract" || splitMode === "ranges") && (
                        <div
                          style={{
                            position: "absolute",
                            top: "0.5rem",
                            right: "0.5rem",
                            backgroundColor: "#007bff",
                            color: "white",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                          }}
                        >
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
        
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          fileBlob={splitBlobs[0]}
          fileName={`split_${pdfFile?.name || 'document.pdf'}`}
        />
      </div>
    );
  }

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
          Split PDF
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
                  onClick={handleStartEditing}
                  style={{
                    backgroundColor: "rgba(57, 185, 57, 0.4)",
                    color: "black",
                    border: "black",
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
                  <PiScissors size={18} />
                  Start Splitting
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
            Split your PDF into multiple files by extracting pages or dividing into equal parts.
          </p>
          <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
            {[
              "Extract specific pages into a new PDF",
              "Split by page ranges or fixed intervals",
              "Download all split files instantly",
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
            <img src="/norton-logo.png" alt="Norton" style={{ height: "30px" }} />
          </div>
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
      <Footer />
    </div>
  );
}