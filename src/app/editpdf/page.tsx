"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  PiFiles,
  PiLink,
  PiClipboard,
  PiCaretDown,
  PiUploadSimple,
  PiCheckCircle,
  PiX,
  PiMagnifyingGlassPlus,
  PiMagnifyingGlassMinus
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
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PDFPageProps {
  pageNumber: number;
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  scale: number;
  onDimensionsChanged: (pageNum: number, width: number, height: number) => void;
  onTextClick: (item: any) => void;
  selectedTool: string;
}

const PDFPage = ({ pageNumber, pdfDocument, scale, onDimensionsChanged, onTextClick, selectedTool }: PDFPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current || !textLayerRef.current) return;

      try {
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          onDimensionsChanged(pageNumber, viewport.width, viewport.height);

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          // Render Text Layer
          const textContent = await page.getTextContent();
          textLayerRef.current.innerHTML = "";

          await (pdfjsLib as any).renderTextLayer({
            textContent: textContent,
            container: textLayerRef.current,
            viewport: viewport,
          }).promise;
        }
      } catch (error) {
        console.error(`Error rendering page ${pageNumber}:`, error);
      }
    };

    renderPage();
  }, [pdfDocument, pageNumber, scale]);

  const handleTextLayerClick = (e: React.MouseEvent) => {
    // Only intercept if 'text' tool is selected 
    if (selectedTool !== "text") return;

    const target = e.target as HTMLElement;
    if (target.tagName === 'SPAN' || target.classList.contains('textItem')) {
      const text = target.innerText;
      const rect = target.getBoundingClientRect();
      const parentRect = textLayerRef.current!.getBoundingClientRect();

      const x = rect.left - parentRect.left;
      const y = rect.top - parentRect.top;
      const width = rect.width;
      const height = rect.height;

      const style = window.getComputedStyle(target);
      const fs = parseFloat(style.fontSize);

      onTextClick({
        text, x, y, width, height, fontSize: fs, page: pageNumber
      });

      e.stopPropagation();
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .textLayer {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          opacity: 0.2;
          line-height: 1.0;
        }
        .textLayer span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        /* Style for highlighting the text when hovered in 'text' tool mode */
        .textLayer.interactive span:hover {
          background-color: rgba(0, 123, 255, 0.2);
          border: 1px solid rgba(0, 123, 255, 0.4);
        }
      `}</style>
      <canvas ref={canvasRef} style={{ display: "block", marginBottom: "0" }} />
      <div
        ref={textLayerRef}
        className={`textLayer ${selectedTool === 'text' ? 'interactive' : ''}`}
        onClick={handleTextLayerClick}
        style={{ pointerEvents: selectedTool === 'text' ? 'auto' : 'none' }}
      />
    </div>
  );
};


export default function EditPdfPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [annotations, setAnnotations] = useState<
    Array<{
      id: string;
      type: "text" | "highlight" | "rectangle" | "arrow" | "circle" | "whiteout";
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
  const [selectedTool, setSelectedTool] = useState<"text" | "highlight" | "rectangle" | "arrow" | "circle" | "whiteout">("text");
  const [selectedColor, setSelectedColor] = useState("#FF0000");
  const [fontSize, setFontSize] = useState(14);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<any>(null);

  // New State for PDF.js Rendering
  const [pages, setPages] = useState<number[]>([]);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState(1.5);
  const [pageDimensions, setPageDimensions] = useState<Record<number, { width: number; height: number }>>({});
  const [currentPage, setCurrentPage] = useState<number>(1); // Currently active page for drawing
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);

  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

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
      setIsDropdownOpen(false);
    },
  });

  // Dropbox picker
  const { openPicker: openDropboxPicker } = useDropboxPicker({
    onFilePicked: (file) => {
      setPdfFile(file);
      setIsDropdownOpen(false);
    },
  });

  // Handle responsive scale
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 600) {
          setScale(0.6);
        } else if (width < 900) {
          setScale(0.8);
        } else {
          setScale(1.5);
        }
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load PDF when file changes
  useEffect(() => {
    if (pdfFile) {
      const load = async () => {
        try {
          const arrayBuffer = await pdfFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          setPdfDocument(pdf);
          setPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
          // Reset edits
          setAnnotations([]);
          setIsEdited(false);
          setEditedFileBlob(null);
        } catch (error) {
          console.error("Error loading PDF:", error);
          alert("Failed to load PDF. Please try a different file.");
        }
      };
      load();
    }
  }, [pdfFile]);

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
    { name: "Whiteout", value: "whiteout", icon: "🌫️" },
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
    if (file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      setPdfFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      setPdfFile(file);
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
    setIsEdited(false);
    setAnnotations([]);
    setIsEditingMode(false);
    setPdfDocument(null);
    setPages([]);
  };

  const handleStartEditing = () => {
    if (pdfFile) {
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

  // --- Handlers for Page Interaction ---

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
    if (!isAnnotating) return;

    if (selectedTool === "text") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newAnnotation = {
        id: Date.now().toString(),
        type: "text" as const,
        content: "",
        x: x,
        y: y,
        width: 200,
        height: 30,
        color: selectedColor,
        fontSize: fontSize,
        page: pageNum,
      };
      setAnnotations([...annotations, newAnnotation]);
      setEditingAnnotationId(newAnnotation.id);
    } else if (selectedTool === "whiteout" && !isDrawing) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newAnnotation = {
        id: Date.now().toString(),
        type: "whiteout" as const,
        x: x,
        y: y,
        width: 100,
        height: 30, // Default whiteout size
        color: "#FFFFFF",
        page: pageNum,
      };
      setAnnotations([...annotations, newAnnotation]);
    } else if (selectedTool === "circle" && !isDrawing) {
      // Only if simple click for circle, though typically circle is drawn. 
      // Keeping logic for click-to-place fixed circle if desired, but 
      // usually shapes are dragged. Let's support click-to-place for simplicity if not dragging.
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newAnnotation = {
        id: Date.now().toString(),
        type: "circle" as const,
        x: x - 25,
        y: y - 25,
        width: 50,
        height: 50,
        color: selectedColor,
        page: pageNum,
      };
      setAnnotations([...annotations, newAnnotation]);
    }
  };

  const handlePageMouseDown = (e: any, pageNum: number) => {
    if (!isAnnotating) return;

    const isTouch = e.type.startsWith('touch');
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (selectedTool === "rectangle" || selectedTool === "arrow" || selectedTool === "highlight" || selectedTool === "circle" || selectedTool === "whiteout") {
      setStartPoint({ x, y });
      setIsDrawing(true);
      setCurrentPage(pageNum);
    }
  };

  const handlePageMouseMove = (e: any, pageNum: number) => {
    if (!isAnnotating || !isDrawing || !startPoint || currentPage !== pageNum) return;

    const isTouch = e.type.startsWith('touch');
    const clientX = isTouch ? (e.touches ? e.touches[0].clientX : e.clientX) : e.clientX;
    const clientY = isTouch ? (e.touches ? e.touches[0].clientY : e.clientY) : e.clientY;

    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    const annotation = {
      id: "temp",
      type: selectedTool,
      x: Math.min(startPoint.x, currentX),
      y: Math.min(startPoint.y, currentY),
      width: Math.abs(currentX - startPoint.x),
      height: Math.abs(currentY - startPoint.y),
      color: selectedColor,
      page: pageNum,
    };

    setCurrentAnnotation(annotation);
    if (isTouch) {
      // Prevent scrolling while drawing
      // Note: passive: false is required for this to work in listeners
    }
  };

  const handlePageMouseUp = () => {
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

  const handleDownload = () => {
    if (!editedFileBlob) return;
    const url = window.URL.createObjectURL(editedFileBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edited_${pdfFile?.name || "document.pdf"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    removeFile();
  };

  const downloadEditedPdf = async () => {
    if (!pdfFile || !pdfDocument) {
      alert("Please upload a PDF first.");
      return;
    }

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const docPages = pdfDoc.getPages();
      for (const annotation of annotations) {
        if (annotation.page > docPages.length || annotation.page < 1) continue;

        const page = docPages[annotation.page - 1];
        const { height: pageHeight } = page.getSize();
        const scaleFactor = 1 / scale;

        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
          } : { r: 0, g: 0, b: 0 };
        };

        const color = hexToRgb(annotation.color);
        const rgbColor = rgb(color.r, color.g, color.b);

        const pdfX = annotation.x * scaleFactor;
        const pdfW = annotation.width * scaleFactor;
        const pdfH = annotation.height * scaleFactor;
        const pdfY = pageHeight - (annotation.y * scaleFactor) - pdfH;

        switch (annotation.type) {
          case "text":
            if (annotation.content) {
              let fontToEmbed;
              try {
                // Professional Font Embedding for Edit PDF (Standard Sans-Serif)
                const FONT_URL = "https://cdn.jsdelivr.net/npm/@canvas-fonts/arial/Arial.ttf";
                const fontBytes = await fetch(FONT_URL).then(res => res.arrayBuffer());
                fontToEmbed = await pdfDoc.embedFont(fontBytes);
              } catch (e) {
                fontToEmbed = await pdfDoc.embedFont(StandardFonts.Helvetica);
              }

              page.drawText(annotation.content, {
                x: pdfX,
                y: pdfY + (pdfH * 0.15),
                size: (annotation.fontSize || 14) * scaleFactor * 1.02,
                font: fontToEmbed,
                color: rgbColor,
              });
            }
            break;
          case "whiteout":
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              color: rgb(1, 1, 1),
              borderColor: rgb(1, 1, 1),
            });
            break;
          case "rectangle":
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              borderColor: rgbColor,
              borderWidth: 2,
            });
            break;
          case "circle":
            page.drawEllipse({
              x: pdfX + pdfW / 2,
              y: pdfY + pdfH / 2,
              xScale: pdfW / 2,
              yScale: pdfH / 2,
              borderColor: rgbColor,
              borderWidth: 2,
            });
            break;
          case "highlight":
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              color: rgb(color.r, color.g, color.b),
              opacity: 0.3,
            });
            break;
          case "arrow":
            page.drawLine({
              start: { x: pdfX, y: pdfY + pdfH / 2 },
              end: { x: pdfX + pdfW, y: pdfY + pdfH / 2 },
              color: rgbColor,
              thickness: 2
            });
            break;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      setEditedFileBlob(blob);
      setIsEdited(true);
      setIsEditingMode(false);

    } catch (error) {
      console.error("Error generating edited PDF:", error);
      alert("Error generating edited PDF. Please try again.");
    }
  };


  // Auto-download helper
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isEdited && editedFileBlob) {
      timeoutId = setTimeout(() => {
        handleDownload();
      }, 7000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isEdited, editedFileBlob]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));

  const goBack = () => {
    setIsEditingMode(false);
    // Don't clear instructions or file, just mode
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

  const onDimensionChanged = (pageNum: number, width: number, height: number) => {
    setPageDimensions(prev => ({
      ...prev,
      [pageNum]: { width, height }
    }));
  };

  const handleInbuiltTextClick = (item: any) => {
    // 1. Create a whiteout annotation at this spot
    const whiteoutAnn = {
      id: `wo-${Date.now()}`,
      type: "whiteout" as const,
      x: item.x,
      y: item.y,
      width: item.width + 1,
      height: item.height + 1,
      color: "#FFFFFF",
      page: item.page,
    };

    // 2. Create an editable text annotation
    const textAnn = {
      id: `edit-${Date.now()}`,
      type: "text" as const,
      content: item.text,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      color: "#000000",
      fontSize: item.fontSize,
      page: item.page,
    };

    setAnnotations([...annotations, whiteoutAnn, textAnn]);
    setEditingAnnotationId(textAnn.id);
  };

  // Editing Mode UI
  if (isEditingMode) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
        <style>{`
          @media (max-width: 768px) {
            .header-controls-edit { flex-direction: column !important; gap: 0.5rem !important; align-items: stretch !important; margin-top: 1rem !important; }
            .header-controls-edit > * { width: 100% !important; justify-content: center !important; }
            .main-container-edit { flex-direction: column !important; gap: 1rem !important; }
            .tools-panel { 
              width: 100% !important; 
              position: static !important; 
              margin-bottom: 0.5rem; 
              max-height: none !important;
            }
            .tool-grid { grid-template-columns: repeat(3, 1fr) !important; }
            .color-grid { grid-template-columns: repeat(4, 1fr) !important; }
            .pdf-viewer-container { 
              height: 60vh !important; 
              padding: 0.5rem !important; 
              overflow-x: auto !important;
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
            .pdf-pages-wrapper {
              align-items: center !important;
              width: max-content !important;
              min-width: 100% !important;
            }
          }
        `}</style>

        <div
          className="header-controls-edit"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "3rem 0rem 2rem 0rem",
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "1rem", backgroundColor: "white", padding: "0.4rem", borderRadius: "5px", border: "1px solid #ccc" }}>
              <button onClick={handleZoomOut} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }} title="Zoom Out">
                <PiMagnifyingGlassMinus size={20} />
              </button>
              <span style={{ fontSize: "0.9rem", minWidth: "3rem", textAlign: "center" }}>{Math.round(scale * 100)}%</span>
              <button onClick={handleZoomIn} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }} title="Zoom In">
                <PiMagnifyingGlassPlus size={20} />
              </button>
            </div>
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
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <span>Finish & Save</span>
            </button>
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
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "clamp(1rem, 3vw, 1.17rem)" }}>Editing Tools</h3>

            {/* Helper Status */}
            <div style={{ marginBottom: "1.5rem", padding: "0.75rem", backgroundColor: "#e9ecef", borderRadius: "5px", fontSize: "0.85rem" }}>
              {isAnnotating ? "✏️ Annotation Mode Active" : "👆 Viewing Mode (Scroll)"}
            </div>

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
                {isAnnotating ? "Exit Annotation Mode" : "Start Annotating"}
              </button>
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

            {/* Simple Font Size Slider */}
            {isAnnotating && selectedTool === "text" && (
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>Text Size</h4>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />
                <div style={{ fontSize: "0.8rem", textAlign: "right", color: "#666" }}>{fontSize}px</div>
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
              </div>
            )}
          </div>

          {/* PDF Pages List */}
          <div className="pdf-viewer-container" style={{ flex: 1, minWidth: 0, backgroundColor: "#e2e2e2", padding: "2rem", borderRadius: "8px", height: "80vh", overflowY: "auto" }}>
            <div className="pdf-pages-wrapper" style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center" }}>
              {pages.map(pageNum => (
                <div
                  key={pageNum}
                  style={{
                    position: "relative",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    backgroundColor: "white"
                  }}
                  onMouseDown={(e) => handlePageMouseDown(e, pageNum)}
                  onMouseMove={(e) => handlePageMouseMove(e, pageNum)}
                  onMouseUp={handlePageMouseUp}
                  onTouchStart={(e) => handlePageMouseDown(e, pageNum)}
                  onTouchMove={(e) => handlePageMouseMove(e, pageNum)}
                  onTouchEnd={handlePageMouseUp}
                  onClick={(e) => handlePageClick(e, pageNum)}
                >
                  <PDFPage
                    pageNumber={pageNum}
                    pdfDocument={pdfDocument}
                    scale={scale}
                    onDimensionsChanged={onDimensionChanged}
                    onTextClick={handleInbuiltTextClick}
                    selectedTool={selectedTool}
                  />

                  {/* Overlay for Page */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: isAnnotating ? "auto" : "none",
                    cursor: isAnnotating ? (selectedTool === "text" ? "text" : "crosshair") : "default",
                  }}>
                    {/* Annotations for this page */}
                    {annotations.filter(ann => ann.page === pageNum).map(annotation => (
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
                                  fontFamily: "sans-serif",
                                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                                  whiteSpace: "nowrap",
                                  padding: "2px 4px",
                                  borderRadius: "4px",
                                  border: "1px dashed transparent"
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
                                // Simplified arrow visualization for DOM (just a line/box for now or complex SVG)
                                // Building a proper DOM arrow is hard, using simple box for preview
                                return {
                                  borderBottom: `2px solid ${annotation.color}`,
                                  backgroundColor: "transparent",
                                  transformOrigin: "left center",
                                  // rotation would be needed for real arrows
                                };
                              case "whiteout":
                                return {
                                  backgroundColor: "white",
                                  border: "1px solid #eee"
                                };
                              default:
                                return {};
                            }
                          })(),
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (annotation.type === "text") {
                            setEditingAnnotationId(annotation.id);
                          }
                        }}
                      >
                        {annotation.type === "text" && (
                          <div style={{ position: "relative", width: "100%", height: "100%" }}>
                            {editingAnnotationId === annotation.id ? (
                              <textarea
                                autoFocus
                                value={annotation.content}
                                onChange={(e) => updateAnnotationText(annotation.id, e.target.value)}
                                onBlur={() => {
                                  setEditingAnnotationId(null);
                                  if (!annotation.content?.trim()) {
                                    removeAnnotation(annotation.id);
                                  }
                                }}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  border: "1px dashed #007bff",
                                  background: "transparent",
                                  color: annotation.color,
                                  fontSize: `${annotation.fontSize}px`,
                                  fontFamily: "sans-serif",
                                  padding: 0,
                                  resize: "none",
                                  overflow: "hidden",
                                  outline: "none",
                                }}
                                onMouseDown={(e) => e.stopPropagation()} // Prevent dragging setup
                              />
                            ) : (
                              <span style={{ cursor: "text", display: "inline-block", minWidth: "20px", minHeight: "20px" }}>{annotation.content || "Type here..."}</span>
                            )}

                            {editingAnnotationId !== annotation.id && (
                              <button
                                onClick={(e) => { e.stopPropagation(); removeAnnotation(annotation.id); }}
                                style={{
                                  position: "absolute",
                                  top: "-10px",
                                  right: "-10px",
                                  background: "red",
                                  color: "white",
                                  borderRadius: "50%",
                                  width: "16px",
                                  height: "16px",
                                  fontSize: "10px",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  zIndex: 5
                                }}
                              >x</button>
                            )}
                          </div>
                        )}
                        {annotation.type !== "text" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeAnnotation(annotation.id); }}
                            style={{
                              position: "absolute",
                              top: "-8px",
                              right: "-8px",
                              background: "red",
                              color: "white",
                              borderRadius: "50%",
                              width: "16px",
                              height: "16px",
                              fontSize: "10px",
                              border: "none",
                              cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                          >x</button>
                        )}
                      </div>
                    ))}

                    {/* Current Annotation Preview (Draft) */}
                    {currentAnnotation && currentAnnotation.page === pageNum && (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial Upload UI or Success UI
  return (
    <div>
      <Navbar />
      <style>{`
        @media (max-width: 1024px) {
          .upload-container {
            flex-direction: column !important;
            padding: 0 1rem !important;
          }
          .ad-column {
            display: none !important;
          }
        }
      `}</style>

      <div className="upload-container" style={{
        display: "flex",
        maxWidth: "1400px",
        margin: "4rem auto",
        padding: "0 2rem",
        gap: "2rem",
        alignItems: "flex-start"
      }}>
        {/* Left Ad */}
        <div className="ad-column">
          <VerticalAdLeft />
        </div>

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
            {isEdited ? (
              /* Success State - Download */
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "1.5rem",
                padding: "2rem 0"
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
                  Success!
                </h2>
                <p style={{ color: "#666", textAlign: "center", maxWidth: "400px" }}>
                  Your PDF has been edited and saved.
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
                    Download PDF
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
                    Edit Another File
                  </button>
                </div>
              </div>
            ) : !pdfFile ? (
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
        <div className="ad-column">
          <VerticalAdRight />
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
        fileBlob={editedFileBlob}
        fileName="edited.pdf"
      />
      <Footer />
    </div>
  );
}