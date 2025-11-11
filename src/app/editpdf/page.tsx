"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState, useRef } from "react";
import Navbar from "../components/Navbar";
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
  };

  const handleStartEditing = () => {
    if (pdfFile && pdfUrl) {
      setIsEditingMode(true);
    }
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
              color: rgb(color.r, color.g, color.b, 0.3),
            });
            break;
        }
      }

      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited_${pdfFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("PDF edited and downloaded successfully!");
    } catch (error) {
      console.error("Error generating edited PDF:", error);
      alert("Error generating edited PDF. Please try again.");
    }
  };

  const goBack = () => {
    setIsEditingMode(false);
    setAnnotations([]);
    setCurrentAnnotation(null);
    setIsAnnotating(false);
  };

  const toggleAnnotationMode = () => {
    setIsAnnotating(!isAnnotating);
  };

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
          <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", margin: 0 }}>Edit Your PDF</h1>
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
                {annotations.map((annotation, index) => (
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
            <div className="pdf-viewer-container" style={{ position: "relative", height: "800px", border: "2px solid #dee2e6", borderRadius: "10px", overflow: "hidden" }}>
              {/* PDF Viewer */}
              <iframe
                ref={pdfViewerRef}
                src={`${pdfUrl}#view=FitH&toolbar=1&navpanes=0`}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                title="PDF Viewer"
              />
              
              {/* Annotation Overlay */}
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
                {/* Render Annotations */}
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
                    
                    {/* Delete button for annotations */}
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

                {/* Current Drawing Preview */}
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

  return (
    <>
    <Navbar/>
    <style>{`
      @media (max-width: 768px) {
        .upload-container-edit {
          padding: 2rem 1rem !important;
        }
        .file-info-card-edit {
          flex-direction: column !important;
          gap: 1rem;
        }
        .file-info-card-edit > div:first-child {
          width: 100%;
        }
        .logo-container {
          gap: 0.5rem !important;
        }
        .logo-container img {
          height: 25px !important;
        }
      }
      @media (max-width: 480px) {
        .upload-container-edit {
          padding: 1.5rem 0.75rem !important;
        }
        .logo-container {
          flex-direction: column !important;
        }
      }
    `}</style>
   
    <div style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", marginBottom: "2rem" }}>Edit PDF</h1>

      <div
        className="upload-container-edit"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: "2px dashed #007bff",
          backgroundColor: "#f0f8ff",
          borderRadius: "10px",
          padding: "4rem 2rem",
          textAlign: "center",
          marginBottom: "2rem",
        }}
      >
        <div style={{ fontSize: "clamp(2rem, 8vw, 3rem)", color: "#007bff", marginBottom: "1rem" }}>
        </div>
        <p style={{ marginTop: "1rem", marginBottom: "1rem", fontSize: "clamp(0.95rem, 3vw, 1.1rem)" }}>
          Drag and drop a PDF file to edit
        </p>
        <label
          htmlFor="fileInput"
          style={{
            backgroundColor: "white",
            padding: "0.75rem 1.5rem",
            border: "2px solid #007bff",
            borderRadius: "5px",
            cursor: "pointer",
            display: "inline-block",
            color: "#007bff",
            fontWeight: "bold",
            fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
          }}
        >
          Select PDF File
          <input
            id="fileInput"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {pdfFile && (
        <div style={{ marginBottom: "2rem" }}>
          <div className="file-info-card-edit" style={{
            backgroundColor: "#f9f9f9",
            padding: "1rem",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid #e9ecef",
            gap: "1rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", color: "#007bff", marginRight: "0.75rem" }}>
                📄
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: "bold", fontSize: "clamp(0.9rem, 2.5vw, 1rem)", wordBreak: "break-word" }}>
                  {pdfFile.name}
                </div>
                <div style={{ fontSize: "clamp(0.8rem, 2vw, 0.9rem)", color: "#666" }}>
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setPdfFile(null);
                setPdfUrl("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#dc3545",
                cursor: "pointer",
                fontSize: "clamp(1rem, 3vw, 1.2rem)",
                padding: "0.5rem",
                flexShrink: 0,
              }}
            >
              🗑️
            </button>
          </div>

          <button
            onClick={handleStartEditing}
            style={{
              marginTop: "1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
              fontWeight: "bold",
              width: "100%",
            }}
          >
            ✏️ Start Editing
          </button>
        </div>
      )}

      
      <div
          style={{
            marginTop: "3rem",
            padding: "1.5rem",
            backgroundColor: "#f0f9ff",
            border: "1px solid #cce5ff",
            borderRadius: "10px",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
          }}
        >
          <strong>Protected. Encrypted. Automatically Deleted.</strong>
          <p style={{ marginTop: "0.5rem" }}>
            For years, our platform has helped users convert and manage files
            securely—with no file tracking, no storage, and full privacy. Every
            document you upload is encrypted and automatically deleted after 2
            hours. Your data stays yours—always.
          </p>
          <div
            className="logo-container"
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <img
              src="/google-cloud-logo.png"
              alt="Google Cloud"
              style={{ height: "30px" }}
            />
            <img
              src="/onedrive-logo.png"
              alt="OneDrive"
              style={{ height: "30px" }}
            />
            <img src="/dropbox-logo.png" alt="Dropbox" style={{ height: "30px" }} />
            <img src="/norton-logo.png" alt="Norton" style={{ height: "30px" }} />
          </div>
        </div>
      
    </div>
    </>
  );
}