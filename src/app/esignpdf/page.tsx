"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";

import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
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
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
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

  const loadPdf = async (url: string) => {
    try {
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
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Error loading PDF. Please try again.");
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
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";

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
        const { height: pageHeight } = page.getSize();

        const pdfX = signature.x;
        const pdfY = pageHeight - signature.y - signature.height;

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
              width: signature.width,
              height: signature.height,
            });
          } catch (imgError) {
            console.error("Error adding image signature:", imgError);
          }
        }
      }

      const pdfBytes = await pdfDocLib.save();

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
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
        
        <div
          style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}
        >
          <div
            className="header-controls-sign"
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
            <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", margin: 0 }}>Sign Your PDF</h1>
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
                  ref={fileInputRef}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
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
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "0.5rem",
                    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                  }}
                >
                  {Math.round(scale * 100)}%
                </div>
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "5px",
                  fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
                }}
              >
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
                {/* PDF Pages */}
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
                    <div
                      style={{
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        backgroundColor: "white",
                        position: "relative",
                        maxWidth: "100%",
                      }}
                    >
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

                {/* Signatures Overlay */}
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
                        <span
                          style={{
                            fontFamily: "cursive",
                            fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                            color: "#007bff",
                            textAlign: "center",
                          }}
                        >
                          {signature.content}
                        </span>
                      ) : (
                        <img
                          src={signature.content}
                          alt="Signature"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                        />
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

                {/* Drop Zone Indicator */}
                {draggedSignature && (
                  <div
                    style={{
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
                    }}
                  >
                    Drop signature here
                  </div>
                )}

                {canvasRefs.current.length === 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      fontSize: "clamp(1rem, 3vw, 1.2rem)",
                      color: "#666",
                    }}
                  >
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

  return (
    <div>
      <Navbar />
      <style>{`
        @media (max-width: 768px) {
          .upload-container-sign {
            padding: 2rem 1rem !important;
          }
          .file-info-sign {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.5rem;
          }
        }
        @media (max-width: 480px) {
          .upload-container-sign {
            padding: 1.5rem 0.75rem !important;
          }
        }
      `}</style>
      <div
        style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 1rem" }}
      >
        <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", marginBottom: "2rem" }}>E Sign PDF</h1>

        <div
          className="upload-container-sign"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: "2px dashed #ADD8E6",
            backgroundColor: "#f0f8ff",
            borderRadius: "10px",
            padding: "4rem 2rem",
            textAlign: "center",
            marginBottom: "2rem",
            position: "relative",
          }}
        >
          <i
            className="fas fa-file-signature"
            style={{ fontSize: "clamp(2rem, 8vw, 3rem)", color: "#888" }}
          ></i>
          <p style={{ marginTop: "1rem", marginBottom: "1rem", fontSize: "clamp(0.95rem, 3vw, 1.1rem)" }}>
            Drag and drop a PDF file to sign
          </p>
          <label
            htmlFor="fileInput"
            style={{
              backgroundColor: "white",
              padding: "0.5rem 1rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              cursor: "pointer",
              display: "inline-block",
              fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            }}
          >
            Select PDF
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
            <div
              className="file-info-sign"
              style={{
                backgroundColor: "#f9f9f9",
                padding: "0.75rem 1rem",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)", wordBreak: "break-word" }}>
                <i
                  className="fas fa-file-pdf"
                  style={{ color: "#c00", marginRight: "0.5rem" }}
                ></i>
                {pdfFile.name}
              </span>
              <button
                onClick={() => {
                  setPdfFile(null);
                  setPdfUrl("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#c00",
                  cursor: "pointer",
                  fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                  flexShrink: 0,
                }}
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>

            <button
              onClick={handleSign}
              style={{
                marginTop: "1rem",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                padding: "0.6rem 1.2rem",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                width: "100%",
              }}
            >
              <i
                className="fas fa-pen-nib"
                style={{ marginRight: "0.5rem" }}
              ></i>
              Sign PDF
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
          <strong>Secure. Easy. Digital Signing.</strong>
          <p style={{ marginTop: "0.5rem" }}>
            Upload a PDF and add your digital signature with complete security
            and privacy. Signing documents has never been easier.
          </p>
        </div>
      </div>
    </div>
  );
}