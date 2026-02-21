"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  PiFiles,
  PiLink,
  PiClipboard,
  PiCaretDown,
  PiUploadSimple,
  PiCheckCircle,
  PiX,
  PiSignature,
  PiPenNib,
  PiTextT,
  PiImage,
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
}

const PDFPage = ({ pageNumber, pdfDocument, scale, onDimensionsChanged }: PDFPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return;

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
        }
      } catch (error) {
        console.error(`Error rendering page ${pageNumber}:`, error);
      }
    };

    renderPage();
  }, [pdfDocument, pageNumber, scale]);

  return <canvas ref={canvasRef} style={{ display: "block", marginBottom: "0" }} />;
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

export default function ESignPdfPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [signatures, setSignatures] = useState<
    Array<{
      id: string;
      type: "text" | "image" | "draw";
      content: string; // text content or image data URL
      x: number;
      y: number;
      width: number;
      height: number;
      page: number;
      fontFamily?: string;
      color?: string;
    }>
  >([]);

  // PDF Rendering States
  const [pages, setPages] = useState<number[]>([]);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState(1.5);
  const [pageDimensions, setPageDimensions] = useState<Record<number, { width: number; height: number }>>({});

  // Modal & Selection States
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"type" | "draw" | "upload">("type");
  const [selectedFont, setSelectedFont] = useState("Dancing Script");
  const [selectedColor, setSelectedColor] = useState("#000000"); // Black default
  const [typedName, setTypedName] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Drag & Drop State
  const [stagedSignature, setStagedSignature] = useState<any>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Success & Download States
  const [isSigned, setIsSigned] = useState(false);
  const [signedFileBlob, setSignedFileBlob] = useState<Blob | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const autoDownloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  const instructionData = toolData["esignpdf"];

  const fonts = [
    { name: "Dancing Script", label: "Signature 1" },
    { name: "Great Vibes", label: "Signature 2" },
    { name: "Sacramento", label: "Signature 3" },
    { name: "Pacifico", label: "Signature 4" },
  ];

  const colors = [
    { name: "Black", value: "#000000" },
    { name: "Blue", value: "#0000FF" },
    { name: "Red", value: "#FF0000" },
    { name: "Green", value: "#008000" },
  ];

  // Helper to load fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Sacramento&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); }
  }, []);

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
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));

  // PDF Load Effect
  useEffect(() => {
    if (pdfFile) {
      const load = async () => {
        try {
          const arrayBuffer = await pdfFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          setPdfDocument(pdf);
          setPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
          // Reset
          setSignatures([]);
          setIsSigned(false);
          setSignedFileBlob(null);
        } catch (error) {
          console.error("Error loading PDF:", error);
          alert("Failed to load PDF.");
        }
      };
      load();
    }
  }, [pdfFile]);

  // Google Drive & Dropbox Pickers
  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => { setPdfFile(file); setIsDropdownOpen(false); },
  });
  const { openPicker: openDropboxPicker } = useDropboxPicker({
    onFilePicked: (file) => { setPdfFile(file); setIsDropdownOpen(false); },
  });

  // Basic Handlers
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
  const handleFromDevice = () => fileInputRef.current?.click();
  const handleShare = () => {
    if (!signedFileBlob) {
      alert("Please sign and save PDF first");
      return;
    }
    setShowShareModal(true);
  };
  const removeFile = () => {
    setPdfFile(null);
    setSignedFileBlob(null);
    setIsSigned(false);
    setSignatures([]);
    setIsSigningMode(false);
  };

  // URL Handlers
  const handlePasteUrl = () => { setShowUrlModal(true); setIsDropdownOpen(false); };
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    try {
      setIsUploading(true);
      const response = await fetch(urlInput);
      const blob = await response.blob();
      if (blob.type !== "application/pdf") { alert("URL must be PDF"); return; }
      const file = new File([blob], "downloaded.pdf", { type: "application/pdf" });
      setPdfFile(file);
      setShowUrlModal(false);
    } catch { alert("Failed to fetch PDF"); } finally { setIsUploading(false); }
  };

  // Drawing Canvas Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = selectedColor;
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Save drawing
    const canvas = drawingCanvasRef.current;
    if (canvas) setDrawnSignature(canvas.toDataURL());
  };
  const clearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignature(null);
  };

  // Image Upload Logic for Signature
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Add Signature to PDF (Create Drag Item)
  const applySignature = () => {
    let content = "";
    let type: "text" | "image" | "draw" = "text";

    if (activeTab === "type") {
      if (!typedName) return;
      content = typedName;
      type = "text";
    } else if (activeTab === "draw") {
      if (!drawnSignature) return;
      content = drawnSignature; // Data URL
      type = "draw"; // Treat as image effectively
    } else {
      if (!uploadedImage) return;
      content = uploadedImage;
      type = "image";
    }

    // Set as staged item that will be placed on click
    const sigData = {
      type,
      content,
      width: type === "text" ? 200 : 150,
      height: type === "text" ? 60 : 80,
      fontFamily: activeTab === "type" ? selectedFont : undefined,
      color: selectedColor
    };

    setStagedSignature(sigData);
    setShowSignatureModal(false);
  };

  const handlePageClick = (e: React.MouseEvent, pageNum: number) => {
    if (!stagedSignature) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSignature = {
      ...stagedSignature,
      id: Date.now().toString(),
      x: x - stagedSignature.width / 2,
      y: y - stagedSignature.height / 2,
      page: pageNum
    };

    setSignatures([...signatures, newSignature]);
    setStagedSignature(null);
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!stagedSignature) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left + e.currentTarget.scrollLeft,
      y: e.clientY - rect.top + e.currentTarget.scrollTop
    });
  };

  // Remove Signature
  const removeSignature = (id: string) => {
    setSignatures(signatures.filter(s => s.id !== id));
  };

  // Download / Finish
  const finishSigning = async () => {
    if (!pdfFile || !pdfDocument) return;

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pdfPages = pdfDoc.getPages();

      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#000000");
        return result ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
      };

      const getBytes = async (content: string) => {
        if (content.startsWith('data:')) {
          const base64 = content.split(',')[1];
          const binaryStr = atob(base64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          return bytes;
        }
        return await fetch(content).then(res => res.arrayBuffer());
      };

      for (const sig of signatures) {
        if (sig.page > pdfPages.length || sig.page < 1) continue;
        const page = pdfPages[sig.page - 1];
        const { height: pageHeight } = page.getSize();

        const scaleFactor = 1 / scale;
        const pdfX = sig.x * scaleFactor;
        const pdfW = sig.width * scaleFactor;
        const pdfH = sig.height * scaleFactor;
        const pdfY = pageHeight - (sig.y * scaleFactor) - pdfH;

        const color = hexToRgb(sig.color || "#000000");
        const pdfColor = rgb(color.r, color.g, color.b);

        if (sig.type === "text") {
          try {
            // BULLETPROOF STRATEGY: Render text to a high-res image to guarantee font fidelity
            const offscreenCanvas = document.createElement('canvas');
            const ctx = offscreenCanvas.getContext('2d');
            if (!ctx) throw new Error("Canvas context failed");

            // Use high resolution for crisp text (3x scale)
            const renderScale = 3;
            offscreenCanvas.width = sig.width * renderScale;
            offscreenCanvas.height = sig.height * renderScale;

            ctx.scale(renderScale, renderScale);
            // Wait a tiny bit to ensure browser font is ready (it should be since it's visible in editor)
            ctx.font = `italic 40px "${sig.fontFamily || 'Dancing Script'}", cursive`;
            ctx.fillStyle = sig.color || "#000000";
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            // Draw text in the center of the signature box
            ctx.fillText(sig.content, sig.width / 2, sig.height / 2);

            const imgData = offscreenCanvas.toDataURL('image/png');
            const imageBytes = await getBytes(imgData);
            const image = await pdfDoc.embedPng(imageBytes);

            page.drawImage(image, {
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH
            });
          } catch (e) {
            console.error("Text-to-Image conversion failed:", e);
            // Final fallback
            const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            page.drawText(sig.content, {
              x: pdfX,
              y: pdfY + (pdfH * 0.2),
              size: (sig.height * 0.7) * scaleFactor,
              font: standardFont,
              color: pdfColor,
            });
          }
        }
        else {
          try {
            const imageBytes = await getBytes(sig.content);
            let image;
            if (sig.content.startsWith('data:image/png')) {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              image = await pdfDoc.embedJpg(imageBytes);
            }
            page.drawImage(image, {
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH
            });
          } catch (e) {
            console.error("Image loading failed:", e);
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      setSignedFileBlob(blob);
      setIsSigned(true);
      setIsSigningMode(false);

    } catch (err) {
      console.error("Finish signing error:", err);
      alert("Error saving PDF. Check console.");
    }
  };

  const handleDownload = () => {
    if (!signedFileBlob) return;
    const url = window.URL.createObjectURL(signedFileBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signed_${pdfFile?.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Auto-download helper
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isSigned && signedFileBlob) {
      timeoutId = setTimeout(() => {
        handleDownload();
      }, 7000);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [isSigned, signedFileBlob]);

  // Dimension tracking
  const onDimensionChanged = (pageNum: number, width: number, height: number) => {
    setPageDimensions(prev => ({ ...prev, [pageNum]: { width, height } }));
  };

  // Drag Handlers for signatures on the page
  const handleStartDrag = (e: any, sig: any) => {
    // Prevent scrolling when dragging on touch devices
    if (e.type === 'touchstart') {
      // e.preventDefault(); // This can cause issues with scrolling if not careful
    }

    const isTouch = e.type.startsWith('touch');
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const startX = clientX;
    const startY = clientY;
    const startLeft = sig.x;
    const startTop = sig.y;

    const onMove = (mv: any) => {
      const currentX = isTouch ? mv.touches[0].clientX : mv.clientX;
      const currentY = isTouch ? mv.touches[0].clientY : mv.clientY;
      const dx = currentX - startX;
      const dy = currentY - startY;

      setSignatures(prev => prev.map(s =>
        s.id === sig.id ? { ...s, x: startLeft + dx, y: startTop + dy } : s
      ));
    };

    const onUp = () => {
      if (isTouch) {
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onUp);
      } else {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }
    };

    if (isTouch) {
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onUp);
    } else {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }
  };

  if (isSigningMode) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
        <style>{`
         @media (max-width: 768px) {
             .header-controls-sign {
               flex-direction: column !important;
               gap: 0.5rem !important;
               align-items: stretch !important;
               margin-top: 1rem !important;
             }
             .header-controls-sign > * {
               width: 100% !important;
               justify-content: center !important;
             }
             .main-container-sign {
               flex-direction: column !important;
               gap: 1rem !important;
             }
             .signature-panel {
               width: 100% !important;
               position: static !important;
               margin-bottom: 0.5rem;
             }
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
             .zoom-controls {
               display: none !important; /* Hide zoom on small mobile to save space */
             }
           }
         `}</style>
        <div
          className="header-controls-sign"
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            margin: "3rem 0rem 2rem 0rem", gap: "1rem", flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setIsSigningMode(false)}
            style={{
              backgroundColor: "#6c757d", color: "white", border: "none",
              padding: "0.6rem 1.2rem", borderRadius: "5px", cursor: "pointer"
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Sign PDF</h1>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto", marginRight: "1rem", backgroundColor: "white", padding: "0.4rem", borderRadius: "5px", border: "1px solid #ccc" }}>
            <button onClick={handleZoomOut} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }} title="Zoom Out">
              <PiMagnifyingGlassMinus size={20} />
            </button>
            <span style={{ fontSize: "0.9rem", minWidth: "3rem", textAlign: "center" }}>{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }} title="Zoom In">
              <PiMagnifyingGlassPlus size={20} />
            </button>
          </div>

          <button
            onClick={finishSigning}
            style={{
              backgroundColor: "#28a745", color: "white", border: "none",
              padding: "0.6rem 1.2rem", borderRadius: "5px", cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Finish & Sign
          </button>
        </div>

        <div className="main-container-sign" style={{ display: "flex", gap: "2rem" }}>
          {/* Sidebar Tools */}
          <div className="signature-panel" style={{ width: "250px", flexShrink: 0 }}>
            <button
              onClick={() => setShowSignatureModal(true)}
              style={{
                width: "100%", padding: "1rem", backgroundColor: "#e11d48",
                color: "white", border: "none", borderRadius: "8px",
                cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                marginBottom: "1rem"
              }}
            >
              <PiSignature size={24} /> Add Signature
            </button>
            <div style={{ backgroundColor: "#f8f9fa", padding: "1rem", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.9rem", color: "#666", marginTop: 0 }}>
                {stagedSignature
                  ? "Signature ready! Now CLICK anywhere on the document to place it."
                  : 'Click "Add Signature" to create one, then click on the page to place it.'}
              </p>
            </div>
          </div>

          {/* Document Viewer */}
          <div
            className="pdf-viewer-container"
            onMouseMove={handleContainerMouseMove}
            style={{
              flex: 1,
              backgroundColor: "#e2e2e2",
              padding: "2rem",
              borderRadius: "8px",
              height: "80vh",
              overflowY: "auto",
              position: "relative"
            }}
          >
            {/* Ghost Preview */}
            {stagedSignature && (
              <div style={{
                position: "absolute",
                left: mousePos.x,
                top: mousePos.y,
                width: stagedSignature.width * (activeTab === "type" ? 1 : 1), // Optional adjustments
                height: stagedSignature.height,
                pointerEvents: "none",
                opacity: 0.6,
                zIndex: 1000,
                transform: "translate(-50%, -50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #e11d48",
                backgroundColor: "rgba(255, 255, 255, 0.4)"
              }}>
                {stagedSignature.type === "text" ? (
                  <span style={{
                    fontFamily: stagedSignature.fontFamily,
                    color: stagedSignature.color,
                    fontSize: "1.5rem",
                    whiteSpace: "nowrap"
                  }}>
                    {stagedSignature.content}
                  </span>
                ) : (
                  <img src={stagedSignature.content} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                )}
              </div>
            )}

            <div className="pdf-pages-wrapper" style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center" }}>
              {pages.map(pageNum => (
                <div
                  key={pageNum}
                  onClick={(e) => handlePageClick(e, pageNum)}
                  style={{
                    position: "relative",
                    backgroundColor: "white",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    cursor: stagedSignature ? "crosshair" : "default"
                  }}
                >
                  <PDFPage pageNumber={pageNum} pdfDocument={pdfDocument} scale={scale} onDimensionsChanged={onDimensionChanged} />

                  {/* Overlay for Signatures */}
                  <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                    {signatures.filter(s => s.page === pageNum).map(sig => (
                      <div
                        key={sig.id}
                        style={{
                          position: "absolute",
                          left: sig.x,
                          top: sig.y,
                          width: sig.width,
                          height: sig.height,
                          border: "1px dashed #e11d48",
                          cursor: "grab",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                        onMouseDown={(e) => handleStartDrag(e, sig)}
                        onTouchStart={(e) => handleStartDrag(e, sig)}
                      >
                        {sig.type === "text" && (
                          <span style={{
                            fontFamily: sig.fontFamily,
                            color: sig.color,
                            fontSize: "1.5rem",
                            whiteSpace: "nowrap",
                            pointerEvents: "none"
                          }}>
                            {sig.content}
                          </span>
                        )}
                        {sig.type !== "text" && (
                          <img src={sig.content} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); removeSignature(sig.id); }}
                          style={{
                            position: "absolute", top: -10, right: -10,
                            background: "red", color: "white", borderRadius: "50%",
                            width: 20, height: 20, border: "none", cursor: "pointer",
                            alignItems: "center", justifyContent: "center", display: "flex", fontSize: 12
                          }}
                        >x</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Signature Modal */}
        {showSignatureModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ backgroundColor: "white", borderRadius: "10px", width: "500px", maxWidth: "90%", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>Create Signature</h3>
                <button onClick={() => setShowSignatureModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><PiX size={18} /></button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid #eee", marginBottom: "1rem" }}>
                <button onClick={() => setActiveTab("type")} style={{ flex: 1, padding: "0.5rem", borderBottom: activeTab === "type" ? "2px solid #007bff" : "none", fontWeight: activeTab === "type" ? "bold" : "normal", background: "none", border: "none", cursor: "pointer" }}>Type</button>
                <button onClick={() => setActiveTab("draw")} style={{ flex: 1, padding: "0.5rem", borderBottom: activeTab === "draw" ? "2px solid #007bff" : "none", fontWeight: activeTab === "draw" ? "bold" : "normal", background: "none", border: "none", cursor: "pointer" }}>Draw</button>
                <button onClick={() => setActiveTab("upload")} style={{ flex: 1, padding: "0.5rem", borderBottom: activeTab === "upload" ? "2px solid #007bff" : "none", fontWeight: activeTab === "upload" ? "bold" : "normal", background: "none", border: "none", cursor: "pointer" }}>Upload</button>
              </div>

              {/* Tab Content */}
              <div style={{ minHeight: "200px" }}>
                {activeTab === "type" && (
                  <div>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      style={{ width: "100%", padding: "0.8rem", borderRadius: "5px", border: "1px solid #ccc", marginBottom: "1rem" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {fonts.map(font => (
                        <div
                          key={font.name}
                          onClick={() => setSelectedFont(font.name)}
                          style={{
                            padding: "0.8rem", border: selectedFont === font.name ? "2px solid #007bff" : "1px solid #eee",
                            borderRadius: "5px", cursor: "pointer", fontFamily: font.name, fontSize: "1.2rem"
                          }}
                        >
                          {typedName || "Signature Preview"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "draw" && (
                  <div>
                    <canvas
                      ref={drawingCanvasRef}
                      width={450} height={200}
                      style={{ border: "1px solid #ccc", borderRadius: "5px", cursor: "crosshair" }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <button onClick={clearDrawing} style={{ marginTop: "0.5rem", color: "red", background: "none", border: "none", cursor: "pointer" }}>Clear</button>
                  </div>
                )}

                {activeTab === "upload" && (
                  <div style={{ textAlign: "center", padding: "2rem", border: "2px dashed #ccc", borderRadius: "5px" }}>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} ref={imageInputRef} />
                    <button onClick={() => imageInputRef.current?.click()} style={{ padding: "0.8rem 1.5rem", backgroundColor: "#f8f9fa", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer" }}>
                      Upload Signature Image
                    </button>
                    {uploadedImage && <img src={uploadedImage} style={{ marginTop: "1rem", maxWidth: "100%", maxHeight: "100px" }} />}
                  </div>
                )}
              </div>

              {/* Colors */}
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span>Color:</span>
                {colors.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.value)}
                    style={{
                      width: "24px", height: "24px", borderRadius: "50%", backgroundColor: c.value,
                      border: selectedColor === c.value ? "2px solid #ccc" : "none", cursor: "pointer"
                    }}
                  />
                ))}
              </div>

              <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button onClick={() => setShowSignatureModal(false)} style={{ padding: "0.7rem 1.5rem", background: "none", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer" }}>Cancel</button>
                <button onClick={applySignature} style={{ padding: "0.7rem 1.5rem", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Apply</button>
              </div>
            </div>
          </div>
        )}
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
            Sign PDF
          </h1>

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
            {isSigned ? (
              /* Success State */
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                height: "100%", gap: "1.5rem", padding: "2rem 0"
              }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#2e7d32", marginBottom: "0.5rem"
                }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0, textAlign: "center" }}>
                  Signed Successfully!
                </h2>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    onClick={handleDownload}
                    className="download-button"
                    style={{
                      backgroundColor: "#e11d48", color: "white", padding: "1rem 2.5rem",
                      borderRadius: "8px", fontSize: "1.1rem", fontWeight: "600",
                      border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
                      boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)"
                    }}
                  >
                    Download PDF
                  </button>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button onClick={handleShare} style={{ background: "transparent", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}> <TbShare3 /> Share </button>
                  <button onClick={removeFile} style={{ background: "transparent", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}> Sign Another File </button>
                </div>
              </div>
            ) : !pdfFile ? (
              /* Upload State */
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                height: "300px", minHeight: "220px",
              }}>
                <div style={{ marginBottom: "1.5rem" }}><img src="./upload.svg" alt="Upload Icon" /></div>
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      backgroundColor: "white", padding: "0.6rem 1rem",
                      border: "1px solid #e0e0e0", borderRadius: "6px",
                      cursor: "pointer", display: "flex", alignItems: "center",
                      gap: "0.5rem", fontSize: "0.9rem", fontWeight: "500", color: "#333",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <PiFiles size={18} /> Select File <PiCaretDown size={14} style={{ marginLeft: "0.25rem" }} />
                  </button>
                  {isDropdownOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
                      backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, minWidth: "180px", overflow: "hidden",
                    }}>
                      {[{ icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
                      { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
                      { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
                      { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: openDropboxPicker },
                      ].map((item, index) => (
                        <button key={index} onClick={item.onClick} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", width: "100%", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "0.85rem", color: "#333", textAlign: "left" }}>
                          <span style={{ color: "#666", display: "flex", alignItems: "center" }}>{item.icon}</span> {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileChange} style={{ display: "none" }} />
                </div>
              </div>
            ) : (
              /* File Uploaded Overview */
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <button
                    onClick={() => setIsSigningMode(true)}
                    style={{
                      backgroundColor: "#e11d48", color: "white", border: "none", padding: "0.5rem 1rem",
                      borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
                      fontSize: "0.85rem", fontWeight: "500"
                    }}
                  >
                    ✍️ Start Signing
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ backgroundColor: "white", borderRadius: "8px", width: "120px", height: "140px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "relative" }}>
                    <button onClick={removeFile} style={{ position: "absolute", top: "4px", right: "4px", background: "white", border: "none", borderRadius: "50%", width: "25px", height: "25px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "black", zIndex: 10 }}><PiX size={18} /></button>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <PDFThumbnail pdfDocument={pdfDocument} />
                    </div>
                    <span style={{ fontSize: "0.65rem", color: "#666", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 0.5rem" }}>{pdfFile.name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Icons (Visual) */}
            {(!isSigned && !pdfFile) && (
              <div style={{ position: "absolute", right: "1rem", top: "90%", transform: "translateY(-50%)", display: "flex", gap: "0.5rem", opacity: 0.4 }}>
                <PiUploadSimple size={20} /> <PiLink size={20} /> <FaGoogleDrive size={18} /> <FaDropbox size={18} /> <PiClipboard size={20} />
              </div>
            )}
          </div>

          {/* Info & Footer */}
          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>Sign yourself or request electronic signatures from others.</p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {["Create your digital signature in seconds", "Sign PDF files securely", "Works on any device"].map((text, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><PiCheckCircle size={18} style={{ color: "green" }} /> {text}</li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: "3rem", padding: "1.5rem", backgroundColor: "#f0f9ff", border: "1px solid #cce5ff", borderRadius: "10px", fontSize: "0.95rem" }}>
            <strong>Protected. Encrypted.</strong> <p style={{ marginTop: "0.5rem", color: "#555" }}>Your files are encrypted and automatically deleted after 2 hours.</p>
          </div>
        </div>
        <div className="ad-column">
          <VerticalAdRight />
        </div>
      </div>

      {/* URL Input Modal */}
      {showUrlModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowUrlModal(false)}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem" }}>Paste PDF URL</h3>
            <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "6px", marginBottom: "1rem" }} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowUrlModal(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", background: "white", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleUrlSubmit} disabled={isUploading} style={{ padding: "0.5rem 1rem", border: "none", background: "#e11d48", color: "white", borderRadius: "6px", cursor: "pointer" }}>{isUploading ? "Loading..." : "Add PDF"}</button>
            </div>
          </div>
        </div>
      )}

      <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
      <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={signedFileBlob} fileName="signed.pdf" />
      <Footer />
    </div>
  );
}