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
export default function ESignPdfPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [signatures, setSignatures] = useState<
    Array<{
      id: string;
      type: "text" | "image";
      content: string;
      x: number;
      y: number;
      width: number;
      height: number;
      page: number;
    }>
  >([]);
  const [draggedSignature, setDraggedSignature] = useState<{
    type: "text" | "image";
    content: string;
  } | null>(null);
  const [textSignature, setTextSignature] = useState("");
  const [imageSignature, setImageSignature] = useState<string>("");
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [scale, setScale] = useState(1.5);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [signedFileBlob, setSignedFileBlob] = useState<Blob | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const instructionData = toolData["esignpdf"];

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
    setSignedFileBlob(null);
  };

  const handleShare = () => {
    if (!signedFileBlob) {
      alert("Please sign and save the PDF first before sharing");
      return;
    }
    setShowShareModal(true);
  };

  const loadPdf = async (url: string) => {
    try {
      setPdfLoaded(false);
      // @ts-ignore
      const loadingTask = window.pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);

      const canvases: HTMLCanvasElement[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        canvases.push(canvas);
      }
      canvasRefs.current = canvases;
      setPdfLoaded(true); // Trigger re-render to display canvases
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Error loading PDF. Please try again.");
      setPdfLoaded(false);
    }
  };

  const handleSign = async () => {
    if (pdfFile && pdfUrl) {
      setIsSigningMode(true);
      await loadPdf(pdfUrl);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSignature(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragStart = (type: "text" | "image", content: string) => {
    setDraggedSignature({ type, content });
  };

  const getPageFromCoordinates = (y: number): number => {
    if (!containerRef.current || canvasRefs.current.length === 0) return 1;

    let accumulatedHeight = 0;
    for (let i = 0; i < canvasRefs.current.length; i++) {
      const pageHeight = canvasRefs.current[i].height + 20;
      if (y <= accumulatedHeight + pageHeight) {
        return i + 1;
      }
      accumulatedHeight += pageHeight;
    }
    return canvasRefs.current.length;
  };

  const getRelativeCoordinates = (x: number, y: number, page: number) => {
    if (!containerRef.current || canvasRefs.current.length === 0)
      return { x, y };

    let accumulatedHeight = 0;
    for (let i = 0; i < page - 1; i++) {
      accumulatedHeight += canvasRefs.current[i].height + 20;
    }

    return {
      x: x,
      y: y - accumulatedHeight,
    };
  };

  const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedSignature || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + containerRef.current.scrollTop;

    const page = getPageFromCoordinates(y);
    const relativeCoords = getRelativeCoordinates(x, y, page);

    const newSignature = {
      id: Date.now().toString(),
      type: draggedSignature.type,
      content: draggedSignature.content,
      x: relativeCoords.x,
      y: relativeCoords.y,
      width: draggedSignature.type === "text" ? 200 : 150,
      height: draggedSignature.type === "text" ? 40 : 60,
      page: page,
    };

    setSignatures([...signatures, newSignature]);
    setDraggedSignature(null);
  };

  const removeSignature = (id: string) => {
    setSignatures(signatures.filter((sig) => sig.id !== id));
  };

  const downloadSignedPdf = async () => {
    if (!pdfDoc || signatures.length === 0) {
      alert("Please add at least one signature before downloading.");
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
      const { PDFDocument, rgb } = window.PDFLib;

      const arrayBuffer = await pdfFile!.arrayBuffer();
      const pdfDocLib = await PDFDocument.load(arrayBuffer);
      const pages = pdfDocLib.getPages();

      for (const signature of signatures) {
        const page = pages[signature.page - 1];
        const { height: pageHeight, width: pageWidth } = page.getSize();

        // Convert canvas coordinates to PDF coordinates
        // Signatures are positioned on scaled canvas, need to convert back to actual PDF coordinates
        const pdfX = signature.x / scale;
        const pdfY = pageHeight - (signature.y / scale) - (signature.height / scale);

        if (signature.type === "text") {
          page.drawText(signature.content, {
            x: pdfX,
            y: pdfY,
            size: 20,
            color: rgb(0, 0, 1),
          });
        } else {
          try {
            const imageBytes = await fetch(signature.content).then((res) =>
              res.arrayBuffer()
            );
            const image = signature.content.includes("data:image/png")
              ? await pdfDocLib.embedPng(imageBytes)
              : await pdfDocLib.embedJpg(imageBytes);

            page.drawImage(image, {
              x: pdfX,
              y: pdfY,
              width: signature.width / scale,
              height: signature.height / scale,
            });
          } catch (imgError) {
            console.error("Error adding image signature:", imgError);
          }
        }
      }

      const pdfBytes = await pdfDocLib.save();

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setSignedFileBlob(blob);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed_${pdfFile!.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("PDF signed and downloaded successfully!");
    } catch (error) {
      console.error("Error generating signed PDF:", error);
      alert("Error generating signed PDF. Please try again.");
    }
  };

  const goBack = () => {
    setIsSigningMode(false);
    setSignatures([]);
    setTextSignature("");
    setImageSignature("");
    setPdfDoc(null);
    setPdfLoaded(false);
    canvasRefs.current = [];
  };

  const getSignaturePosition = (signature: any) => {
    let accumulatedHeight = 0;
    for (let i = 0; i < signature.page - 1; i++) {
      if (canvasRefs.current[i]) {
        accumulatedHeight += canvasRefs.current[i].height + 20;
      }
    }
    return {
      left: signature.x,
      top: signature.y + accumulatedHeight,
    };
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
    { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: openDropboxPicker },
    { icon: <PiClipboard size={18} />, label: "From Clipboard", onClick: handleFromClipboard },
  ];

  // Signing Mode UI
  if (isSigningMode) {
    return (
      <div>
        <style>{`
          @media (max-width: 768px) {
            .header-controls-sign {
              flex-direction: column !important;
              gap: 1rem !important;
            }
            .header-controls-sign > * {
              width: 100% !important;
            }
            .main-container-sign {
              flex-direction: column !important;
            }
            .signature-panel {
              width: 100% !important;
              position: static !important;
              margin-bottom: 1.5rem;
            }
            .zoom-controls {
              flex-direction: row !important;
            }
            .pdf-viewer-sign {
              height: 500px !important;
            }
          }
          @media (max-width: 480px) {
            .signature-panel {
              padding: 1rem !important;
            }
            .zoom-controls button {
              font-size: 0.85rem !important;
              padding: 0.4rem !important;
            }
            .pdf-viewer-sign {
              height: 400px !important;
              padding: 10px !important;
            }
          }
        `}</style>
        
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
          <div
            className="header-controls-sign"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "3rem 0rem 3rem 0rem",
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
            <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", margin: 0 }}>Sign Your PDF</h1>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={downloadSignedPdf}
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

          <div className="main-container-sign" style={{ display: "flex", gap: "2rem" }}>
            {/* Signature Tools Panel */}
            <div
              className="signature-panel"
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
                Signature Tools
              </h3>

              {/* Text Signature */}
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Text Signature</h4>
                <input
                  type="text"
                  placeholder="Type your signature"
                  value={textSignature}
                  onChange={(e) => setTextSignature(e.target.value)}
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
                {textSignature && (
                  <div
                    draggable
                    onDragStart={() => handleDragStart("text", textSignature)}
                    style={{
                      backgroundColor: "white",
                      border: "2px solid #007bff",
                      borderRadius: "5px",
                      padding: "0.5rem",
                      textAlign: "center",
                      cursor: "grab",
                      fontFamily: "cursive",
                      fontSize: "clamp(1rem, 3vw, 1.2rem)",
                      color: "#007bff",
                    }}
                  >
                    {textSignature}
                  </div>
                )}
              </div>

              {/* Image Signature */}
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Image Signature</h4>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={signatureFileInputRef}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => signatureFileInputRef.current?.click()}
                  style={{
                    width: "100%",
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    padding: "0.75rem",
                    borderRadius: "5px",
                    cursor: "pointer",
                    marginBottom: "0.5rem",
                    fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
                  }}
                >
                  Upload Signature Image
                </button>
                {imageSignature && (
                  <div
                    draggable
                    onDragStart={() => handleDragStart("image", imageSignature)}
                    style={{
                      backgroundColor: "white",
                      border: "2px solid #28a745",
                      borderRadius: "5px",
                      padding: "0.5rem",
                      textAlign: "center",
                      cursor: "grab",
                    }}
                  >
                    <img
                      src={imageSignature}
                      alt="Signature"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "60px",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Zoom Controls */}
              <div>
                <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Zoom</h4>
                <div className="zoom-controls" style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setScale(Math.max(0.5, scale - 0.25))}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      padding: "0.5rem",
                      borderRadius: "3px",
                      cursor: "pointer",
                      flex: 1,
                      fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                    }}
                  >
                    Zoom Out
                  </button>
                  <button
                    onClick={() => setScale(Math.min(3, scale + 0.25))}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      padding: "0.5rem",
                      borderRadius: "3px",
                      cursor: "pointer",
                      flex: 1,
                      fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                    }}
                  >
                    Zoom In
                  </button>
                </div>
                <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}>
                  {Math.round(scale * 100)}%
                </div>
              </div>

              <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#e3f2fd", borderRadius: "5px", fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}>
                <strong>How to use:</strong>
                <br />
                1. Create your signature above
                <br />
                2. Drag it onto the PDF
                <br />
                3. Position as needed
                <br />
                4. Download when done
              </div>
            </div>

            {/* PDF Viewer */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                ref={containerRef}
                onDrop={handlePdfDrop}
                onDragOver={(e) => e.preventDefault()}
                className="pdf-viewer-sign"
                style={{
                  position: "relative",
                  border: "2px solid #dee2e6",
                  borderRadius: "10px",
                  backgroundColor: "#f5f5f5",
                  height: "800px",
                  overflow: "auto",
                  padding: "20px",
                }}
              >
                {canvasRefs.current.map((canvas, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "20px",
                      display: "flex",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <div style={{ boxShadow: "0 4px 8px rgba(0,0,0,0.1)", backgroundColor: "white", position: "relative", maxWidth: "100%" }}>
                      <canvas
                        ref={(el) => {
                          if (el && canvas) {
                            el.width = canvas.width;
                            el.height = canvas.height;
                            const ctx = el.getContext("2d");
                            if (ctx) {
                              ctx.drawImage(canvas, 0, 0);
                            }
                          }
                        }}
                        style={{ display: "block", maxWidth: "100%", height: "auto" }}
                      />
                    </div>
                  </div>
                ))}

                {signatures.map((signature) => {
                  const position = getSignaturePosition(signature);
                  return (
                    <div
                      key={signature.id}
                      style={{
                        position: "absolute",
                        left: position.left,
                        top: position.top,
                        width: signature.width,
                        height: signature.height,
                        border: "2px dashed #007bff",
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "3px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "move",
                        zIndex: 10,
                      }}
                    >
                      {signature.type === "text" ? (
                        <span style={{ fontFamily: "cursive", fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", color: "#007bff", textAlign: "center" }}>
                          {signature.content}
                        </span>
                      ) : (
                        <img src={signature.content} alt="Signature" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      )}
                      <button
                        onClick={() => removeSignature(signature.id)}
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                {draggedSignature && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 123, 255, 0.1)",
                    border: "3px dashed #007bff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 5,
                    fontSize: "clamp(1rem, 3vw, 1.2rem)",
                    color: "#007bff",
                    fontWeight: "bold",
                  }}>
                    Drop signature here
                  </div>
                )}

                {canvasRefs.current.length === 0 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "clamp(1rem, 3vw, 1.2rem)", color: "#666" }}>
                    Loading PDF...
                  </div>
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
          E-Sign PDF
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
                  onClick={handleSign}
                  style={{
                    backgroundColor: "#28a745",
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
                  ✍️ Sign PDF
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
            Add your digital signature to PDF documents securely and easily.
          </p>
          <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
            {[
              "Type or upload your signature image",
              "Drag and drop signatures onto any page",
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
        fileBlob={signedFileBlob}
        fileName="signed.pdf"
      />
      <Footer />
    </div>
  );
}