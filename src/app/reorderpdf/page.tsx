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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

declare global {
  interface Window {
    pdfjsLib: any;
    PDFLib: any;
  }
}

export default function PdfReorderPage() {
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
  const instructionData = toolData["reorder-pdf"];

  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectMode, setSelectMode] = useState<"individual" | "range">("individual");
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [downloadOption, setDownloadOption] = useState<"selected" | "non-selected" | "reorder">("selected");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
    };
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const loadPdf = async (url: string) => {
    try {
      setIsProcessing(true);
      const loadingTask = window.pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      const initialOrder = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
      setPageOrder(initialOrder);
      console.log("Initial page order:", initialOrder);

      const images: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.8 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;
        
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
    if (file && pdfUrl) {
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over) {
      console.log("Drag ended outside valid area");
      return;
    }
    
    if (active.id !== over.id) {
      setPageOrder((items) => {
        const activeIndex = items.findIndex(item => item === parseInt(active.id));
        const overIndex = items.findIndex(item => item === parseInt(over.id));
        
        if (activeIndex === -1 || overIndex === -1) {
          console.log("Invalid indices:", { activeIndex, overIndex });
          return items;
        }
        
        const newItems = [...items];
        const [removed] = newItems.splice(activeIndex, 1);
        newItems.splice(overIndex, 0, removed);
        
        console.log("Dragged page", active.id, "from index", activeIndex, "to index", overIndex);
        console.log("New page order:", newItems);
        
        return newItems;
      });
    }
  };

  const SortablePage = ({ pageNum, imageUrl }: { pageNum: number; imageUrl: string }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: pageNum.toString() });
    const isSelected = selectedPages.has(pageNum);

    const style: React.CSSProperties = {
      border: isSelected ? "3px solid #dc3545" : "2px solid #dee2e6",
      borderRadius: "8px",
      padding: "0.5rem",
      backgroundColor: isSelected ? "#f8d7da" : "white",
      cursor: selectMode === "individual" ? "pointer" : "move",
      position: "relative",
      boxShadow: isSelected ? "0 4px 12px rgba(220, 53, 69, 0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...(selectMode === "range" ? attributes : {})}
        {...(selectMode === "range" ? listeners : {})}
        onClick={() => selectMode === "individual" && togglePageSelection(pageNum)}
      >
        <img 
          src={imageUrl} 
          alt={`Page ${pageNum}`} 
          style={{ 
            width: "100%", 
            height: "auto", 
            display: "block", 
            borderRadius: "4px", 
            opacity: isSelected ? 0.7 : 1,
            pointerEvents: "none"
          }} 
        />
        <div style={{ 
          textAlign: "center", 
          marginTop: "0.5rem", 
          fontSize: "0.9rem", 
          fontWeight: "bold", 
          color: isSelected ? "#dc3545" : "#495057" 
        }}>
          Page {pageNum}
        </div>
        {isSelected && (
          <div style={{ 
            position: "absolute", 
            top: "0.5rem", 
            right: "0.5rem", 
            backgroundColor: "#dc3545", 
            color: "white", 
            borderRadius: "50%", 
            width: "24px", 
            height: "24px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: "0.8rem", 
            fontWeight: "bold" 
          }}>
            ✓
          </div>
        )}
      </div>
    );
  };

  const downloadPdf = async () => {
    if (!pdfDoc || !file || (downloadOption !== "reorder" && selectedPages.size === 0)) {
      setError("Please select at least one page or choose reorder mode.");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Check if pdf-lib script is already loaded
      if (!window.PDFLib) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const { PDFDocument } = window.PDFLib;
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      let pagesToCopy: number[];
      
      if (downloadOption === "reorder") {
        // Use the current pageOrder state for reordering
        console.log("Current page order for download:", pageOrder);
        pagesToCopy = pageOrder.map((pageNum) => pageNum - 1);
      } else if (downloadOption === "selected") {
        // Download only selected pages in their original order
        pagesToCopy = Array.from(selectedPages)
          .sort((a, b) => a - b)
          .map((page) => page - 1);
      } else {
        // Download non-selected pages
        pagesToCopy = Array.from({ length: totalPages }, (_, i) => i).filter(
          (page) => !selectedPages.has(page + 1)
        );
      }

      console.log("Pages to copy (0-indexed):", pagesToCopy);

      // Copy pages in the specified order
      const copiedPages = await newPdf.copyPages(originalPdf, pagesToCopy);
      copiedPages.forEach((page: any) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setConvertedFileBlob(blob);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${downloadOption}_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsProcessing(false);
      alert("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error modifying PDF:", error);
      setError("Error modifying PDF. Please try again.");
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
    setPageOrder([]);
  };

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      setFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setIsDropdownOpen(false);
    },
  });

  const { openPicker: openDropboxPicker } = useDropboxPicker({
    onFilePicked: (file) => {
      setFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
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
      setFile(selected);
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
      setFile(file);
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
          setFile(file);
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
    setFile(null);
    setPdfUrl("");
    setConvertedFileBlob(null);
    setError(null);
  };

  const handleShare = () => {
    if (!convertedFileBlob) {
      alert("Please process the PDF first before sharing");
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

  if (isEditingMode) {
    return (
      <div>
        <Navbar />
        <style>
          {`
            @media (max-width: 768px) {
              .header-container {
                flex-direction: column !important;
                gap: 1rem !important;
                align-items: stretch !important;
              }
              .header-title {
                font-size: 1.2rem !important;
                text-align: center;
              }
              .header-button {
                width: 100% !important;
              }
              .download-options {
                flex-direction: column !important;
              }
              .main-content {
                flex-direction: column !important;
              }
              .control-panel {
                width: 100% !important;
                position: static !important;
                margin-bottom: 1rem !important;
              }
              .page-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
              }
            }
            @media (max-width: 480px) {
              .page-grid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
              }
              .control-panel h3 {
                font-size: 1rem !important;
              }
              .control-panel h4 {
                font-size: 0.9rem !important;
              }
            }
          `}
        </style>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
          <div
            className="header-container"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
              marginTop: "1rem",
            }}
          >
            <button
              className="header-button"
              onClick={goBack}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                padding: "0.6rem 1.2rem",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              ← Back
            </button>
            <h1 className="header-title" style={{ fontSize: "1.5rem", margin: 0, fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Reorder PDF Pages
            </h1>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="header-button"
                onClick={downloadPdf}
                disabled={isProcessing || (downloadOption !== "reorder" && selectedPages.size === 0)}
                style={{
                  backgroundColor:
                    (downloadOption === "reorder" || selectedPages.size > 0) && !isProcessing
                      ? "#28a745"
                      : "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "0.6rem 1.2rem",
                  borderRadius: "5px",
                  cursor:
                    (downloadOption === "reorder" || selectedPages.size > 0) && !isProcessing
                      ? "pointer"
                      : "not-allowed",
                  fontSize: "1rem",
                }}
              >
                {isProcessing ? "Processing..." : "Download"}
              </button>
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
                <TbShare3 /> Share
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ marginBottom: "0.5rem" }}>Download Option</h4>
            <div className="download-options" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <button
                onClick={() => setDownloadOption("selected")}
                style={{
                  backgroundColor: downloadOption === "selected" ? "#007bff" : "white",
                  color: downloadOption === "selected" ? "white" : "#007bff",
                  border: "1px solid #007bff",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  flex: 1,
                }}
              >
                Selected Pages
              </button>
              <button
                onClick={() => setDownloadOption("non-selected")}
                style={{
                  backgroundColor: downloadOption === "non-selected" ? "#007bff" : "white",
                  color: downloadOption === "non-selected" ? "white" : "#007bff",
                  border: "1px solid #007bff",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  flex: 1,
                }}
              >
                Non-selected Pages
              </button>
              <button
                onClick={() => setDownloadOption("reorder")}
                style={{
                  backgroundColor: downloadOption === "reorder" ? "#007bff" : "white",
                  color: downloadOption === "reorder" ? "white" : "#007bff",
                  border: "1px solid #007bff",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  flex: 1,
                }}
              >
                Reorder Pages
              </button>
            </div>
          </div>

          {/* Debug: Show current order */}
          <div style={{ 
            marginBottom: "1.5rem", 
            padding: "1rem", 
            backgroundColor: "#e8f5e9", 
            borderRadius: "8px",
            fontSize: "0.85rem",
            border: "1px solid #4caf50"
          }}>
            <strong>Current Page Order:</strong> {pageOrder.join(", ")}
          </div>

          <div className="main-content" style={{ display: "flex", gap: "2rem" }}>
            {/* Control Panel */}
            <div
              className="control-panel"
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
              <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Page Selection</h3>

              {/* Selection Mode */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.5rem" }}>Selection Mode</h4>
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
                    Drag to Reorder
                  </button>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.5rem" }}>
                  {selectMode === "individual" 
                    ? "Click pages to select/deselect" 
                    : "Drag pages to reorder them"}
                </p>
              </div>

              {/* Range Selection */}
              {selectMode === "individual" && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ marginBottom: "0.5rem" }}>Select Page Range</h4>
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
                      backgroundColor:
                        rangeStart && rangeEnd && rangeStart <= rangeEnd ? "#28a745" : "#6c757d",
                      color: "white",
                      border: "none",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "3px",
                      cursor:
                        rangeStart && rangeEnd && rangeStart <= rangeEnd ? "pointer" : "not-allowed",
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
                <h4 style={{ marginBottom: "0.5rem" }}>Quick Actions</h4>
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
                <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                  <strong>Selected Pages:</strong> {selectedPages.size}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#28a745" }}>
                  <strong>Remaining Pages:</strong> {totalPages - selectedPages.size}
                </div>
              </div>

              {/* Instructions */}
              <div
                style={{
                  backgroundColor: "#fff3cd",
                  padding: "1rem",
                  borderRadius: "5px",
                  fontSize: "0.9rem",
                  border: "1px solid #ffeaa7",
                }}
              >
                <strong>How to use:</strong>
                <br />
                1. Switch to "Drag to Reorder" mode to drag pages
                <br />
                2. Or click individual pages to select/deselect
                <br />
                3. Choose download option at the top
                <br />
                4. Click "Download" to generate the new PDF
              </div>
            </div>

            {/* PDF Pages Grid */}
            <div style={{ flex: 1 }}>
              {isProcessing ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "400px",
                    fontSize: "1.2rem",
                    color: "#666",
                  }}
                >
                  Loading PDF pages...
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={pageOrder.map(String)}>
                    <div
                      className="page-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "1rem",
                        padding: "1rem",
                      }}
                    >
                      {pageOrder.map((pageNum) => (
                        <SortablePage
                          key={pageNum}
                          pageNum={pageNum}
                          imageUrl={pageImages[pageNum - 1]}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          fileBlob={convertedFileBlob}
          fileName="reordered.pdf"
        />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "2rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>Reorder PDF Pages</h1>

        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} style={{ border: "3px solid rgba(57, 185, 57, 0.4)",backgroundColor: "rgba(144, 238, 144, 0.2)", borderRadius: "12px", padding: "2rem", textAlign: "center", marginBottom: "2rem", position: "relative", minHeight: "280px" }}>
          {!file ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <img src="./upload.svg" alt="Upload Icon" />
              </div>
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ backgroundColor: "white", padding: "0.6rem 1rem", border: "1px solid #e0e0e0", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: "500", color: "#333", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                  <PiFiles size={18} /> Select File <PiCaretDown size={14} style={{ marginLeft: "0.25rem" }} />
                </button>
                {isDropdownOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, minWidth: "180px", overflow: "hidden" }}>
                    {menuItems.map((item, index) => (
                      <button key={index} onClick={item.onClick} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", width: "100%", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "0.85rem", color: "#333", textAlign: "left" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f5f5"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <span style={{ color: "#666", display: "flex", alignItems: "center" }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileChange} style={{ display: "none" }} />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ backgroundColor: "white", borderRadius: "8px", width: "120px", height: "140px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "relative" }}>
                  <button onClick={removeFile} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(255, 255, 255, 1)", border: "none", borderRadius: "50%", width: "25px", height: "25px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "black" }}>
                    <PiX size={35} />
                  </button>
                  <img src="./pdf.svg" alt="PDF Icon" style={{ width: "40px", height: "50px", marginBottom: "0.5rem" }} />
                  <span style={{ fontSize: "0.65rem", color: "#666", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 0.5rem" }}>{file.name}</span>
                </div>
              </div>
              <button onClick={handleStartEditing} style={{ marginTop: "1.5rem", backgroundColor: "rgba(57, 185, 57, 1)", color: "white", border: "none", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "500" }}>
                Start Editing Pages
              </button>
            </div>
          )}
          {!file && (
            <div style={{ position: "absolute", right: "1rem", top: "90%", transform: "translateY(-50%)", display: "flex", gap: "0.5rem", opacity: 0.4 }}>
              <PiUploadSimple size={20} />
              <PiLink size={20} />
              <FaGoogleDrive size={18} />
              <FaDropbox size={18} />
              <PiClipboard size={20} />
            </div>
          )}
        </div>

        <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
          <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>
            Reorder, select, and remove pages from your PDF with our seamless online tool.
          </p>
          <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
            {["Drag and drop pages to reorder", "Select pages for inclusion/exclusion", "Preview all changes before download"].map((text, index) => (
              <li key={index} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <PiCheckCircle size={18} style={{ color: "green", flexShrink: 0 }} />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: "3rem", padding: "1.5rem", backgroundColor: "#f0f9ff", border: "1px solid #cce5ff", borderRadius: "10px", fontSize: "0.95rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
          <strong>Protected. Encrypted. Automatically Deleted.</strong>
          <p style={{ marginTop: "0.5rem", color: "#555" }}>
            All processing happens in your browser. Your PDF never gets uploaded to any server. Complete privacy guaranteed.
          </p>
        </div>
      </div>

      {showUrlModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowUrlModal(false)}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem" }}>Paste PDF URL</h3>
            <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com/document.pdf" style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "6px", fontSize: "0.9rem", marginBottom: "1rem", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowUrlModal(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "6px", backgroundColor: "white", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleUrlSubmit} disabled={isUploading} style={{ padding: "0.5rem 1rem", border: "none", borderRadius: "6px", backgroundColor: "#007bff", color: "white", cursor: isUploading ? "not-allowed" : "pointer", opacity: isUploading ? 0.7 : 1 }}>
                {isUploading ? "Loading..." : "Add PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToolInstructions title={instructionData.title} steps={instructionData.steps} />
      <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={convertedFileBlob} fileName="reordered.pdf" />
      <Footer />
    </div>
  );
}