"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  PiFiles,
  PiLink,
  PiClipboard,
  PiCaretDown,
  PiUploadSimple,
  PiCheckCircle,
  PiX,
  PiTrash
} from "react-icons/pi";
import { TbShare3 } from "react-icons/tb";
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
import { PDFDocument } from 'pdf-lib';
import ShareModal from "../components/ShareModal";

// PDF.js worker setup
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export default function DeletePdfPagesPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [totalPages, setTotalPages] = useState(0);
  const [pageDataUrls, setPageDataUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Success & Download State
  const [isDeleted, setIsDeleted] = useState(false);
  const [modifiedBlob, setModifiedBlob] = useState<Blob | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Upload States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const instructionData = toolData["delete-pdf"];

  // --- PDF Rendering Logic ---
  const renderPdfPages = async (file: File) => {
    setIsProcessing(true);
    setPageDataUrls([]);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      setTotalPages(pdf.numPages);

      const urls: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 }); // Low scale for thumbnail
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
          urls.push(canvas.toDataURL());
        }
      }
      setPageDataUrls(urls);
      setIsEditingMode(true);
    } catch (error) {
      console.error("Error rendering PDF:", error);
      alert("Failed to read PDF file.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Selection Logic ---
  const togglePageSelection = (index: number) => {
    const pageNum = index + 1;
    const newSet = new Set(selectedPages);
    if (newSet.has(pageNum)) {
      newSet.delete(pageNum);
    } else {
      newSet.add(pageNum);
    }
    setSelectedPages(newSet);
  };

  const selectAll = () => {
    const all = new Set<number>();
    for (let i = 1; i <= totalPages; i++) all.add(i);
    setSelectedPages(all);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  }

  // --- Deletion Logic ---
  const deleteSelectedPages = async () => {
    if (!pdfFile || selectedPages.size === 0) return;
    if (selectedPages.size === totalPages) {
      alert("You cannot delete all pages.");
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const newPdf = await PDFDocument.create();
      const pagesToKeep: number[] = [];

      // pdf-lib is 0-indexed for copyPages
      for (let i = 0; i < totalPages; i++) {
        if (!selectedPages.has(i + 1)) {
          pagesToKeep.push(i);
        }
      }

      const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
      copiedPages.forEach(p => newPdf.addPage(p));

      const modifiedBytes = await newPdf.save();
      const blob = new Blob([modifiedBytes as any], { type: "application/pdf" });
      setModifiedBlob(blob);
      setIsDeleted(true);
      setIsEditingMode(false); // Go to Success Screen

    } catch (error) {
      console.error(error);
      alert("Error processing PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Utils ---
  const reset = () => {
    setPdfFile(null);
    setIsEditingMode(false);
    setIsDeleted(false);
    setModifiedBlob(null);
    setSelectedPages(new Set());
    setPageDataUrls([]);
  };

  const handleDownload = () => {
    if (!modifiedBlob) return;
    const url = URL.createObjectURL(modifiedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modified_${pdfFile?.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-download
  useEffect(() => {
    let tm: NodeJS.Timeout;
    if (isDeleted && modifiedBlob) {
      tm = setTimeout(handleDownload, 7000);
    }
    return () => clearTimeout(tm);
  }, [isDeleted, modifiedBlob]);

  // --- Standard Handlers ----
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) {
      setPdfFile(f);
      renderPdfPages(f);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) {
      setPdfFile(f);
      renderPdfPages(f);
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
      const f = new File([blob], "downloaded.pdf", { type: "application/pdf" });
      setPdfFile(f);
      setShowUrlModal(false);
      renderPdfPages(f);
    } catch { alert("Failed"); } finally { setIsUploading(false); }
  };

  // Pickers
  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({ onFilePicked: (f) => { setPdfFile(f); renderPdfPages(f); setIsDropdownOpen(false); } });
  const { openPicker: openDropboxPicker } = useDropboxPicker({ onFilePicked: (f) => { setPdfFile(f); renderPdfPages(f); setIsDropdownOpen(false); } });


  return (
    <div>
      <Navbar />

      <div style={{ display: "flex", maxWidth: "1400px", margin: "4rem auto", padding: "0 2rem", gap: "2rem", alignItems: "flex-start" }}>
        <VerticalAdLeft />

        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "2rem", textAlign: "left", color: "#1a1a1a", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Delete PDF Pages
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
            {isDeleted ? (
              /* Success State */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem", padding: "2rem 0" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32", marginBottom: "0.5rem" }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0 }}>Pages Deleted Successfully!</h2>
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
            ) : isEditingMode ? (
              /* Editing Mode (Grid) */
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <style>{`
                        @media (max-width: 600px) {
                            .grid-container { grid-template-columns: repeat(2, 1fr) !important; }
                        }
                     `}</style>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={selectAll} style={{ padding: "0.5rem 1rem", background: "white", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}>Select All</button>
                    <button onClick={clearSelection} style={{ padding: "0.5rem 1rem", background: "white", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}>Clear</button>
                    <span style={{ display: "flex", alignItems: "center", marginLeft: "1rem", color: "#666" }}>{selectedPages.size} pages selected</span>
                  </div>

                  <button
                    onClick={deleteSelectedPages}
                    disabled={selectedPages.size === 0}
                    style={{
                      backgroundColor: selectedPages.size > 0 ? "#dc3545" : "#ccc",
                      color: "white", border: "none", padding: "0.7rem 1.5rem",
                      borderRadius: "6px", cursor: selectedPages.size > 0 ? "pointer" : "not-allowed",
                      fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem"
                    }}
                  >
                    <PiTrash size={20} /> Remove Selected
                  </button>
                </div>

                <div className="grid-container" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", maxHeight: "60vh", overflowY: "auto", padding: "10px" }}>
                  {pageDataUrls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => togglePageSelection(idx)}
                      style={{
                        border: selectedPages.has(idx + 1) ? "3px solid #dc3545" : "1px solid #ddd",
                        borderRadius: "8px", overflow: "hidden", cursor: "pointer", position: "relative",
                        opacity: selectedPages.has(idx + 1) ? 0.6 : 1,
                        transform: selectedPages.has(idx + 1) ? "scale(0.95)" : "scale(1)",
                        transition: "all 0.2s"
                      }}
                    >
                      <img src={url} style={{ width: "100%", display: "block" }} />
                      <div style={{ textAlign: "center", padding: "5px", background: "#f9f9f9", fontSize: "0.8rem", color: "#555" }}>Page {idx + 1}</div>
                      {selectedPages.has(idx + 1) && (
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#dc3545" }}>
                          <PiTrash size={40} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Upload State */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", minHeight: "220px" }}>
                {isProcessing ? (
                  <div style={{ color: "#666" }}>Loading PDF Pages...</div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>

          {/* Info & Footer */}
          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>Remove unwanted pages easily and securely.</p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {["Select pages to remove", "Preview before deleting", "Secure processing"].map((text, i) => (
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
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={modifiedBlob} fileName="modified.pdf" />
      <Footer />
    </div>
  );
}