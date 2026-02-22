"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  PiFiles,
  PiLink,
  PiCaretDown,
  PiUploadSimple,
  PiCaretLeft,
  PiCaretRight,
  PiMagnifyingGlassPlus,
  PiMagnifyingGlassMinus,
  PiX,
} from "react-icons/pi";
import { FaGoogleDrive, FaDropbox } from "react-icons/fa";
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

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export default function ComparePdfPage() {
  const { token } = useAuth();
  const router = useRouter();

  // File States
  const [pdf1, setPdf1] = useState<File | null>(null);
  const [pdf2, setPdf2] = useState<File | null>(null);

  // Viewer States — INDIVIDUAL per PDF
  const [isComparing, setIsComparing] = useState(false);
  const [currentPage1, setCurrentPage1] = useState(1);
  const [currentPage2, setCurrentPage2] = useState(1);
  const [totalPages1, setTotalPages1] = useState(0);
  const [totalPages2, setTotalPages2] = useState(0);
  const [scale1, setScale1] = useState(1.0);
  const [scale2, setScale2] = useState(1.0);

  // Canvas Refs
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);

  // Upload UI States
  const [isDropdown1Open, setIsDropdown1Open] = useState(false);
  const [isDropdown2Open, setIsDropdown2Open] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [activeUpload, setActiveUpload] = useState<1 | 2>(1);
  const [isUploading, setIsUploading] = useState(false);
  const dropdown1Ref = useRef<HTMLDivElement>(null);
  const dropdown2Ref = useRef<HTMLDivElement>(null);
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  const instructionData = toolData["compare-pdf"];

  // --- Rendering Logic ---
  const renderPage = async (
    file: File,
    pageNum: number,
    canvas: HTMLCanvasElement,
    scale: number
  ) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      if (pageNum > pdf.numPages) return;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
      }
    } catch (error) {
      console.error("Render error:", error);
    }
  };

  useEffect(() => {
    if (isComparing && pdf1 && canvas1Ref.current) {
      renderPage(pdf1, currentPage1, canvas1Ref.current, scale1);
    }
  }, [isComparing, currentPage1, scale1, pdf1]);

  useEffect(() => {
    if (isComparing && pdf2 && canvas2Ref.current) {
      renderPage(pdf2, currentPage2, canvas2Ref.current, scale2);
    }
  }, [isComparing, currentPage2, scale2, pdf2]);

  // Init page counts
  useEffect(() => {
    if (pdf1) {
      pdf1
        .arrayBuffer()
        .then((b) => pdfjsLib.getDocument(b).promise)
        .then((p) => setTotalPages1(p.numPages));
    }
    if (pdf2) {
      pdf2
        .arrayBuffer()
        .then((b) => pdfjsLib.getDocument(b).promise)
        .then((p) => setTotalPages2(p.numPages));
    }
  }, [pdf1, pdf2]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdown1Ref.current && !dropdown1Ref.current.contains(e.target as Node))
        setIsDropdown1Open(false);
      if (dropdown2Ref.current && !dropdown2Ref.current.contains(e.target as Node))
        setIsDropdown2Open(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const startComparison = () => {
    if (pdf1 && pdf2) {
      setIsComparing(true);
      setCurrentPage1(1);
      setCurrentPage2(1);
    }
  };

  const reset = () => {
    setIsComparing(false);
    setPdf1(null);
    setPdf2(null);
    setCurrentPage1(1);
    setCurrentPage2(1);
    setScale1(1.0);
    setScale2(1.0);
  };

  // --- Upload Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, num: 1 | 2) => {
    const f = e.target.files?.[0];
    if (f && (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) {
      num === 1 ? setPdf1(f) : setPdf2(f);
    }
    num === 1 ? setIsDropdown1Open(false) : setIsDropdown2Open(false);
  };

  const handleDrop = (e: React.DragEvent, num: 1 | 2) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) {
      num === 1 ? setPdf1(f) : setPdf2(f);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setIsUploading(true);
    try {
      const res = await fetch(urlInput);
      const blob = await res.blob();
      if (blob.type !== "application/pdf") return alert("Not a PDF");
      const f = new File([blob], "downloaded.pdf", { type: "application/pdf" });
      activeUpload === 1 ? setPdf1(f) : setPdf2(f);
      setShowUrlModal(false);
      setUrlInput("");
    } catch (err) {
      alert("Failed to fetch PDF");
    }
    setIsUploading(false);
  };

  // Pickers
  const { openPicker: openGD1 } = useGoogleDrivePicker({
    onFilePicked: (f) => { setPdf1(f); setIsDropdown1Open(false); },
  });
  const { openPicker: openGD2 } = useGoogleDrivePicker({
    onFilePicked: (f) => { setPdf2(f); setIsDropdown2Open(false); },
  });
  const { openPicker: openDB1 } = useDropboxPicker({
    onFilePicked: (f) => { setPdf1(f); setIsDropdown1Open(false); },
  });
  const { openPicker: openDB2 } = useDropboxPicker({
    onFilePicked: (f) => { setPdf2(f); setIsDropdown2Open(false); },
  });

  // --- Per-PDF Navigation Controls Component ---
  const PdfNavBar = ({
    label,
    file,
    currentPage,
    totalPages,
    scale,
    onPrev,
    onNext,
    onZoomIn,
    onZoomOut,
  }: {
    label: string;
    file: File | null;
    currentPage: number;
    totalPages: number;
    scale: number;
    onPrev: () => void;
    onNext: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
  }) => (
    <div style={{
      backgroundColor: "#1e1e2e",
      padding: "0.6rem 1rem",
      borderRadius: "8px 8px 0 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem",
      flexWrap: "wrap",
    }}>
      {/* Label + filename */}
      <div style={{ color: "white", fontSize: "0.85rem", fontWeight: 600, minWidth: 0 }}>
        <span style={{ opacity: 0.6, marginRight: "0.4rem" }}>{label}</span>
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "140px",
          display: "inline-block",
          verticalAlign: "bottom",
        }}>
          {file?.name || "—"}
        </span>
      </div>

      {/* Page navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <button
          onClick={onPrev}
          disabled={currentPage <= 1}
          style={{
            background: currentPage <= 1 ? "#444" : "#e11d48",
            border: "none", color: "white", borderRadius: "4px",
            width: 28, height: 28, cursor: currentPage <= 1 ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <PiCaretLeft size={14} />
        </button>
        <span style={{ color: "white", fontSize: "0.8rem", minWidth: "60px", textAlign: "center" }}>
          {currentPage} / {totalPages || "?"}
        </span>
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages}
          style={{
            background: currentPage >= totalPages ? "#444" : "#e11d48",
            border: "none", color: "white", borderRadius: "4px",
            width: 28, height: 28, cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <PiCaretRight size={14} />
        </button>
      </div>

      {/* Zoom controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <button onClick={onZoomOut} style={{ background: "transparent", border: "1px solid #555", color: "white", borderRadius: "4px", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PiMagnifyingGlassMinus size={14} />
        </button>
        <span style={{ color: "white", fontSize: "0.75rem", minWidth: "36px", textAlign: "center" }}>
          {Math.round(scale * 100)}%
        </span>
        <button onClick={onZoomIn} style={{ background: "transparent", border: "1px solid #555", color: "white", borderRadius: "4px", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PiMagnifyingGlassPlus size={14} />
        </button>
      </div>
    </div>
  );

  // --- Upload Box ---
  const renderUploadBox = (num: 1 | 2) => {
    const file = num === 1 ? pdf1 : pdf2;
    const isOpen = num === 1 ? isDropdown1Open : isDropdown2Open;
    const setOpen = num === 1 ? setIsDropdown1Open : setIsDropdown2Open;
    const ref = num === 1 ? dropdown1Ref : dropdown2Ref;
    const inputRef = num === 1 ? fileInput1Ref : fileInput2Ref;
    const openGD = num === 1 ? openGD1 : openGD2;
    const openDB = num === 1 ? openDB1 : openDB2;

    return (
      <div
        onDrop={(e) => handleDrop(e, num)}
        onDragOver={(e) => e.preventDefault()}
        style={{
          flex: 1,
          minWidth: "280px",
          border: "2px dashed #d1bfff",
          borderRadius: "12px",
          padding: "2rem 1rem",
          textAlign: "center",
          backgroundColor: "rgb(243, 230, 255)",
          position: "relative",
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: "1rem", color: "#333", fontSize: "1rem" }}>
          PDF {num}
        </p>

        {file ? (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.75rem",
            background: "white", padding: "0.75rem 1rem",
            borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            maxWidth: "100%",
          }}>
            <img src="./pdf.svg" style={{ width: 32, height: 40, flexShrink: 0 }} alt="pdf" />
            <span style={{
              fontSize: "0.8rem", color: "#333",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px",
            }}>
              {file.name}
            </span>
            <button
              onClick={() => num === 1 ? setPdf1(null) : setPdf2(null)}
              style={{
                background: "#fee2e2", border: "none", color: "#e11d48",
                borderRadius: "50%", width: 24, height: 24, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <PiX size={14} />
            </button>
          </div>
        ) : (
          <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button
              onClick={() => setOpen(!isOpen)}
              style={{
                padding: "0.7rem 1.4rem", background: "#e11d48", color: "white",
                border: "none", borderRadius: "8px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500,
              }}
            >
              <PiUploadSimple size={18} /> Select PDF <PiCaretDown size={14} />
            </button>
            {isOpen && (
              <div style={{
                position: "absolute", top: "110%", left: "50%", transform: "translateX(-50%)",
                width: "180px", background: "white", boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
                borderRadius: "8px", overflow: "hidden", zIndex: 100, border: "1px solid #eee",
              }}>
                {[
                  { label: "From Device", action: () => inputRef.current?.click() },
                  { label: "Paste URL", action: () => { setActiveUpload(num); setShowUrlModal(true); setOpen(false); } },
                  { label: "Google Drive", action: openGD },
                  { label: "Dropbox", action: openDB },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      width: "100%", padding: "0.7rem 1rem", border: "none",
                      background: "white", cursor: "pointer", fontSize: "0.85rem",
                      color: "#333", textAlign: "left", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => handleFileChange(e, num)}
              style={{ display: "none" }}
            />
          </div>
        )}
        <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "1rem" }}>
          or drag & drop a PDF here
        </p>
      </div>
    );
  };

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .compare-viewer-grid { flex-direction: column !important; }
          .compare-pdf-panel { min-width: 0 !important; }
          .compare-upload-grid { flex-direction: column !important; }
          .compare-canvas { max-width: 100% !important; height: auto !important; }
        }
        .compare-canvas-wrap { overflow: auto; background: #e8e8e8; border-radius: 0 0 8px 8px; max-height: 75vh; display: flex; align-items: flex-start; justify-content: center; padding: 1rem; }
        .compare-pdf-panel { flex: 1; min-width: 280px; display: flex; flex-direction: column; }
      `}</style>

      <Navbar />

      <div style={{
        display: "flex",
        maxWidth: "1400px",
        margin: "3rem auto",
        padding: "0 1rem",
        gap: "1.5rem",
        alignItems: "flex-start",
      }}>
        <VerticalAdLeft />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "1.5rem", color: "#1a1a1a" }}>
            Compare PDF Files
          </h1>

          {!isComparing ? (
            /* ── Upload Phase ── */
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="compare-upload-grid" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                {renderUploadBox(1)}
                {renderUploadBox(2)}
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  onClick={startComparison}
                  disabled={!pdf1 || !pdf2}
                  style={{
                    padding: "0.85rem 3rem",
                    fontSize: "1.1rem",
                    backgroundColor: pdf1 && pdf2 ? "#e11d48" : "#ccc",
                    color: "white",
                    border: "none",
                    borderRadius: "50px",
                    cursor: pdf1 && pdf2 ? "pointer" : "not-allowed",
                    fontWeight: 600,
                    boxShadow: pdf1 && pdf2 ? "0 4px 14px rgba(225,29,72,0.4)" : "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { if (pdf1 && pdf2) e.currentTarget.style.transform = "scale(1.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  Compare PDFs →
                </button>
                {(!pdf1 || !pdf2) && (
                  <p style={{ color: "#999", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                    Upload both PDFs to enable comparison
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* ── Comparison Phase ── */
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Top toolbar */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.75rem 1rem", backgroundColor: "#111827", borderRadius: "8px",
                color: "white", flexWrap: "wrap", gap: "0.75rem",
              }}>
                <button
                  onClick={reset}
                  style={{
                    background: "transparent", border: "1px solid #555", color: "white",
                    padding: "0.4rem 1rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem",
                  }}
                >
                  ← Upload New
                </button>
                <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                  Use individual controls below each PDF to navigate pages
                </span>
                {/* Sync page button */}
                <button
                  onClick={() => { setCurrentPage2(currentPage1); }}
                  style={{
                    background: "#e11d48", border: "none", color: "white",
                    padding: "0.4rem 1rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem",
                  }}
                >
                  Sync to PDF 1
                </button>
              </div>

              {/* Side-by-side viewer */}
              <div className="compare-viewer-grid" style={{ display: "flex", gap: "1rem" }}>
                {/* PDF 1 Panel */}
                <div className="compare-pdf-panel">
                  <PdfNavBar
                    label="PDF 1"
                    file={pdf1}
                    currentPage={currentPage1}
                    totalPages={totalPages1}
                    scale={scale1}
                    onPrev={() => setCurrentPage1((p) => Math.max(1, p - 1))}
                    onNext={() => setCurrentPage1((p) => Math.min(totalPages1, p + 1))}
                    onZoomIn={() => setScale1((s) => Math.min(3, +(s + 0.15).toFixed(2)))}
                    onZoomOut={() => setScale1((s) => Math.max(0.4, +(s - 0.15).toFixed(2)))}
                  />
                  <div className="compare-canvas-wrap">
                    <canvas ref={canvas1Ref} className="compare-canvas" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }} />
                  </div>
                </div>

                {/* PDF 2 Panel */}
                <div className="compare-pdf-panel">
                  <PdfNavBar
                    label="PDF 2"
                    file={pdf2}
                    currentPage={currentPage2}
                    totalPages={totalPages2}
                    scale={scale2}
                    onPrev={() => setCurrentPage2((p) => Math.max(1, p - 1))}
                    onNext={() => setCurrentPage2((p) => Math.min(totalPages2, p + 1))}
                    onZoomIn={() => setScale2((s) => Math.min(3, +(s + 0.15).toFixed(2)))}
                    onZoomOut={() => setScale2((s) => Math.max(0.4, +(s - 0.15).toFixed(2)))}
                  />
                  <div className="compare-canvas-wrap">
                    <canvas ref={canvas2Ref} className="compare-canvas" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "3rem" }}>
            <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
            <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
          </div>
        </div>

        <VerticalAdRight />
      </div>
      <Footer />

      {/* URL Modal */}
      {showUrlModal && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
          onClick={() => setShowUrlModal(false)}
        >
          <div
            style={{ backgroundColor: "white", padding: "2rem", borderRadius: "12px", width: "90%", maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "1rem" }}>Paste PDF URL</h3>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/document.pdf"
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem" }}
            />
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowUrlModal(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", background: "white", borderRadius: "6px", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleUrlSubmit}
                disabled={isUploading}
                style={{ padding: "0.5rem 1.5rem", border: "none", background: "#e11d48", color: "white", borderRadius: "6px", cursor: "pointer" }}
              >
                {isUploading ? "Loading..." : "Add PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}