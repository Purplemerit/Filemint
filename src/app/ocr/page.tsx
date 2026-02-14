"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Tesseract from "tesseract.js";
import Image from "next/image";
import { jsPDF } from "jspdf";
import Navbar from "../components/Navbar";
import {
  PiFiles,
  PiLink,
  PiClipboard,
  PiCaretDown,
  PiUploadSimple,
  PiCheckCircle,
  PiX,
  PiTextT,
  PiSpinner
} from "react-icons/pi";
import { TbShare3 } from "react-icons/tb";
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

export default function ImageTextExtractor() {
  const { token } = useAuth();
  const router = useRouter();

  // State
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0); // For progress bar
  const [isDone, setIsDone] = useState(false); // Success state
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  // Upload States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const instructionData = toolData["extract-text-from-image"];

  // --- Handlers ---
  const handleExtractText = async () => {
    if (!image) return;
    setIsProcessing(true);
    setExtractedText("");
    setIsDone(false);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(image, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.floor(m.progress * 100));
          }
        },
      });
      setExtractedText(result.data.text);
      setIsDone(true);
      generatePDFBlob(result.data.text);
    } catch (err) {
      console.error(err);
      alert("Error processing image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDFBlob = (text: string) => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 15, 15);
    const blob = doc.output("blob");
    setPdfBlob(blob);
  };

  const handleDownloadPDF = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted_text.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadText = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted_text.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setImage(null);
    setPreviewUrl(null);
    setExtractedText("");
    setIsDone(false);
    setPdfBlob(null);
    setProgress(0);
  };

  // --- Upload Helpers ---
  const processFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedText("");
      setIsDone(false);
    } else {
      alert("Only image files are supported.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    setIsDropdownOpen(false);
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setIsUploading(true);
    try {
      const res = await fetch(urlInput);
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) return alert("Not an image");
      const f = new File([blob], "downloaded_image", { type: blob.type });
      processFile(f);
      setShowUrlModal(false);
    } catch { alert("Failed to fetch image"); } finally { setIsUploading(false); }
  };

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({ onFilePicked: (f) => { processFile(f); setIsDropdownOpen(false); } });
  const { openPicker: openDropboxPicker } = useDropboxPicker({ onFilePicked: (f) => { processFile(f); setIsDropdownOpen(false); } });


  return (
    <div>
      <Navbar />
      <style>{`
        @media (max-width: 768px) {
            .work-area { flex-direction: column !important; }
            .preview-pane, .result-pane { width: 100% !important; margin-bottom: 1rem; }
        }
      `}</style>

      <div style={{ display: "flex", maxWidth: "1400px", margin: "4rem auto", padding: "0 2rem", gap: "2rem", alignItems: "flex-start" }}>
        <VerticalAdLeft />

        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#1a1a1a", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <PiTextT size={32} style={{ color: "#e11d48" }} /> Extract Text from Image (OCR)
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
            {isDone ? (
              /* Success State */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem", padding: "2rem 0" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32", marginBottom: "0.5rem" }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0 }}>Text Extracted Successfully!</h2>

                <div className="work-area" style={{ display: "flex", width: "100%", gap: "2rem", textAlign: "left", marginTop: "1rem" }}>
                  <div className="result-pane" style={{ flex: 1, background: "white", padding: "1rem", borderRadius: "8px", maxHeight: "300px", overflowY: "auto", border: "1px solid #ddd" }}>
                    <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", margin: 0, fontSize: "0.9rem" }}>{extractedText}</pre>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <button onClick={handleDownloadPDF} style={{ backgroundColor: "#e11d48", color: "white", padding: "0.8rem 1.5rem", borderRadius: "6px", fontWeight: "600", border: "none", cursor: "pointer" }}>Download PDF</button>
                  <button onClick={handleDownloadText} style={{ backgroundColor: "#e11d48", color: "white", padding: "0.8rem 1.5rem", borderRadius: "6px", fontWeight: "600", border: "none", cursor: "pointer" }}>Download Text</button>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                  <button onClick={() => setShowShareModal(true)} style={{ background: "transparent", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}> <TbShare3 /> Share </button>
                  <button onClick={reset} style={{ background: "transparent", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}> Extract Another Image </button>
                </div>
              </div>
            ) : image ? (
              /* Preview & Extract State */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "1rem", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>Preview</h3>
                  <button onClick={reset} style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}>Remove Image</button>
                </div>

                {previewUrl && (
                  <div style={{ maxWidth: "100%", maxHeight: "400px", overflow: "hidden", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1.5rem" }}>
                    <img src={previewUrl} style={{ maxWidth: "100%", height: "auto", display: "block" }} />
                  </div>
                )}

                {!isProcessing ? (
                  <button
                    onClick={handleExtractText}
                    style={{ padding: "1rem 2rem", backgroundColor: "#e11d48", color: "white", border: "none", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    Start Extraction <PiTextT size={20} />
                  </button>
                ) : (
                  <div style={{ textAlign: "center", width: "100%" }}>
                    <div style={{ marginBottom: "0.5rem", fontWeight: "bold", color: "#007bff" }}>
                      Extracting Text... {progress}%
                    </div>
                    <div style={{ width: "100%", height: "10px", backgroundColor: "#eee", borderRadius: "5px", overflow: "hidden" }}>
                      <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "#e11d48", transition: "width 0.3s" }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Upload State */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", minHeight: "220px" }}>
                <div style={{ marginBottom: "1.5rem" }}><img src="./upload.svg" alt="Upload Icon" /></div>
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ backgroundColor: "white", padding: "0.6rem 1rem", border: "1px solid #e0e0e0", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: "500", color: "#333", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    <PiFiles size={18} /> Select Image <PiCaretDown size={14} style={{ marginLeft: "0.25rem" }} />
                  </button>
                  {isDropdownOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, minWidth: "180px", overflow: "hidden" }}>
                      {[{ icon: <PiUploadSimple size={18} />, label: "From Device", onClick: () => fileInputRef.current?.click() },
                      { icon: <PiLink size={18} />, label: "Paste URL", onClick: () => { setShowUrlModal(true); setIsDropdownOpen(false); } },
                      { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
                      { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: openDropboxPicker }
                      ].map((item, i) => (
                        <button key={i} onClick={item.onClick} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", width: "100%", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "0.85rem", color: "#333", textAlign: "left" }}>
                          <span style={{ color: "#666", display: "flex", alignItems: "center" }}>{item.icon}</span> {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                </div>
              </div>
            )}
          </div>

          {/* Info & Footer */}
          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}> Extract text from images instantly.</p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {["Supports JPG, PNG, WEBP", "High accuracy OCR", "Download as Text or PDF"].map((text, i) => (
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
            <h3 style={{ marginBottom: "1rem" }}>Paste Image URL</h3>
            <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "6px", marginBottom: "1rem" }} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowUrlModal(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", background: "white", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleUrlSubmit} disabled={isUploading} style={{ padding: "0.5rem 1rem", border: "none", background: "#e11d48", color: "white", borderRadius: "6px", cursor: "pointer" }}>{isUploading ? "Loading..." : "Add Image"}</button>
            </div>
          </div>
        </div>
      )}

      <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
      <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={pdfBlob} fileName="extracted.pdf" />
      <Footer />
    </div>
  );
}