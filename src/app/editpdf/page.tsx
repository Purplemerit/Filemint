"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState, useRef } from "react";
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
import { TbShare3 } from "react-icons/tb";
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

export default function EditPdfPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [annotations, setAnnotations] = useState<
    Array<{
      id: string;
      type: "text" | "highlight" | "rectangle" | "arrow" | "circle";
      content?: string;
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      fontSize?: number;
      page: number;
    }>
  >([]);
  const [selectedTool, setSelectedTool] = useState<"text" | "highlight" | "rectangle" | "arrow" | "circle">("text");
  const [selectedColor, setSelectedColor] = useState("#FF0000");
  const [textContent, setTextContent] = useState("");
  const [fontSize, setFontSize] = useState(14);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editedFileBlob, setEditedFileBlob] = useState<Blob | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoDownloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  const instructionData = toolData["editpdf"];

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

  const colors = [
    { name: "Red", value: "#FF0000" },
    { name: "Blue", value: "#0000FF" },
    { name: "Green", value: "#00FF00" },
    { name: "Yellow", value: "#FFFF00" },
    { name: "Orange", value: "#FFA500" },
    { name: "Purple", value: "#800080" },
    { name: "Black", value: "#000000" },
    { name: "White", value: "#FFFFFF" },
  ];

  const tools = [
    { name: "Text", value: "text", icon: "📝" },
    { name: "Highlight", value: "highlight", icon: "🖍️" },
    { name: "Rectangle", value: "rectangle", icon: "⬜" },
    { name: "Circle", value: "circle", icon: "⭕" },
    { name: "Arrow", value: "arrow", icon: "➡️" },
  ];

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
    setEditedFileBlob(null);
  };

  const handleStartEditing = () => {
    if (pdfFile && pdfUrl) {
      setIsEditingMode(true);
    }
  };

  const handleShare = () => {
    if (!editedFileBlob) {
      alert("Please edit and save the PDF first before sharing");
      return;
    }
    setShowShareModal(true);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current || !isAnnotating) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === "text") {
      const newAnnotation = {
        id: Date.now().toString(),
        type: "text" as const,
        content: textContent || "Click to edit",
        x: x,
        y: y,
        width: 200,
        height: 30,
        color: selectedColor,
        fontSize: fontSize,
        page: currentPage,
      };
      setAnnotations([...annotations, newAnnotation]);
    } else if (selectedTool === "circle") {
      const newAnnotation = {
        id: Date.now().toString(),
        type: "circle" as const,
        x: x - 25,
        y: y - 25,
        width: 50,
        height: 50,
        color: selectedColor,
        page: currentPage,
      };
      setAnnotations([...annotations, newAnnotation]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating) return;
    
    if (selectedTool === "rectangle" || selectedTool === "arrow" || selectedTool === "highlight") {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPoint({ x, y });
        setIsDrawing(true);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating || !isDrawing || !startPoint || !overlayRef.current) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const annotation = {
      id: "temp",
      type: selectedTool,
      x: Math.min(startPoint.x, currentX),
      y: Math.min(startPoint.y, currentY),
      width: Math.abs(currentX - startPoint.x),
      height: Math.abs(currentY - startPoint.y),
      color: selectedColor,
      page: currentPage,
    };

    setCurrentAnnotation(annotation);
  };

  const handleMouseUp = () => {
    if (!isAnnotating) return;
    
    if (isDrawing && currentAnnotation && currentAnnotation.width > 5 && currentAnnotation.height > 5) {
      const newAnnotation = {
        ...currentAnnotation,
        id: Date.now().toString(),
      };
      setAnnotations([...annotations, newAnnotation]);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentAnnotation(null);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter((ann) => ann.id !== id));
  };

  const updateAnnotationText = (id: string, newText: string) => {
    setAnnotations(annotations.map(ann => 
      ann.id === id ? { ...ann, content: newText } : ann
    ));
  };

  const downloadEditedPdf = async () => {
    if (!pdfFile || annotations.length === 0) {
      alert("Please add some annotations before downloading.");
      return;
    }

    try {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";

      await new Promise((resolve) => {
        script.onload = resolve;
        document.head.appendChild(script);
      });

      // @ts-ignore
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const annotation of annotations) {
        const page = pages[annotation.page - 1];
        const { height: pageHeight } = page.getSize();

        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
          } : { r: 1, g: 0, b: 0 };
        };

        const color = hexToRgb(annotation.color);
        const rgbColor = rgb(color.r, color.g, color.b);

        const pdfX = annotation.x;
        const pdfY = pageHeight - annotation.y - annotation.height;

        switch (annotation.type) {
          case "text":
            if (annotation.content) {
              page.drawText(annotation.content, {
                x: pdfX,
                y: pdfY + annotation.height - 5,
                size: annotation.fontSize || 14,
                font: font,
                color: rgbColor,
              });
            }
            break;
          case "rectangle":
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: annotation.width,
              height: annotation.height,
              borderColor: rgbColor,
              borderWidth: 2,
            });
            break;
          case "circle":
            page.drawEllipse({
              x: pdfX + annotation.width / 2,
              y: pdfY + annotation.height / 2,
              xScale: annotation.width / 2,
              yScale: annotation.height / 2,
              borderColor: rgbColor,
              borderWidth: 2,
            });
            break;
          case "highlight":
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: annotation.width,
              height: annotation.height,
              color: rgb(color.r, color.g, color.b),
              opacity: 0.3,
            });
            break;
        }
      }

      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setEditedFileBlob(blob);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited_${pdfFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("PDF edited and downloaded successfully!");

      // Clear auto-download timer if exists
      if (autoDownloadTimerRef.current) {
        clearTimeout(autoDownloadTimerRef.current);
        autoDownloadTimerRef.current = null;
      }
    } catch (error) {
      console.error("Error generating edited PDF:", error);
      alert("Error generating edited PDF. Please try again.");
    }
  };

  // Auto-download after 7 seconds when annotations are added
  useEffect(() => {
    if (annotations.length > 0 && pdfFile) {
      // Clear existing timer
      if (autoDownloadTimerRef.current) {
        clearTimeout(autoDownloadTimerRef.current);
      }

      // Set new timer for 7 seconds
      autoDownloadTimerRef.current = setTimeout(() => {
        downloadEditedPdf();
      }, 7000);
    }

    return () => {
      if (autoDownloadTimerRef.current) {
        clearTimeout(autoDownloadTimerRef.current);
      }
    };
  }, [annotations]);

  const goBack = () => {
    setIsEditingMode(false);
    setAnnotations([]);
    setCurrentAnnotation(null);
    setIsAnnotating(false);
  };

  const toggleAnnotationMode = () => {
    setIsAnnotating(!isAnnotating);
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
    { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: openDropboxPicker },
    { icon: <PiClipboard size={18} />, label: "From Clipboard", onClick: handleFromClipboard },
  ];

  // Editing Mode UI
  if (isEditingMode) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
        <style>{`
          @media (max-width: 768px) {
            .header-controls-edit {
              flex-direction: column !important;
              gap: 1rem !important;
            }
            .header-controls-edit > * {
              width: 100% !important;
            }
            .main-container-edit {
              flex-direction: column !important;
            }
            .tools-panel {
              width: 100% !important;
              position: static !important;
              margin-bottom: 1.5rem;
            }
            .tool-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
            .color-grid {
              grid-template-columns: repeat(4, 1fr) !important;
            }
            .pdf-viewer-container {
              height: 500px !important;
            }
          }
          @media (max-width: 480px) {
            .tools-panel {
              padding: 1rem !important;
            }
            .tool-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 0.4rem !important;
            }
            .tool-grid button {
              font-size: 0.8rem !important;
              padding: 0.4rem !important;
            }
            .pdf-viewer-container {
              height: 400px !important;
            }
            .annotations-list {
              max-height: 150px !important;
            }
          }
        `}</style>
        
        <div
          className="header-controls-edit"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin:"3rem 0rem 2rem 0rem",
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
          <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", margin: 0 }}>Edit Your PDF</h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={downloadEditedPdf}
              style={{
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                padding: "0.6rem 1.2rem",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                minWidth: "100px",
              }}
            >
              Download PDF
            </button>
            {/* <button
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
                fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
              }}
            >
              <TbShare3 />
              Share
            </button> */}
          </div>
        </div>

        <div className="main-container-edit" style={{ display: "flex", gap: "2rem" }}>
          {/* Editing Tools Panel */}
          <div className="tools-panel" style={{
            width: "300px",
            backgroundColor: "#f8f9fa",
            padding: "1.5rem",
            borderRadius: "10px",
            height: "fit-content",
            position: "sticky",
            top: "2rem",
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "clamp(1rem, 3vw, 1.17rem)" }}>Editing Tools</h3>

            {/* Annotation Mode Toggle */}
            <div style={{ marginBottom: "2rem" }}>
              <button
                onClick={toggleAnnotationMode}
                style={{
                  backgroundColor: isAnnotating ? "#dc3545" : "#28a745",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1rem",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
                  width: "100%",
                  fontWeight: "bold",
                }}
              >
                {isAnnotating ? "🔒 Exit Annotation Mode" : "✏️ Enter Annotation Mode"}
              </button>
              <p style={{ 
                fontSize: "clamp(0.7rem, 2vw, 0.8rem)", 
                color: "#666", 
                marginTop: "0.5rem",
                textAlign: "center"
              }}>
                {isAnnotating 
                  ? "Click to add annotations. Exit to scroll/navigate PDF." 
                  : "PDF is scrollable. Enter annotation mode to add annotations."
                }
              </p>
            </div>

            {/* Tool Selection */}
            {isAnnotating && (
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Select Tool</h4>
                <div className="tool-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {tools.map((tool) => (
                    <button
                      key={tool.value}
                      onClick={() => setSelectedTool(tool.value as any)}
                      style={{
                        backgroundColor: selectedTool === tool.value ? "#007bff" : "white",
                        color: selectedTool === tool.value ? "white" : "#007bff",
                        border: "1px solid #007bff",
                        padding: "0.5rem",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <span>{tool.icon}</span>
                      <span>{tool.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Text Input */}
            {isAnnotating && selectedTool === "text" && (
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Text Content</h4>
                <input
                  type="text"
                  placeholder="Enter text to add"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    marginBottom: "0.5rem",
                    fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ marginBottom: "0.5rem" }}>
                  <label style={{ fontSize: "clamp(0.8rem, 2vw, 0.9rem)", marginBottom: "0.3rem", display: "block" }}>
                    Font Size: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="36"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            )}

            {/* Color Selection */}
            {isAnnotating && (
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Color</h4>
                <div className="color-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      style={{
                        backgroundColor: color.value,
                        border: selectedColor === color.value ? "3px solid #000" : "1px solid #ccc",
                        borderRadius: "5px",
                        width: "100%",
                        aspectRatio: "1",
                        cursor: "pointer",
                        minHeight: "30px",
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  style={{
                    width: "100%",
                    height: "40px",
                    marginTop: "0.5rem",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                />
              </div>
            )}

            {/* Annotations List */}
            <div style={{ marginBottom: "2rem" }}>
              <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Annotations ({annotations.length})</h4>
              <div className="annotations-list" style={{ maxHeight: "200px", overflowY: "auto" }}>
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                      borderRadius: "3px",
                      padding: "0.5rem",
                      marginBottom: "0.5rem",
                      fontSize: "clamp(0.75rem, 2vw, 0.8rem)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontWeight: "bold" }}>
                        {tools.find(t => t.value === annotation.type)?.icon} {annotation.type}
                      </div>
                      {annotation.content && (
                        <div style={{ fontSize: "clamp(0.65rem, 1.8vw, 0.7rem)", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          &quot;{annotation.content.substring(0, 20)}...&quot;
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeAnnotation(annotation.id)}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        padding: "2px 6px",
                        cursor: "pointer",
                        fontSize: "clamp(0.65rem, 1.8vw, 0.7rem)",
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div style={{
              backgroundColor: "#e3f2fd",
              padding: "1rem",
              borderRadius: "5px",
              fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
            }}>
              <strong>How to use:</strong>
              <br />
              1. {isAnnotating ? "Select a tool and click/drag on PDF" : "Click 'Enter Annotation Mode' to start"}
              <br />
              2. {isAnnotating ? "Customize colors and text" : "Use scroll/zoom controls normally"}
              <br />
              3. {isAnnotating ? "Exit mode to navigate PDF" : "Toggle modes as needed"}
              <br />
              4. Download when finished
            </div>
          </div>

          {/* PDF Viewer with Overlay */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pdf-viewer-container" style={{ position: "relative", height: "800px", border: "2px solid #dee2e6", borderRadius: "10px", overflow: "auto", backgroundColor: "#f5f5f5" }}>
              <iframe
                ref={pdfViewerRef}
                src={`${pdfUrl}#view=FitH&toolbar=1&navpanes=0&zoom=page-fit`}
                style={{
                  width: "100%",
                  minHeight: "100%",
                  height: "auto",
                  border: "none",
                }}
                title="PDF Viewer"
                allow="fullscreen"
              />
              
              <div
                ref={overlayRef}
                onClick={handleOverlayClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: isAnnotating ? "auto" : "none",
                  cursor: isAnnotating ? (selectedTool === "text" ? "text" : "crosshair") : "default",
                  backgroundColor: isAnnotating ? "rgba(0, 0, 0, 0.05)" : "transparent",
                }}
              >
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    style={{
                      position: "absolute",
                      left: annotation.x,
                      top: annotation.y,
                      width: annotation.width,
                      height: annotation.height,
                      pointerEvents: "auto",
                      ...(() => {
                        switch (annotation.type) {
                          case "text":
                            return {
                              color: annotation.color,
                              fontSize: `${annotation.fontSize}px`,
                              fontWeight: "bold",
                              backgroundColor: "rgba(255, 255, 255, 0.8)",
                              padding: "2px 4px",
                              borderRadius: "2px",
                            };
                          case "rectangle":
                            return {
                              border: `2px solid ${annotation.color}`,
                              backgroundColor: "transparent",
                            };
                          case "circle":
                            return {
                              border: `2px solid ${annotation.color}`,
                              borderRadius: "50%",
                              backgroundColor: "transparent",
                            };
                          case "highlight":
                            return {
                              backgroundColor: `${annotation.color}40`,
                            };
                          case "arrow":
                            return {
                              border: `2px solid ${annotation.color}`,
                              backgroundColor: "transparent",
                              position: "relative",
                            };
                          default:
                            return {};
                        }
                      })(),
                    }}
                  >
                    {annotation.type === "text" && annotation.content && (
                      <input
                        type="text"
                        value={annotation.content}
                        onChange={(e) => updateAnnotationText(annotation.id, e.target.value)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: annotation.color,
                          fontSize: `${annotation.fontSize}px`,
                          fontWeight: "bold",
                          width: "100%",
                          outline: "none",
                        }}
                      />
                    )}
                    
                    <button
                      onClick={() => removeAnnotation(annotation.id)}
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "16px",
                        height: "16px",
                        fontSize: "10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {currentAnnotation && (
                  <div
                    style={{
                      position: "absolute",
                      left: currentAnnotation.x,
                      top: currentAnnotation.y,
                      width: currentAnnotation.width,
                      height: currentAnnotation.height,
                      border: `2px dashed ${currentAnnotation.color}`,
                      backgroundColor: currentAnnotation.type === "highlight" ? `${currentAnnotation.color}40` : "transparent",
                      borderRadius: currentAnnotation.type === "circle" ? "50%" : "0",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Upload UI
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
        <VerticalAdLeft/>

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
            Edit PDF
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
                    backgroundColor: "#007bff",
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
                  ✏️ Start Editing
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
            Add text, shapes, highlights and annotations to your PDF documents.
          </p>
          <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
            {[
              "Add text, rectangles, circles, and highlights",
              "Customize colors and font sizes",
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
        fileBlob={editedFileBlob}
        fileName="edited.pdf"
      />
      <Footer />
    </div>
  );
}