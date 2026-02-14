"use client";

import { useState, useEffect, useRef } from "react";
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
  PiArrowsLeftRight,
  PiMagnifyingGlassPlus,
  PiMagnifyingGlassMinus,
  PiCaretLeft,
  PiCaretRight
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

// PDF.js worker setup
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export default function ComparePdfPage() {
  const { token } = useAuth();
  const router = useRouter();

  // File States
  const [pdf1, setPdf1] = useState<File | null>(null);
  const [pdf2, setPdf2] = useState<File | null>(null);

  // Viewer States
  const [isComparing, setIsComparing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages1, setTotalPages1] = useState(0);
  const [totalPages2, setTotalPages2] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [viewMode, setViewMode] = useState<"side-by-side" | "overlay">("side-by-side");
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

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
  const renderPage = async (file: File, pageNum: number, canvas: HTMLCanvasElement) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

      if (pageNum > pdf.numPages) return; // Page doesn't exist

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: scale });
      const context = canvas.getContext("2d");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      }
    } catch (error) {
      console.error("Render error:", error);
    }
  };

  useEffect(() => {
    if (isComparing && pdf1 && canvas1Ref.current) {
      renderPage(pdf1, currentPage, canvas1Ref.current);
    }
    if (isComparing && pdf2 && canvas2Ref.current) {
      renderPage(pdf2, currentPage, canvas2Ref.current);
    }
  }, [isComparing, currentPage, scale, pdf1, pdf2]);

  // Init page counts
  useEffect(() => {
    if (pdf1) {
      pdf1.arrayBuffer().then(b => pdfjsLib.getDocument(b).promise).then(p => setTotalPages1(p.numPages));
    }
    if (pdf2) {
      pdf2.arrayBuffer().then(b => pdfjsLib.getDocument(b).promise).then(p => setTotalPages2(p.numPages));
    }
  }, [pdf1, pdf2]);


  // --- Controls ---
  const startComparison = () => {
    if (pdf1 && pdf2) {
      setIsComparing(true);
      setCurrentPage(1);
      setScale(1.0);
    }
  };

  const changePage = (delta: number) => {
    const maxPages = Math.max(totalPages1, totalPages2);
    const newPage = Math.min(Math.max(1, currentPage + delta), maxPages);
    setCurrentPage(newPage);
  };

  const zoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(3.0, prev + delta)));
  };

  const reset = () => {
    setIsComparing(false);
    setPdf1(null);
    setPdf2(null);
    setCurrentPage(1);
  };

  // --- Upload Handlers (Shared) ---
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
      if (blob.type !== "application/pdf") return alert("Not PDF");
      const f = new File([blob], "downloaded.pdf", { type: "application/pdf" });
      activeUpload === 1 ? setPdf1(f) : setPdf2(f);
      setShowUrlModal(false);
    } catch { alert("Failed"); }
    setIsUploading(false);
  };

  // Pickers
  const { openPicker: openGD1 } = useGoogleDrivePicker({ onFilePicked: (f) => { setPdf1(f); setIsDropdown1Open(false); } });
  const { openPicker: openGD2 } = useGoogleDrivePicker({ onFilePicked: (f) => { setPdf2(f); setIsDropdown2Open(false); } });
  const { openPicker: openDB1 } = useDropboxPicker({ onFilePicked: (f) => { setPdf1(f); setIsDropdown1Open(false); } });
  const { openPicker: openDB2 } = useDropboxPicker({ onFilePicked: (f) => { setPdf2(f); setIsDropdown2Open(false); } });


  const renderUploadBox = (num: 1 | 2) => {
    const file = num === 1 ? pdf1 : pdf2;
    const isOpen = num === 1 ? isDropdown1Open : isDropdown2Open;
    const setOpen = num === 1 ? setIsDropdown1Open : setIsDropdown2Open;
    const ref = num === 1 ? dropdown1Ref : dropdown2Ref;
    const inputRef = num === 1 ? fileInput1Ref : fileInput2Ref;

    return (
      <div onDrop={(e) => handleDrop(e, num)} onDragOver={e => e.preventDefault()} style={{ flex: 1, minWidth: "300px", border: "2px dashed #ccc", borderRadius: "12px", padding: "2rem", textAlign: "center", backgroundColor: "#f8f9fa" }}>
        <h3 style={{ marginBottom: "1rem" }}>PDF {num}</h3>
        {file ? (
          <div style={{ padding: "1rem", background: "white", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", display: "inline-block", position: "relative" }}>
            <button onClick={() => num === 1 ? setPdf1(null) : setPdf2(null)} style={{ position: "absolute", top: -10, right: -10, background: "red", color: "white", borderRadius: "50%", width: 24, height: 24, border: "none", cursor: "pointer" }}>×</button>
            <img src="./pdf.svg" style={{ width: 40, height: 50 }} />
            <div style={{ fontSize: "0.8rem", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
          </div>
        ) : (
          <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button onClick={() => setOpen(!isOpen)} style={{ padding: "0.8rem 1.5rem", background: "#e11d48", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <PiUploadSimple size={20} /> Select File <PiCaretDown />
            </button>
            {isOpen && (
              <div style={{ position: "absolute", top: "110%", left: "50%", transform: "translateX(-50%)", width: "180px", background: "white", boxShadow: "0 5px 15px rgba(0,0,0,0.2)", borderRadius: "8px", overflow: "hidden", zIndex: 10 }}>
                <button onClick={() => inputRef.current?.click()} style={{ display: "block", width: "100%", padding: "10px", textAlign: "left", border: "none", background: "white", cursor: "pointer", borderBottom: "1px solid #eee" }}>Device</button>
                <button onClick={() => { setActiveUpload(num); setShowUrlModal(true); setOpen(false); }} style={{ display: "block", width: "100%", padding: "10px", textAlign: "left", border: "none", background: "white", cursor: "pointer", borderBottom: "1px solid #eee" }}>URL</button>
                <button onClick={num === 1 ? openGD1 : openGD2} style={{ display: "block", width: "100%", padding: "10px", textAlign: "left", border: "none", background: "white", cursor: "pointer", borderBottom: "1px solid #eee" }}>Google Drive</button>
                <button onClick={num === 1 ? openDB1 : openDB2} style={{ display: "block", width: "100%", padding: "10px", textAlign: "left", border: "none", background: "white", cursor: "pointer" }}>Dropbox</button>
              </div>
            )}
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={(e) => handleFileChange(e, num)} style={{ display: "none" }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Navbar />
      <div style={{ display: "flex", maxWidth: "1400px", margin: "4rem auto", padding: "0 2rem", gap: "2rem", alignItems: "flex-start" }}>
        <VerticalAdLeft />
        <div style={{ flex: 1, maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "2rem", color: "#333" }}>Compare PDF Files</h1>

          {!isComparing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
                {renderUploadBox(1)}
                {renderUploadBox(2)}
              </div>
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={startComparison}
                  disabled={!pdf1 || !pdf2}
                  style={{ padding: "1rem 3rem", fontSize: "1.2rem", backgroundColor: pdf1 && pdf2 ? "#28a745" : "#ccc", color: "white", border: "none", borderRadius: "8px", cursor: pdf1 && pdf2 ? "pointer" : "not-allowed", fontWeight: "bold" }}
                >
                  Compare PDFs
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Controls Toolbar */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "1rem", backgroundColor: "#333", borderRadius: "8px", color: "white",
                flexWrap: "wrap", gap: "1rem"
              }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <button onClick={reset} style={{ background: "transparent", border: "1px solid #666", color: "white", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>Upload New</button>
                  <div style={{ display: "flex", backgroundColor: "#444", borderRadius: "4px", overflow: "hidden" }}>
                    <button onClick={() => setViewMode("side-by-side")} style={{ padding: "0.5rem", background: viewMode === "side-by-side" ? "#e11d48" : "transparent", color: "white", border: "none", cursor: "pointer" }}>Side by Side</button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <button onClick={() => changePage(-1)} disabled={currentPage <= 1} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><PiCaretLeft size={24} /></button>
                  <span>Page {currentPage} / {Math.max(totalPages1, totalPages2)}</span>
                  <button onClick={() => changePage(1)} disabled={currentPage >= Math.max(totalPages1, totalPages2)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><PiCaretRight size={24} /></button>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button onClick={() => zoom(-0.1)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><PiMagnifyingGlassMinus size={24} /></button>
                  <span>{Math.round(scale * 100)}%</span>
                  <button onClick={() => zoom(0.1)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><PiMagnifyingGlassPlus size={24} /></button>
                </div>
              </div>

              {/* Viewer Area */}
              <div style={{
                display: "flex",
                gap: "1rem",
                backgroundColor: "#e2e2e2",
                padding: "1rem",
                borderRadius: "8px",
                height: "80vh",
                overflow: "auto",
                flexDirection: viewMode === "side-by-side" ? "row" : "column",
                justifyContent: "center",
                position: "relative"
              }}>
                <style>{`
                                @media (max-width: 768px) {
                                    div[style*="flex-direction: row"] { flex-direction: column !important; }
                                    canvas { width: 100% !important; height: auto !important; }
                                }
                             `}</style>

                {/* Viewer 1 */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ marginBottom: "0.5rem", fontWeight: "bold", color: "#555" }}>{pdf1?.name}</div>
                  <div style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.2)", background: "white" }}>
                    <canvas ref={canvas1Ref} />
                  </div>
                </div>

                {/* Viewer 2 */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ marginBottom: "0.5rem", fontWeight: "bold", color: "#555" }}>{pdf2?.name}</div>
                  <div style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.2)", background: "white" }}>
                    <canvas ref={canvas2Ref} />
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
    </div>
  );
}