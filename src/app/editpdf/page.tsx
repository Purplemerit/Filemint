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

const PDFThumbnail = ({ pdfDocument }: { pdfDocument: pdfjsLib.PDFDocumentProxy | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const renderThumbnail = async () => {
      if (!pdfDocument || !canvasRef.current) return;
      try {
        const page = await pdfDocument.getPage(1);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
        }
      } catch (e) {
        console.error("Error rendering thumbnail", e);
      }
    };
    renderThumbnail();
  }, [pdfDocument]);

  return <canvas ref={canvasRef} style={{ maxWidth: "80px", maxHeight: "110px", objectFit: "contain", borderRadius: "2px", border: "1px solid #eee" }} />;
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
      type: "text" | "highlight" | "rectangle" | "arrow" | "circle" | "whiteout" | "image" | "draw";
      content?: string;
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      fontSize?: number;
      page: number;
      imageData?: string; // Base64 or Blob URL for images
      points?: Array<{ x: number; y: number }>; // For freehand drawing
    }>
  >([]);
  const [selectedTool, setSelectedTool] = useState<"text" | "highlight" | "rectangle" | "arrow" | "circle" | "whiteout" | "image" | "draw">("text");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedColor, setSelectedColor] = useState("#FF0000");
  const [fontSize, setFontSize] = useState(14);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<any>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [movingAnnotationId, setMovingAnnotationId] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState<{ x: number, y: number } | null>(null);

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
    { name: "Image", value: "image", icon: "🖼️" },
    { name: "Highlight", value: "highlight", icon: "🖍️" },
    { name: "Rectangle", value: "rectangle", icon: "⬜" },
    { name: "Circle", value: "circle", icon: "⭕" },
    { name: "Arrow", value: "arrow", icon: "➡️" },
    { name: "Draw", value: "draw", icon: "✏️" },
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

  const handlePageMouseDown = (e: any, pageNum: number) => {
    const isTouch = e.type.startsWith('touch');
    const clientX = isTouch ? (e.touches ? e.touches[0].clientX : e.clientX) : e.clientX;
    const clientY = isTouch ? (e.touches ? e.touches[0].clientY : e.clientY) : e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check if we clicked an annotation (prefer this over starting a new one)
    const clickedAnn = annotations.find(ann =>
      ann.page === pageNum &&
      x >= ann.x * scale && x <= (ann.x + ann.width) * scale &&
      y >= ann.y * scale && y <= (ann.y + ann.height) * scale
    );

    if (clickedAnn && (!isAnnotating || annotationCanBeMoved(clickedAnn.type))) {
      setMovingAnnotationId(clickedAnn.id);
      setMoveOffset({ x: x - clickedAnn.x * scale, y: y - clickedAnn.y * scale });
      return;
    }

    if (!isAnnotating) return;

    setStartPoint({ x, y });
    setIsDrawing(true);
    setHasMoved(false);
    setCurrentPage(pageNum);
  };

  const annotationCanBeMoved = (type: string) => ["image", "text", "rectangle", "circle", "whiteout", "arrow", "draw"].includes(type);

  const handlePageMouseMove = (e: any, pageNum: number) => {
    const isTouch = e.type.startsWith('touch');
    const clientX = isTouch ? (e.touches ? e.touches[0].clientX : e.clientX) : e.clientX;
    const clientY = isTouch ? (e.touches ? e.touches[0].clientY : e.clientY) : e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    if (movingAnnotationId && moveOffset) {
      setAnnotations(annotations.map(ann => {
        if (ann.id === movingAnnotationId) {
          const newX = (currentX - moveOffset.x) / scale;
          const newY = (currentY - moveOffset.y) / scale;

          // If it's a 'draw' type, we need to shift all points (but 'draw' isn't in my type list for moving yet)
          if (ann.type === "draw" && ann.points) {
            const dx = newX - ann.x;
            const dy = newY - ann.y;
            return {
              ...ann,
              x: newX,
              y: newY,
              points: ann.points.map(p => ({ x: p.x + dx, y: p.y + dy }))
            }
          }

          return { ...ann, x: newX, y: newY };
        }
        return ann;
      }));
      return;
    }

    if (!isDrawing || !startPoint || currentPage !== pageNum) return;

    if (Math.abs(currentX - startPoint.x) > 3 || Math.abs(currentY - startPoint.y) > 3) {
      setHasMoved(true);
    }

    if (selectedTool === "draw") {
      const newPoint = { x: currentX, y: currentY };
      const previousPoints = currentAnnotation?.points || [{ x: startPoint.x, y: startPoint.y }];

      const annotationIndices = annotations.length; // Just for temp ID

      setCurrentAnnotation({
        id: "temp",
        type: "draw",
        points: [...previousPoints, newPoint],
        color: selectedColor,
        page: pageNum,
        // Calculate bounding box for the container
        x: Math.min(...[...previousPoints, newPoint].map(p => p.x)),
        y: Math.min(...[...previousPoints, newPoint].map(p => p.y)),
        width: Math.max(...[...previousPoints, newPoint].map(p => p.x)) - Math.min(...[...previousPoints, newPoint].map(p => p.x)),
        height: Math.max(...[...previousPoints, newPoint].map(p => p.y)) - Math.min(...[...previousPoints, newPoint].map(p => p.y)),
      });
      return;
    }

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
  };

  const handlePageMouseUp = (e: any) => {
    if (movingAnnotationId) {
      setMovingAnnotationId(null);
      setMoveOffset(null);
      return;
    }

    if (!isDrawing || !startPoint) return;

    if (!hasMoved) {
      // Handle as a Click
      const { x, y } = startPoint;
      if (selectedTool === "text") {
        const newAnnotation = {
          id: Date.now().toString(),
          type: "text" as const,
          content: "",
          x: x / scale,
          y: y / scale,
          width: 250 / scale,
          height: Math.max(40, fontSize * 1.5) / scale,
          color: selectedColor,
          fontSize: fontSize, // Point size is already unscaled in state
          page: currentPage,
        };
        setAnnotations([...annotations, newAnnotation]);
        setEditingAnnotationId(newAnnotation.id);
      } else if (selectedTool === "image") {
        imageInputRef.current?.click();
      } else {
        // Default size for other tools on click
        const defaultWidth = selectedTool === "whiteout" ? 80 : 50;
        const defaultHeight = selectedTool === "whiteout" ? 30 : 50;
        const newAnnotation = {
          id: Date.now().toString(),
          type: selectedTool as any,
          x: (x - defaultWidth / 2) / scale,
          y: (y - defaultHeight / 2) / scale,
          width: defaultWidth / scale,
          height: defaultHeight / scale,
          color: selectedColor,
          page: currentPage,
        };
        setAnnotations([...annotations, newAnnotation]);
      }
    } else if (currentAnnotation) {
      if (selectedTool === "draw") {
        const unscaledAnnotation = {
          ...currentAnnotation,
          id: Date.now().toString(),
          points: currentAnnotation.points.map((p: any) => ({ x: p.x / scale, y: p.y / scale })),
          x: currentAnnotation.x / scale,
          y: currentAnnotation.y / scale,
          width: currentAnnotation.width / scale,
          height: currentAnnotation.height / scale,
        };
        setAnnotations([...annotations, unscaledAnnotation]);
      } else {
        // Scale currentAnnotation back to 1.0 before saving
        const unscaledAnnotation = {
          ...currentAnnotation,
          id: Date.now().toString(),
          x: currentAnnotation.x / scale,
          y: currentAnnotation.y / scale,
          width: currentAnnotation.width / scale,
          height: currentAnnotation.height / scale,
          fontSize: currentAnnotation.type === 'text' ? fontSize : undefined
        };
        setAnnotations([...annotations, unscaledAnnotation]);
      }
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentAnnotation(null);
  };



  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter((ann) => ann.id !== id));
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, startPoint?.x, startPoint?.y, currentPage);
    }
    e.target.value = "";
    setStartPoint(null);
  };

  const processImageFile = (file: File, x?: number, y?: number, pageNum?: number) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const fullDataUrl = event.target?.result as string;
      const xPos = x !== undefined ? x : 100;
      const yPos = y !== undefined ? y : 100;
      const pg = pageNum !== undefined ? pageNum : 1;

      const newAnnotation = {
        id: Date.now().toString(),
        type: "image" as const,
        imageData: fullDataUrl,
        x: xPos / scale,
        y: yPos / scale,
        width: 150 / scale,
        height: 150 / scale,
        color: "transparent",
        page: pg,
      };
      setAnnotations([...annotations, newAnnotation]);
    };
    reader.readAsDataURL(file);
  };

  const handleWorkspaceDrop = (e: React.DragEvent<HTMLDivElement>, pageNum: number) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      processImageFile(file, x, y, pageNum);
    }
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
        // Since we store unscaled points, scaleFactor is no longer needed here
        // as PDF points match our unscaled system.

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

        const pdfX = annotation.x;
        const pdfW = annotation.width;
        const pdfH = annotation.height;
        const pdfY = pageHeight - annotation.y - pdfH;

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
                size: (annotation.fontSize || 14),
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
          case "arrow": {
            // Calculate direction for a professional arrow
            const endX = pdfX + pdfW;
            const endY = pdfY; // Simple horizontal arrow for now, or use actual drag points
            page.drawLine({
              start: { x: pdfX, y: pdfY + pdfH / 2 },
              end: { x: pdfX + pdfW, y: pdfY + pdfH / 2 },
              color: rgbColor,
              thickness: 2
            });
            // Head
            page.drawLine({
              start: { x: pdfX + pdfW, y: pdfY + pdfH / 2 },
              end: { x: pdfX + pdfW - 10, y: pdfY + pdfH / 2 + 5 },
              color: rgbColor, thickness: 2
            });
            page.drawLine({
              start: { x: pdfX + pdfW, y: pdfY + pdfH / 2 },
              end: { x: pdfX + pdfW - 10, y: pdfY + pdfH / 2 - 5 },
              color: rgbColor, thickness: 2
            });
            break;
          }
          case "draw":
            if (annotation.points && annotation.points.length > 1) {
              for (let i = 0; i < annotation.points.length - 1; i++) {
                const start = annotation.points[i];
                const end = annotation.points[i + 1];
                page.drawLine({
                  start: { x: start.x, y: pageHeight - start.y },
                  end: { x: end.x, y: pageHeight - end.y },
                  color: rgbColor,
                  thickness: 2,
                });
              }
            }
            break;
          case "image":
            if (annotation.imageData) {
              try {
                const base64Data = annotation.imageData.split(",")[1];
                const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
                let pdfImage;
                if (annotation.imageData.includes("image/png")) {
                  pdfImage = await pdfDoc.embedPng(imageBytes);
                } else if (annotation.imageData.includes("image/jpeg") || annotation.imageData.includes("image/jpg")) {
                  pdfImage = await pdfDoc.embedJpg(imageBytes);
                } else {
                  // Fallback or skip if unsupported
                  console.warn("Unsupported image format for PDF embedding");
                  break;
                }
                page.drawImage(pdfImage, {
                  x: pdfX,
                  y: pdfY,
                  width: pdfW,
                  height: pdfH,
                });
              } catch (err) {
                console.error("Error embedding image:", err);
              }
            }
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
    if (!isAnnotating || selectedTool !== "text") return;

    // Scale items back to unscaled coordinates
    const unscaledX = item.x / scale;
    const unscaledY = item.y / scale;
    const unscaledW = item.width / scale;
    const unscaledH = item.height / scale;
    const unscaledFS = item.fontSize / scale;

    const newAnnotation = {
      id: Date.now().toString(),
      type: "text" as const,
      content: item.text,
      x: unscaledX,
      y: unscaledY,
      width: unscaledW + 20,
      height: unscaledH + 10,
      color: selectedColor,
      fontSize: unscaledFS,
      page: item.page,
    };
    setAnnotations([...annotations, newAnnotation]);
    setEditingAnnotationId(newAnnotation.id);
  };

  // Editing Mode UI
  // Editing Mode UI
  if (isEditingMode) {
    return (
      <div style={{
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif"
      }}>
        <input
          type="file"
          hidden
          ref={imageInputRef}
          accept="image/*"
          onChange={handleImageSelected}
        />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
          
          .edit-top-bar {
            height: 64px;
            background: white;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            padding: 0 1.5rem;
            position: sticky;
            top: 0;
            z-index: 1000;
            justify-content: space-between;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          }

          .edit-toolbar {
            display: flex;
            align-items: center;
            gap: 1rem;
            background: #fff;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            margin: 1rem auto;
            position: sticky;
            top: 74px;
            z-index: 999;
            maxWidth: 900px;
          }

          .tool-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border: none;
            background: transparent;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            color: #4b5563;
          }
          .tool-btn:hover { background: #f3f4f6; color: #111827; }
          .tool-btn.active { background: #e11d4820; color: #e11d48; border: 1px solid #e11d4840; }
          .tool-btn span { font-size: 0.7rem; font-weight: 500; margin-top: 4px; }

          .pdf-workspace {
            display: flex;
            flex: 1;
            padding: 1rem;
            overflow: hidden;
            justify-content: center;
          }

          .main-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
          }

          .side-settings {
            width: 280px;
            background: white;
            border-left: 1px solid #e0e0e0;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }

          .page-card {
            background: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            position: relative;
            transition: transform 0.2s;
          }

          @media (max-width: 1024px) {
            .side-settings { display: none; }
            .edit-top-bar { padding: 0 0.75rem; }
            .edit-toolbar { width: 95%; overflow-x: auto; padding: 0.5rem; }
          }
          @media (max-width: 600px) {
            .file-name-title { display: none !important; }
            .save-btn-text { font-size: 0.8rem !important; }
          }
        `}</style>

        {/* --- Top Bar --- */}
        <div className="edit-top-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={goBack}
              style={{
                background: "#f3f4f6",
                border: "none",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              ← Back
            </button>
            <div style={{ height: "24px", width: "1px", background: "#e0e0e0" }} />
            <h1 className="file-name-title" style={{
              fontSize: "1rem", fontWeight: "600", color: "#111827", margin: 0,
              maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {pdfFile?.name || "Editing PDF"}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Zoom Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#f3f4f6", padding: "0.3rem", borderRadius: "8px" }}>
              <button onClick={handleZoomOut} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                <PiMagnifyingGlassMinus size={18} />
              </button>
              <span style={{ fontSize: "0.8rem", width: "40px", textAlign: "center", fontWeight: "600" }}>{Math.round(scale * 100)}%</span>
              <button onClick={handleZoomIn} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                <PiMagnifyingGlassPlus size={18} />
              </button>
            </div>

            <button
              onClick={downloadEditedPdf}
              className="save-btn-text"
              style={{
                backgroundColor: "#e11d48",
                color: "white",
                border: "none",
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "0.9rem",
                boxShadow: "0 4px 6px rgba(225, 29, 72, 0.2)"
              }}
            >
              Save PDF
            </button>
          </div>
        </div>

        {/* --- Floating Toolbar --- */}
        <div className="edit-toolbar">
          {tools.map((tool) => (
            <button
              key={tool.value}
              className={`tool-btn ${selectedTool === tool.value && isAnnotating ? "active" : ""}`}
              onClick={() => {
                setSelectedTool(tool.value as any);
                setIsAnnotating(true);
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{tool.icon}</span>
              <span>{tool.name}</span>
            </button>
          ))}
          <div style={{ height: "30px", width: "1px", background: "#e0e0e0", margin: "0 4px" }} />
          <button
            className={`tool-btn ${!isAnnotating ? "active" : ""}`}
            onClick={() => setIsAnnotating(false)}
          >
            <span style={{ fontSize: "1.2rem" }}>👆</span>
            <span>Select</span>
          </button>
        </div>

        {/* --- Workspace --- */}
        <div className="pdf-workspace">
          <div className="main-scroll">
            {pages.map(pageNum => (
              <div
                key={pageNum}
                className="page-card"
                onMouseDown={(e) => handlePageMouseDown(e, pageNum)}
                onMouseMove={(e) => handlePageMouseMove(e, pageNum)}
                onMouseUp={handlePageMouseUp}
                onTouchStart={(e) => handlePageMouseDown(e, pageNum)}
                onTouchMove={(e) => handlePageMouseMove(e, pageNum)}
                onTouchEnd={handlePageMouseUp}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleWorkspaceDrop(e, pageNum)}
              >
                <div style={{ position: "absolute", left: "-40px", top: "10px", color: "#9ca3af", fontSize: "0.75rem", fontWeight: "600" }}>
                  {pageNum}
                </div>

                <PDFPage
                  pageNumber={pageNum}
                  pdfDocument={pdfDocument}
                  scale={scale}
                  onDimensionsChanged={onDimensionChanged}
                  onTextClick={handleInbuiltTextClick}
                  selectedTool={selectedTool}
                />

                {/* Annotation Surface */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: isAnnotating ? "auto" : "none",
                  cursor: isAnnotating ? (selectedTool === "text" ? "text" : "crosshair") : "default",
                }}>
                  {annotations.filter(ann => ann.page === pageNum).map(annotation => (
                    <div
                      key={annotation.id}
                      style={{
                        position: "absolute",
                        left: annotation.x * scale,
                        top: annotation.y * scale,
                        width: annotation.width * scale,
                        height: annotation.type === "text" ? "auto" : annotation.height * scale,
                        minHeight: annotation.type === "text" ? `${(annotation.fontSize || 14) * scale * 1.2}px` : "auto",
                        pointerEvents: "auto",
                        cursor: annotationCanBeMoved(annotation.type) ? "move" : "auto",
                        transition: "box-shadow 0.2s",
                        ...(() => {
                          const base = {
                            color: annotation.color,
                            fontSize: `${(annotation.fontSize || 14) * scale}px`,
                            fontFamily: "'Inter', sans-serif",
                          };
                          switch (annotation.type) {
                            case "text":
                              return { ...base, padding: "2px 4px", borderRadius: "2px", border: editingAnnotationId === annotation.id ? "1px solid #e11d48" : "1px solid transparent" };
                            case "rectangle":
                              return { border: `2px solid ${annotation.color}` };
                            case "circle":
                              return { border: `2px solid ${annotation.color}`, borderRadius: "50%" };
                            case "highlight":
                              return { backgroundColor: `${annotation.color}40` };
                            case "whiteout":
                              return { backgroundColor: "white", border: "1px solid #e0e0e0" };
                            case "arrow":
                              return { borderBottom: `2px solid ${annotation.color}` };
                            case "image":
                              return {
                                backgroundImage: `url(${annotation.imageData})`,
                                backgroundSize: "contain",
                                backgroundRepeat: "no-repeat",
                                border: "1px dashed #e0e0e0"
                              };
                            case "draw":
                              return { border: "none" };
                            default: return {};
                          }
                        })(),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (annotation.type === "text") setEditingAnnotationId(annotation.id);
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
                                if (!annotation.content?.trim()) removeAnnotation(annotation.id);
                              }}
                              style={{
                                width: "100%", height: "100%", minHeight: `${(annotation.fontSize || 14) * scale * 1.3}px`, border: "none", background: "white",
                                color: annotation.color, fontSize: `${(annotation.fontSize || 14) * scale}px`,
                                padding: "2px 0", resize: "none", outline: "none", boxShadow: "0 0 0 2px #e11d4820"
                              }}
                            />
                          ) : (
                            <span style={{ cursor: "text", minWidth: "30px", display: "inline-block", padding: "2px 0", lineHeight: "1.2" }}>
                              {annotation.content || "Type here..."}
                            </span>
                          )}
                        </div>
                      )}

                      {annotation.type === "draw" && annotation.points && (
                        <svg
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                            overflow: "visible"
                          }}
                        >
                          <polyline
                            points={annotation.points
                              .map(p => `${(p.x - annotation.x) * scale},${(p.y - annotation.y) * scale}`)
                              .join(" ")}
                            fill="none"
                            stroke={annotation.color}
                            strokeWidth={2 * scale}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}

                      {/* Delete Handle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeAnnotation(annotation.id); }}
                        style={{
                          position: "absolute", top: "-10px", right: "-10px",
                          background: "#ef4444", color: "white", borderRadius: "50%",
                          width: "20px", height: "20px", fontSize: "10px", border: "none",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: editingAnnotationId === annotation.id ? 1 : 0,
                          transition: "opacity 0.2s",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}
                        className="delete-handle"
                      >
                        ✕
                      </button>
                      <style>{`.page-card:hover .delete-handle { opacity: 1; }`}</style>
                    </div>
                  ))}

                  {/* Draft Preview */}
                  {currentAnnotation && currentAnnotation.page === pageNum && (
                    <>
                      {currentAnnotation.type !== "draw" ? (
                        <div style={{
                          position: "absolute",
                          left: currentAnnotation.x,
                          top: currentAnnotation.y,
                          width: currentAnnotation.width,
                          height: currentAnnotation.type === "text" ? "auto" : currentAnnotation.height,
                          minHeight: currentAnnotation.type === "text" ? `${fontSize * 1.2}px` : "auto",
                          border: `2px dashed ${currentAnnotation.color}`,
                          backgroundColor: currentAnnotation.type === "highlight" ? `${currentAnnotation.color}40` : "transparent",
                          borderRadius: currentAnnotation.type === "circle" ? "50%" : "0",
                          pointerEvents: "none",
                        }} />
                      ) : (
                        <svg
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                            overflow: "visible"
                          }}
                        >
                          <polyline
                            points={currentAnnotation.points
                              .map((p: any) => `${p.x},${p.y}`)
                              .join(" ")}
                            fill="none"
                            stroke={currentAnnotation.color}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Settings Sidebar */}
          <div className="side-settings">
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>Settings</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#4b5563" }}>Color Palette</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                {colors.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    style={{
                      height: "32px",
                      backgroundColor: color.value,
                      border: selectedColor === color.value ? "3px solid #111827" : "1px solid #e0e0e0",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  />
                ))}
              </div>
            </div>

            {selectedTool === "text" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#4b5563" }}>Font Size ({fontSize}px)</label>
                <input
                  type="range" min="8" max="72" value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#e11d48" }}
                />
              </div>
            )}

            {selectedTool === "image" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#4b5563" }}>Add Image</label>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    backgroundColor: "#e11d48",
                    color: "white",
                    border: "none",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem"
                  }}
                >
                  <span>🖼️</span>
                  Upload from device
                </button>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
                  Or click anywhere on the page to place an image.
                </p>
              </div>
            )}

            <div style={{ marginTop: "auto", padding: "1.25rem", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "0.8rem", color: "#6b7280" }}>
              <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600", color: "#374151" }}>Quick Help</p>
              Click anywhere on the page to add text, or drag to draw shapes. Use 'Select' mode to move around.
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Initial Upload UI or Success UI
  return (
    <div style={{
      fontFamily: "'Inter', sans-serif"
    }}>
      <input
        type="file"
        hidden
        ref={imageInputRef}
        accept="image/*"
        onChange={handleImageSelected}
      />
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

                    <div style={{ padding: "0.5rem" }}>
                      <PDFThumbnail pdfDocument={pdfDocument} />
                    </div>
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