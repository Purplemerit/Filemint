"use client";

import Navbar from "../components/Navbar";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { TbShare3, TbRotateClockwise, TbRotateClockwise2 } from "react-icons/tb";
import {
  PiFiles,
  PiLink,
  PiClipboard,
  PiCaretDown,
  PiUploadSimple,
  PiCheckCircle,
  PiX,
  PiArrowCounterClockwise,
  PiArrowClockwise
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
import { PDFDocument, degrees } from 'pdf-lib';
import VerticalAdLeft from "../components/Verticaladleft";
import VerticalAdRight from "../components/Verticaladright";
import * as pdfjsLib from "pdfjs-dist";

// PDF.js worker setup
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export default function RotatePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { token } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rotation State
  const [rotation, setRotation] = useState(0); // Current visual rotation (0, 90, 180, 270)
  const [loading, setLoading] = useState(false);

  // Success & Download State
  const [isRotated, setIsRotated] = useState(false);
  const [rotatedBlob, setRotatedBlob] = useState<Blob | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const instructionData = toolData["rotate-pdf"];

  // --- PDF Rendering for Preview ---
  useEffect(() => {
    if (file) {
      const renderPreview = async () => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          const page = await pdf.getPage(1); // Render first page preview

          const viewport = page.getViewport({ scale: 0.8, rotation: rotation }); // Use current rotation
          const canvas = canvasRef.current;
          if (canvas) {
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
              await page.render({
                canvasContext: context,
                viewport: viewport
              }).promise;
            }
          }
        } catch (error) {
          console.error("Preview render error:", error);
        }
      };
      renderPreview();
    }
  }, [file, rotation]);


  // --- Rotation Logic ---
  const rotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const rotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetRotation = () => {
    setRotation(0);
  };

  const processRotation = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Apply the selected rotation to ALL pages relative to their current rotation
      // Note: Rotation in pdf-lib is absolute or additive? 
      // Usually users expect "What I see is what I get". 
      // If we visually rotated the preview by X degrees, we should add X to all pages.

      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotation) % 360));
      });

      const rotatedBytes = await pdfDoc.save();
      const blob = new Blob([rotatedBytes as any], { type: 'application/pdf' });
      setRotatedBlob(blob);
      setIsRotated(true);

    } catch (err) {
      console.error(err);
      alert('Failed to rotate PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!rotatedBlob) return;
    const url = URL.createObjectURL(rotatedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rotated_${file?.name || 'document.pdf'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-download
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRotated && rotatedBlob) {
      timer = setTimeout(handleDownload, 7000);
    }
    return () => clearTimeout(timer);
  }, [isRotated, rotatedBlob]);

  // --- Standard File Handlers (Same as other tools) ---
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) {
      setFile(f);
      setRotation(0);
      setIsRotated(false);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) {
      setFile(f);
      setRotation(0);
      setIsRotated(false);
    }
    setIsDropdownOpen(false);
  };
  const handleFromDevice = () => fileInputRef.current?.click();
  const handlePasteUrl = () => { setShowUrlModal(true); setIsDropdownOpen(false); };
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    try {
      setIsUploading(true);
      const res = await fetch(urlInput);
      const blob = await res.blob();
      if (blob.type !== "application/pdf") return alert("Not a PDF");
      setFile(new File([blob], "downloaded.pdf", { type: "application/pdf" }));
      setRotation(0);
      setIsRotated(false);
      setShowUrlModal(false);
    } catch { alert("Failed"); } finally { setIsUploading(false); }
  };
  const removeFile = () => {
    setFile(null);
    setRotatedBlob(null);
    setIsRotated(false);
    setRotation(0);
  };

  // Pickers
  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({ onFilePicked: (f) => { setFile(f); setRotation(0); setIsRotated(false); setIsDropdownOpen(false); } });
  const { openPicker: openDropboxPicker } = useDropboxPicker({ onFilePicked: (f) => { setFile(f); setRotation(0); setIsRotated(false); setIsDropdownOpen(false); } });


  return (
    <div>
      <Navbar />

      <div style={{
        display: "flex", maxWidth: "1400px", margin: "4rem auto", padding: "0 2rem", gap: "2rem", alignItems: "flex-start"
      }}>
        <VerticalAdLeft />

        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "2rem", textAlign: "left", color: "#1a1a1a", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Rotate PDF
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
            {isRotated ? (
              /* Success State */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem", padding: "2rem 0" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32", marginBottom: "0.5rem" }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0 }}>Rotated Successfully!</h2>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button onClick={handleDownload} className="download-button" style={{ backgroundColor: "#e11d48", color: "white", padding: "1rem 2.5rem", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "600", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)" }}>
                    Download PDF
                  </button>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button onClick={() => setShowShareModal(true)} style={{ background: "transparent", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}> <TbShare3 /> Share </button>
                  <button onClick={removeFile} style={{ background: "transparent", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}> Rotate Another </button>
                </div>
              </div>
            ) : !file ? (
              /* Upload State */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", minHeight: "220px" }}>
                <div style={{ marginBottom: "1.5rem" }}><img src="./upload.svg" alt="Upload Icon" /></div>
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ backgroundColor: "white", padding: "0.6rem 1rem", border: "1px solid #e0e0e0", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: "500", color: "#333", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    <PiFiles size={18} /> Select File <PiCaretDown size={14} style={{ marginLeft: "0.25rem" }} />
                  </button>
                  {isDropdownOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, minWidth: "180px", overflow: "hidden" }}>
                      {[{ icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
                      { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
                      { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
                      { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: openDropboxPicker }
                      ].map((item, i) => (
                        <button key={i} onClick={item.onClick} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", width: "100%", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "0.85rem", color: "#333", textAlign: "left" }}>
                          <span style={{ color: "#666", display: "flex", alignItems: "center" }}>{item.icon}</span> {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileChange} style={{ display: "none" }} />
                </div>
              </div>
            ) : (
              /* Active Rotation UI */
              <div style={{ display: "flex", width: "100%", gap: "2rem", padding: "1rem" }}>
                <style>{`
                       @media (max-width: 768px) {
                           div[style*="gap: 2rem"] { flex-direction: column !important; }
                           .preview-container { width: 100% !important; height: 300px !important; }
                           .controls-container { width: 100% !important; }
                       }
                   `}</style>

                {/* Left: Preview */}
                <div className="preview-container" style={{ flex: 2, display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid #eee", borderRadius: "8px", padding: "1rem", backgroundColor: "#f9f9f9", maxHeight: "500px", overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.7)", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", pointerEvents: "none" }}>
                    Preview (Page 1)
                  </div>
                  <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                  <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
                    {file.name}
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="controls-container" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ backgroundColor: "#e3f2fd", padding: "1rem", borderRadius: "8px", fontSize: "0.9rem", color: "#0d47a1" }}>
                    Click the buttons below to rotate your PDF.
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0 }}>Rotation</h4>
                      <button onClick={resetRotation} style={{ color: "red", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>Reset All</button>
                    </div>

                    <button onClick={rotateRight} style={{ display: "flex", alignItems: "center", padding: "1rem", backgroundColor: "white", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer", gap: "1rem", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "#28a745"} onMouseOut={e => e.currentTarget.style.borderColor = "#ccc"}>
                      <div style={{ width: 40, height: 40, background: "#dc3545", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                        <TbRotateClockwise size={24} />
                      </div>
                      <span style={{ fontWeight: "bold", color: "#333" }}>RIGHT (90°)</span>
                    </button>

                    <button onClick={rotateLeft} style={{ display: "flex", alignItems: "center", padding: "1rem", backgroundColor: "white", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer", gap: "1rem", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "#28a745"} onMouseOut={e => e.currentTarget.style.borderColor = "#ccc"}>
                      <div style={{ width: 40, height: 40, background: "#dc3545", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                        <TbRotateClockwise2 size={24} style={{ transform: "scaleX(-1)" }} />
                      </div>
                      <span style={{ fontWeight: "bold", color: "#333" }}>LEFT (-90°)</span>
                    </button>
                  </div>

                  <div style={{ marginTop: "auto" }}>
                    <button
                      onClick={processRotation}
                      disabled={loading}
                      style={{ width: "100%", padding: "1rem", backgroundColor: "#e11d48", color: "white", border: "none", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "bold", cursor: loading ? "wait" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
                    >
                      {loading ? "Processing..." : "Rotate PDF"} <PiArrowClockwise size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!file && !isRotated && (
              <div style={{ position: "absolute", right: "1rem", top: "90%", transform: "translateY(-50%)", display: "flex", gap: "0.5rem", opacity: 0.4 }}>
                <PiUploadSimple size={20} /> <PiLink size={20} /> <FaGoogleDrive size={18} /> <FaDropbox size={18} /> <PiClipboard size={20} />
              </div>
            )}
          </div>

          {/* Info & Footer */}
          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>Quickly rotate your PDF pages clockwise and download the corrected version.</p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {["Rotate pages by 90°, 180°, or 270°", "Works on any device", "Secure and fast"].map((text, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><PiCheckCircle size={18} style={{ color: "green" }} /> {text}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: "3rem", padding: "1.5rem", backgroundColor: "#f0f9ff", border: "1px solid #cce5ff", borderRadius: "10px", fontSize: "0.95rem" }}>
            <strong>Protected. Encrypted.</strong> <p style={{ marginTop: "0.5rem", color: "#555" }}>Your files are processed in the browser and not stored.</p>
          </div>
        </div>
        <VerticalAdRight />
      </div>

      {/* URL Modal */}
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
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={rotatedBlob} fileName="rotated.pdf" />
      <Footer />
    </div>
  );
}