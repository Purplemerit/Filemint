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
import FilePreview from "../components/FilePreview";
import JSZip from "jszip";

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
  const instructionData = toolData["split-pdf"];

  const [error, setError] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<"extract" | "ranges" | "fixed">("extract");

  const [fixedPageCount, setFixedPageCount] = useState<number>(1);
  const [isSplit, setIsSplit] = useState(false);

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
    if (droppedFile && (droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf"))) {
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
    if (selected && (selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf"))) {
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

  const handleDownload = async () => {
    if (splitBlobs.length === 0) return;

    if (splitBlobs.length === 1) {
      // Single file download
      const url = URL.createObjectURL(splitBlobs[0]);
      const a = document.createElement("a");
      a.href = url;
      a.download = `split_document_${pdfFile?.name || "file.pdf"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Multiple files - ZIP them
      const zip = new JSZip();
      splitBlobs.forEach((blob, index) => {
        zip.file(`split_${index + 1}.pdf`, blob);
      });

      const zipContent = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipContent);
      const a = document.createElement("a");
      a.href = url;
      a.download = `split_documents_${pdfFile?.name?.replace(".pdf", "") || "files"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Auto-download effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isSplit && splitBlobs.length > 0) {
      timeoutId = setTimeout(() => {
        handleDownload();
      }, 7000); // 7 seconds delay
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSplit, splitBlobs]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleReset = () => {
    setSplitBlobs([]);
    setIsSplit(false);
    // Optional: reset other states or stay in editing mode?
    // User probably wants to split the SAME file differently or go back.
    // Let's keep the file loaded but reset split state.
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
      const originalPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

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

        // Download immediate code removed
        // alert(`Extracted ${selectedPages.size} pages successfully!`); 
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
        }

        // alert(`Created ${ranges.length} split PDFs successfully!`);
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
        }

        // alert(`Created ${numSplits} split PDFs successfully!`);
      }

      setSplitBlobs(blobs);
      setIsSplit(true); // Enable Success View
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
    setIsSplit(false);
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
            {isSplit ? (
              // Success State Logic handled in main view, but if we wanted header buttons, we could put them here.
              // For now, let's keep the header clean or maybe just "Share"
              <></>
            ) : (
              <button
                onClick={splitPdf}
                disabled={isProcessing || (splitMode === "extract" && selectedPages.size === 0)}
                style={{
                  backgroundColor: "#e11d48", // Brand Red
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
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                }}
              >
                <PiScissors size={18} />
                {isProcessing ? "Processing..." : "Split PDF"}
              </button>
            )}
          </div>
        </div>

        {isSplit ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "4rem 2rem",
            gap: "1.5rem",
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            marginTop: "2rem",
            maxWidth: "600px",
            margin: "2rem auto"
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
              PDF Split Successfully!
            </h2>
            <p style={{ color: "#666", textAlign: "center", maxWidth: "400px" }}>
              Your PDF has been split. {splitBlobs.length > 1 ? "Download the files below." : "Download your file below."}
            </p>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                onClick={handleDownload}
                className="download-button"
                style={{
                  backgroundColor: "#e11d48",
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
                {splitBlobs.length > 1 ? "Download Split PDFs (ZIP)" : "Download Split PDF"}
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
                Split Another PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="main-container" style={{ display: "flex", gap: "2rem" }}>
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
                  <div className="animate-spin" style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid #e11d48",
                    borderRadius: "50%",
                    marginRight: "1rem"
                  }}></div>
                  Loading PDF pages...
                </div>
              ) : (
                <div
                  className="page-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "1.5rem",
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
                          border: isSelected ? "3px solid #e11d48" : "1px solid #e0e0e0",
                          borderRadius: "12px",
                          padding: "0.75rem",
                          backgroundColor: isSelected ? "#fff5f6" : "white",
                          cursor: isClickable ? "pointer" : "default",
                          position: "relative",
                          boxShadow: isSelected ? "0 8px 16px rgba(225, 29, 72, 0.15)" : "0 2px 8px rgba(0,0,0,0.05)",
                          transition: "all 0.3s ease",
                          opacity: splitMode === "fixed" ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (isClickable) e.currentTarget.style.transform = "translateY(-4px)";
                        }}
                        onMouseLeave={(e) => {
                          if (isClickable) e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div style={{ position: "relative" }}>
                          <img
                            src={imageUrl}
                            alt={`Page ${pageNum}`}
                            style={{
                              width: "100%",
                              height: "auto",
                              display: "block",
                              borderRadius: "6px",
                              opacity: isSelected ? 0.9 : 1,
                              filter: isSelected ? "none" : "grayscale(20%)",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: "0.5rem",
                              left: "50%",
                              transform: "translateX(-50%)",
                              backgroundColor: isSelected ? "#e11d48" : "rgba(255,255,255,0.9)",
                              color: isSelected ? "white" : "#333",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {pageNum}
                          </div>
                        </div>
                        {isSelected && (splitMode === "extract" || splitMode === "ranges") && (
                          <div
                            style={{
                              position: "absolute",
                              top: "-10px",
                              right: "-10px",
                              backgroundColor: "#e11d48",
                              color: "white",
                              borderRadius: "50%",
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1rem",
                              fontWeight: "bold",
                              boxShadow: "0 4px 8px rgba(225, 29, 72, 0.4)",
                              zIndex: 2,
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

            {/* Control Panel - Moved to Right */}
            <div
              className="control-panel"
              style={{
                width: "350px",
                backgroundColor: "white",
                padding: "2rem",
                borderRadius: "16px",
                height: "fit-content",
                position: "sticky",
                top: "2rem",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                border: "1px solid #f0f0f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
                <div style={{
                  backgroundColor: "#fee2e2",
                  color: "#e11d48",
                  padding: "0.5rem",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <PiScissors size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600", color: "#1a1a1a" }}>
                  Split Options
                </h3>
              </div>

              {/* Tabs-like Split Mode */}
              <div style={{ marginBottom: "2rem" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  backgroundColor: "#f5f5f5",
                  padding: "0.25rem",
                  borderRadius: "12px",
                  marginBottom: "1.5rem"
                }}>
                  {[
                    { id: "extract", label: "Extract" },
                    { id: "ranges", label: "Ranges" },
                    { id: "fixed", label: "Fixed" }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSplitMode(mode.id as any)}
                      style={{
                        backgroundColor: splitMode === mode.id ? "white" : "transparent",
                        color: splitMode === mode.id ? "#e11d48" : "#666",
                        border: "none",
                        padding: "0.6rem 0.2rem",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: splitMode === mode.id ? "600" : "500",
                        boxShadow: splitMode === mode.id ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixed Page Count Input */}
              {splitMode === "fixed" && (
                <div style={{ marginBottom: "2rem", backgroundColor: "#f9fafb", padding: "1.5rem", borderRadius: "12px" }}>
                  <h4 style={{ marginBottom: "0.75rem", fontSize: "0.95rem", color: "#374151" }}>Pages per Split</h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={fixedPageCount}
                      onChange={(e) => setFixedPageCount(parseInt(e.target.value) || 1)}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        boxSizing: "border-box",
                        outline: "none",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
                      }}
                    />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <PiFiles size={14} />
                    Will create {Math.ceil(totalPages / fixedPageCount)} PDF files
                  </p>
                </div>
              )}

              {/* Selection Mode (only for extract and ranges modes) */}
              {(splitMode === "extract" || splitMode === "ranges") && (
                <>
                  <div style={{ marginBottom: "2rem" }}>
                    <h4 style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#374151" }}>Selection Mode</h4>
                    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
                      <button
                        onClick={() => setSelectMode("individual")}
                        style={{
                          backgroundColor: selectMode === "individual" ? "#fff1f2" : "white",
                          color: selectMode === "individual" ? "#e11d48" : "#666",
                          border: `1px solid ${selectMode === "individual" ? "#e11d48" : "#e5e7eb"}`,
                          padding: "0.6rem 1rem",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          flex: 1,
                          transition: "all 0.2s ease",
                        }}
                      >
                        Individual
                      </button>
                      <button
                        onClick={() => setSelectMode("range")}
                        style={{
                          backgroundColor: selectMode === "range" ? "#fff1f2" : "white",
                          color: selectMode === "range" ? "#e11d48" : "#666",
                          border: `1px solid ${selectMode === "range" ? "#e11d48" : "#e5e7eb"}`,
                          padding: "0.6rem 1rem",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          flex: 1,
                          transition: "all 0.2s ease",
                        }}
                      >
                        Range
                      </button>
                    </div>

                    {/* Range Selection Inputs */}
                    {selectMode === "range" && (
                      <div style={{ backgroundColor: "#f9fafb", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.4rem", display: "block" }}>From</label>
                            <input
                              type="number"
                              min="1"
                              max={totalPages}
                              value={rangeStart || ""}
                              onChange={(e) => setRangeStart(parseInt(e.target.value) || null)}
                              style={{
                                width: "100%",
                                padding: "0.6rem",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                fontSize: "0.95rem",
                                outline: "none",
                              }}
                            />
                          </div>
                          <div style={{ alignSelf: "flex-end", paddingBottom: "0.6rem", color: "#9ca3af" }}>→</div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.4rem", display: "block" }}>To</label>
                            <input
                              type="number"
                              min="1"
                              max={totalPages}
                              value={rangeEnd || ""}
                              onChange={(e) => setRangeEnd(parseInt(e.target.value) || null)}
                              style={{
                                width: "100%",
                                padding: "0.6rem",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                fontSize: "0.95rem",
                                outline: "none",
                              }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={selectPageRange}
                          disabled={!rangeStart || !rangeEnd || rangeStart > rangeEnd}
                          style={{
                            backgroundColor: rangeStart && rangeEnd && rangeStart <= rangeEnd ? "#e11d48" : "#f3f4f6",
                            color: rangeStart && rangeEnd && rangeStart <= rangeEnd ? "white" : "#9ca3af",
                            border: "none",
                            padding: "0.75rem",
                            borderRadius: "10px",
                            cursor: rangeStart && rangeEnd && rangeStart <= rangeEnd ? "pointer" : "not-allowed",
                            fontSize: "0.95rem",
                            fontWeight: "600",
                            width: "100%",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Apply Range
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        onClick={selectAllPages}
                        style={{
                          backgroundColor: "#f3f4f6",
                          color: "#374151",
                          border: "none",
                          padding: "0.6rem 1rem",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "500",
                          flex: 1,
                        }}
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearSelection}
                        style={{
                          backgroundColor: "#f3f4f6",
                          color: "#374151",
                          border: "none",
                          padding: "0.6rem 1rem",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "500",
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
                  backgroundColor: "#f0fdf4",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  marginBottom: "2rem",
                  border: "1px solid #dcfce7",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                  <span style={{ color: "#374151" }}>Total Pages:</span>
                  <span style={{ fontWeight: "600", color: "#166534" }}>{totalPages}</span>
                </div>
                {(splitMode === "extract" || splitMode === "ranges") && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span style={{ color: "#374151" }}>Selected Pages:</span>
                    <span style={{ fontWeight: "700", color: "#e11d48" }}>{selectedPages.size}</span>
                  </div>
                )}
                {splitMode === "fixed" && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span style={{ color: "#374151" }}>Output Files:</span>
                    <span style={{ fontWeight: "700", color: "#007bff" }}>{Math.ceil(totalPages / fixedPageCount)}</span>
                  </div>
                )}
              </div>

              <button
                onClick={splitPdf}
                disabled={isProcessing || (splitMode === "extract" && selectedPages.size === 0)}
                style={{
                  backgroundColor: "#e11d48",
                  color: "white",
                  border: "none",
                  padding: "1.2rem",
                  borderRadius: "14px",
                  cursor: isProcessing || (splitMode === "extract" && selectedPages.size === 0) ? "not-allowed" : "pointer",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  boxShadow: "0 8px 16px rgba(225, 29, 72, 0.25)",
                  transition: "all 0.3s ease",
                  opacity: isProcessing || (splitMode === "extract" && selectedPages.size === 0) ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing) e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing) e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {isProcessing ? (
                  <div className="animate-spin" style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%" }}></div>
                ) : <PiScissors size={24} />}
                {isProcessing ? "Processing..." : "SPLIT PDF"}
              </button>
            </div>
          </div>
        )}

        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          fileBlob={splitBlobs[0]}
          fileName={`split_${pdfFile?.name || "document.pdf"}`}
        />
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="main-layout">
        {/* Left Ad */}
        <VerticalAdLeft />

        {/* Main Content */}
        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 className="tool-title">
            Split PDF
          </h1>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="drop-zone-container"
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
                      backgroundColor: "#e11d48",
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
                      <PiX size={18} />
                    </button>

                    <FilePreview file={pdfFile} style={{ width: "80px", height: "100px", marginBottom: "0.5rem" }} />
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
      <Footer />
    </div>
  );
}