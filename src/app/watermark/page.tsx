"use client";

import Navbar from "../components/Navbar";
import { PDFDocument, rgb, degrees } from "pdf-lib";
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
  PiDropHalfBottom,
  PiGear
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

export default function PdfWatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [watermark, setWatermark] = useState<string>("Confidential");
  const [fontSize, setFontSize] = useState<number>(40);
  const [opacity, setOpacity] = useState<number>(0.5);
  const [rotation, setRotation] = useState<number>(-45);
  const [isProcessing, setIsProcessing] = useState(false);

  // Success / Download State
  const [isApplied, setIsApplied] = useState(false);
  const [watermarkedBlob, setWatermarkedBlob] = useState<Blob | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Upload States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { token } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const instructionData = toolData["add-watermark"];

  // --- Watermark Logic ---
  const applyWatermark = async () => {
    if (!file || !watermark.trim()) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(watermark, {
          x: width / 2 - watermark.length * (fontSize / 3), // Rough center approximation
          y: height / 2,
          size: fontSize,
          rotate: degrees(rotation),
          color: rgb(0.5, 0.5, 0.5), // Grey
          opacity: opacity,
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      setWatermarkedBlob(blob);
      setIsApplied(true);
    } catch (err) {
      console.error(err);
      alert("Failed to apply watermark.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!watermarkedBlob) return;
    const url = URL.createObjectURL(watermarkedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watermarked_${file?.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-download
  useEffect(() => {
    let tm: NodeJS.Timeout;
    if (isApplied && watermarkedBlob) {
      tm = setTimeout(handleDownload, 7000);
    }
    return () => clearTimeout(tm);
  }, [isApplied, watermarkedBlob]);

  const reset = () => {
    setFile(null);
    setIsApplied(false);
    setWatermarkedBlob(null);
    setWatermark("Confidential");
    setFontSize(40);
  };

  // --- Standard Handlers ---
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) setFile(f);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) setFile(f);
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
      setShowUrlModal(false);
    } catch { alert("Failed"); } finally { setIsUploading(false); }
  };

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({ onFilePicked: (f) => { setFile(f); setIsDropdownOpen(false); } });
  const { openPicker: openDropboxPicker } = useDropboxPicker({ onFilePicked: (f) => { setFile(f); setIsDropdownOpen(false); } });


  return (
    <div>
      <Navbar />
      <style>{`
        @media (max-width: 768px) {
            .config-container { flex-direction: column !important; }
            .preview-box { width: 100% !important; margin-top: 1rem; }
        }
      `}</style>

      <div style={{ display: "flex", maxWidth: "1400px", margin: "4rem auto", padding: "0 2rem", gap: "2rem", alignItems: "flex-start" }}>
        <VerticalAdLeft />

        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#1a1a1a", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <PiDropHalfBottom size={32} style={{ color: "#e11d48" }} /> Add Watermark
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
            {isApplied ? (
              /* Success State */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem", padding: "2rem 0" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32", marginBottom: "0.5rem" }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0 }}>Watermark Added!</h2>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button onClick={handleDownload} className="download-button" style={{ backgroundColor: "#e11d48", color: "white", padding: "1rem 2.5rem", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "600", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)" }}>
                    Download PDF
                  </button>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button onClick={() => setShowShareModal(true)} style={{ background: "transparent", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}> <TbShare3 /> Share </button>
                  <button onClick={reset} style={{ background: "transparent", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}> Edit Another File </button>
                </div>
              </div>
            ) : file ? (
              /* Configuration State */
              <div className="config-container" style={{ display: "flex", gap: "2rem", textAlign: "left", width: "100%" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}><PiGear /> Settings</h3>
                    <button onClick={reset} style={{ background: "none", border: "none", color: "red", cursor: "pointer", fontSize: "0.9rem" }}>Remove File</button>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Text</label>
                    <input type="text" value={watermark} onChange={e => setWatermark(e.target.value)} style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc" }} />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Font Size ({fontSize}px)</label>
                    <input type="range" min="10" max="100" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} style={{ width: "100%" }} />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Opacity ({Math.round(opacity * 100)}%)</label>
                    <input type="range" min="0" max="1" step="0.1" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} style={{ width: "100%" }} />
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Rotation ({rotation}°)</label>
                    <input type="range" min="-90" max="90" value={rotation} onChange={e => setRotation(parseInt(e.target.value))} style={{ width: "100%" }} />
                  </div>

                  <button
                    onClick={applyWatermark}
                    disabled={isProcessing}
                    style={{ width: "100%", padding: "0.8rem", backgroundColor: "#e11d48", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.7 : 1 }}
                  >
                    {isProcessing ? "Processing..." : "Apply Watermark"}
                  </button>
                </div>

                {/* Visual Preview Box */}
                <div className="preview-box" style={{ flex: 1, backgroundColor: "#f9f9f9", border: "1px dashed #ccc", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 10, left: 10, color: "#999", fontSize: "0.8rem" }}>Text Preview</div>
                  <div style={{
                    fontSize: `${fontSize}px`,
                    opacity: opacity,
                    transform: `rotate(${rotation}deg)`,
                    color: "rgba(0,0,0,0.5)",
                    fontWeight: "bold",
                    textAlign: "center",
                    wordBreak: "break-all",
                    maxWidth: "80%"
                  }}>
                    {watermark}
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Info & Footer */}
          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>Securely watermark your PDF documents.</p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {["Customize text, size, opacity", "Instant preview", "Process entirely in browser"].map((text, i) => (
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
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={watermarkedBlob} fileName="watermarked.pdf" />
      <Footer />
    </div>
  );
}