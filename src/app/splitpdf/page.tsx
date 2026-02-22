"use client";

import Navbar from "../components/Navbar";
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
  PiScissors,
  PiGridFour,
  PiDownloadSimple
} from "react-icons/pi";
import { FaGoogleDrive, FaDropbox } from "react-icons/fa";
import ShareModal from "../components/ShareModal";
import { useGoogleDrivePicker } from "../hooks/useGoogleDrivePicker";
import { useDropboxPicker } from "../hooks/useDropboxPicker";
import { useAutoDownload } from "../hooks/useAutoDownload";
import ToolInstructions from "../components/ToolInstructions";
import toolData from "../data/toolInstructions.json";
import Testimonials from "../components/Testimonials";
import testimonialData from "../data/testimonials.json";
import Footer from "../components/footer";
import VerticalAdLeft from "../components/Verticaladleft";
import VerticalAdRight from "../components/Verticaladright";
import RecommendedTools from "../components/RecommendedTools";
import FilePreview from "../components/FilePreview";
import JSZip from "jszip";

export default function SplitPdfPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectMode, setSelectMode] = useState<"individual" | "range">("individual");
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [splitBlobs, setSplitBlobs] = useState<Blob[]>([]);
  const instructionData = toolData["split-pdf"];

  const [error, setError] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<"extract" | "ranges" | "fixed">("extract");

  const [fixedPageCount, setFixedPageCount] = useState<number>(1);
  const [isSplit, setIsSplit] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      // @ts-ignore
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setError(null);
      setIsDropdownOpen(false);
    },
  });

  const { openPicker: openDropboxPicker } = useDropboxPicker({
    onFilePicked: (file) => {
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setError(null);
      setIsDropdownOpen(false);
    },
  });

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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf"))) {
      setPdfFile(droppedFile);
      setPdfUrl(URL.createObjectURL(droppedFile));
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && (selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf"))) {
      setPdfFile(selected);
      setPdfUrl(URL.createObjectURL(selected));
      setError(null);
    }
    setIsDropdownOpen(false);
  };

  const handleFromDevice = () => fileInputRef.current?.click();
  const handlePasteUrl = () => { setShowUrlModal(true); setIsDropdownOpen(false); };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    try {
      setIsUploading(true);
      const response = await fetch(urlInput);
      const blob = await response.blob();
      if (blob.type !== "application/pdf") { alert("URL must point to a PDF"); return; }
      const file = new File([blob], "downloaded.pdf", { type: "application/pdf" });
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setShowUrlModal(false);
      setError(null);
    } catch (err) { alert("Failed to fetch PDF"); } finally { setIsUploading(false); }
  };

  const loadPdf = async (url: string) => {
    try {
      setIsProcessing(true);
      // @ts-ignore
      const pdf = await window.pdfjsLib.getDocument(url).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      const images: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.6 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
        images.push(canvas.toDataURL());
      }
      setPageImages(images);
    } catch (err) { setError("Error loading PDF."); } finally { setIsProcessing(false); }
  };

  const handleStartEditing = async () => {
    if (pdfFile && pdfUrl) {
      setIsEditingMode(true);
      await loadPdf(pdfUrl);
    }
  };

  const togglePageSelection = (pageNum: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) newSelected.delete(pageNum);
    else newSelected.add(pageNum);
    setSelectedPages(newSelected);
  };

  const handleDownload = async () => {
    if (splitBlobs.length === 0) return;
    if (splitBlobs.length === 1) {
      const url = URL.createObjectURL(splitBlobs[0]);
      const a = document.createElement("a");
      a.href = url;
      a.download = `split_${pdfFile?.name || "file.pdf"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const zip = new JSZip();
      splitBlobs.forEach((blob, i) => zip.file(`split_${i + 1}.pdf`, blob));
      const zipContent = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipContent);
      const a = document.createElement("a");
      a.href = url;
      a.download = `split_${pdfFile?.name?.replace(".pdf", "") || "files"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const triggerDownload = useAutoDownload(isSplit && splitBlobs.length > 0, handleDownload, 10000);

  const splitPdf = async () => {
    if (!pdfDoc) return;
    setIsProcessing(true);
    try {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
      await new Promise(r => { script.onload = r; document.head.appendChild(script); });
      // @ts-ignore
      const { PDFDocument } = window.PDFLib;
      const arrayBuffer = await pdfFile!.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const blobs: Blob[] = [];

      if (splitMode === "extract") {
        const newPdf = await PDFDocument.create();
        const pagesToCopy = Array.from(selectedPages).sort((a, b) => a - b).map(p => p - 1);
        const copiedPages = await newPdf.copyPages(originalPdf, pagesToCopy);
        copiedPages.forEach((p: any) => newPdf.addPage(p));
        blobs.push(new Blob([await newPdf.save()], { type: "application/pdf" }));
      } else if (splitMode === "fixed") {
        for (let i = 0; i < Math.ceil(totalPages / fixedPageCount); i++) {
          const newPdf = await PDFDocument.create();
          const pToCopy = Array.from({ length: Math.min(fixedPageCount, totalPages - i * fixedPageCount) }, (_, idx) => i * fixedPageCount + idx);
          const copied = await newPdf.copyPages(originalPdf, pToCopy);
          copied.forEach((p: any) => newPdf.addPage(p));
          blobs.push(new Blob([await newPdf.save()], { type: "application/pdf" }));
        }
      }
      setSplitBlobs(blobs);
      setIsSplit(true);
    } catch (err) { setError("Error splitting PDF."); } finally { setIsProcessing(false); }
  };

  const removeFile = () => {
    setPdfFile(null);
    setPdfUrl("");
    setError(null);
    setSplitBlobs([]);
  };

  const goBack = () => {
    setIsEditingMode(false);
    setIsSplit(false);
    setSelectedPages(new Set());
    setPageImages([]);
    setSplitBlobs([]);
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
    { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: openDropboxPicker },
  ];

  return (
    <div>
      <Navbar />
      <style>{`
        .main-container { display: flex; max-width: 1400px; margin: 4rem auto; padding: 0 1rem; gap: 2rem; align-items: flex-start; }
        .ad-column { width: 160px; flex-shrink: 0; }
        .content-area { flex: 1; min-width: 0; }
        .drop-zone-container { border: 3px solid rgba(216, 121, 253, 0.4); background-color: #F3E6FF; border-radius: 12px; padding: 2.5rem 1rem; text-align: center; position: relative; min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; transition: all 0.2s; }
        .tool-title { font-size: 2rem; font-weight: 600; margin-bottom: 2rem; color: #1a1a1a; font-family: Georgia, serif; }
        .page-thumb { cursor: pointer; border: 2px solid transparent; border-radius: 8px; transition: all 0.2s; position: relative; }
        .page-thumb.selected { border-color: #D879FD; background-color: rgba(216, 121, 253, 0.1); }
        .page-thumb:hover { transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .split-sidebar { width: 300px; background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        @media (max-width: 1024px) { 
          .main-container { flex-direction: column !important; padding: 0 1rem !important; margin: 2rem auto !important; }
          .ad-column { display: none !important; }
          .content-area { max-width: 100% !important; width: 100% !important; }
          .split-workspace { flex-direction: column !important; }
          .split-sidebar { width: 100% !important; }
        }
      `}</style>

      {isEditingMode ? (
        <div className="main-container" style={{ maxWidth: "1400px" }}>
          <div className="content-area">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
              <button onClick={goBack} style={{ backgroundColor: "#6c757d", color: "white", border: "none", padding: "0.6rem 1.2rem", borderRadius: "5px", cursor: "pointer" }}>← Back</button>
              <h1 style={{ fontSize: "1.5rem", margin: 0, fontFamily: "Georgia, serif" }}>Split PDF Workspace</h1>
              {!isSplit && (
                <button
                  onClick={splitPdf}
                  disabled={isProcessing}
                  style={{ backgroundColor: "#D879FD", color: "white", border: "none", padding: "0.7rem 1.5rem", borderRadius: "8px", cursor: isProcessing ? "not-allowed" : "pointer", fontWeight: "600", boxShadow: "0 4px 12px rgba(216, 121, 253, 0.3)" }}
                >
                  {isProcessing ? "Processing..." : "Split PDF →"}
                </button>
              )}
            </div>

            {isSplit ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem", background: "white", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", maxWidth: "700px", margin: "0 auto", gap: "1.5rem" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32" }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0 }}>Splitting Complete!</h2>
                <button
                  onClick={triggerDownload}
                  style={{ backgroundColor: "#D879FD", color: "white", padding: "1rem 3rem", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "600", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(216, 121, 253, 0.3)" }}
                >
                  Download {splitBlobs.length > 1 ? "as ZIP" : "PDF"}
                </button>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button onClick={() => setShowShareModal(true)} style={{ background: "transparent", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}><TbShare3 /> Share</button>
                  <button onClick={goBack} style={{ background: "transparent", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}>Split Another</button>
                </div>
              </div>
            ) : (
              <div className="split-workspace" style={{ display: "flex", gap: "1.5rem" }}>
                <div style={{ flex: 1, background: "#f8f9fa", borderRadius: "12px", padding: "1.5rem", minHeight: "500px", maxHeight: "80vh", overflowY: "auto" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1.5rem" }}>
                    {pageImages.map((img, i) => (
                      <div key={i} className={`page-thumb ${selectedPages.has(i + 1) ? "selected" : ""}`} onClick={() => togglePageSelection(i + 1)}>
                        <img src={img} alt={`Page ${i + 1}`} style={{ width: "100%", borderRadius: "6px", display: "block" }} />
                        <div style={{ textAlign: "center", padding: "0.5rem", fontSize: "0.85rem", fontWeight: "600" }}>Page {i + 1}</div>
                        {selectedPages.has(i + 1) && (
                          <div style={{ position: "absolute", top: "5px", right: "5px", background: "#D879FD", color: "white", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}><PiCheckCircle size={14} /></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="split-sidebar">
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "1.5rem", fontWeight: "600" }}>Split Settings</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <button
                      onClick={() => setSplitMode("extract")}
                      style={{ padding: "0.8rem", textAlign: "left", borderRadius: "8px", border: splitMode === "extract" ? "2px solid #D879FD" : "1px solid #ddd", background: splitMode === "extract" ? "#F3E6FF" : "white", cursor: "pointer" }}
                    >
                      <strong>Extract Pages</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#666" }}>Select specific pages to save as one PDF.</p>
                    </button>
                    <button
                      onClick={() => setSplitMode("fixed")}
                      style={{ padding: "0.8rem", textAlign: "left", borderRadius: "8px", border: splitMode === "fixed" ? "2px solid #D879FD" : "1px solid #ddd", background: splitMode === "fixed" ? "#F3E6FF" : "white", cursor: "pointer" }}
                    >
                      <strong>Fixed Ranges</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#666" }}>Split every X pages into separate files.</p>
                    </button>
                    {splitMode === "fixed" && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <label style={{ fontSize: "0.85rem", color: "#444" }}>Pages per split:</label>
                        <input type="number" min="1" max={totalPages} value={fixedPageCount} onChange={e => setFixedPageCount(parseInt(e.target.value))} style={{ width: "100%", padding: "0.5rem", marginTop: "4px", borderRadius: "4px", border: "1px solid #ddd" }} />
                      </div>
                    )}
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #eee" }}>
                      <p style={{ fontSize: "0.85rem", color: "#666" }}>Selected: <strong>{selectedPages.size}</strong> of {totalPages} pages</p>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <button onClick={() => setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)))} style={{ flex: 1, fontSize: "0.75rem", padding: "0.4rem", cursor: "pointer" }}>Select All</button>
                        <button onClick={() => setSelectedPages(new Set())} style={{ flex: 1, fontSize: "0.75rem", padding: "0.4rem", cursor: "pointer" }}>Clear</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="main-container">
          <div className="ad-column"><VerticalAdLeft /></div>
          <div className="content-area">
            <h1 className="tool-title">Split PDF</h1>
            <div onDrop={handleDrop} onDragOver={e => e.preventDefault()} className="drop-zone-container">
              {!pdfFile ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px" }}>
                  <div style={{ marginBottom: "1.5rem" }}><img src="./upload.svg" alt="Upload Icon" /></div>
                  <div ref={dropdownRef} style={{ position: "relative" }}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ backgroundColor: "#D879FD", padding: "0.6rem 1rem", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: "600", color: "white", boxShadow: "0 2px 4px rgba(216, 121, 253, 0.3)" }}>
                      <PiFiles size={18} /> Select File <PiCaretDown size={14} />
                    </button>
                    {isDropdownOpen && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, minWidth: "180px", overflow: "hidden" }}>
                        {menuItems.map((item, i) => (
                          <button key={i} onClick={item.onClick} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", width: "100%", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "0.85rem", color: "#333", textAlign: "left" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f5f5f5"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                            <span style={{ color: "#666", display: "flex", alignItems: "center" }}>{item.icon}</span> {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: "none" }} />
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
                    <button onClick={handleStartEditing} style={{ backgroundColor: "#D879FD", color: "white", border: "none", padding: "0.5rem 1.2rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: "600", boxShadow: "0 4px 6px rgba(216, 121, 253, 0.2)" }}>
                      <PiScissors size={18} /> Start Splitting
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ backgroundColor: "white", borderRadius: "8px", width: "120px", height: "140px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "relative" }}>
                      <button onClick={removeFile} style={{ position: "absolute", top: "4px", right: "4px", background: "white", border: "none", borderRadius: "50%", width: "25px", height: "25px", cursor: "pointer" }}><PiX size={18} /></button>
                      <FilePreview file={pdfFile} style={{ width: "80px", height: "100px", marginBottom: "0.5rem" }} />
                      <span style={{ fontSize: "0.65rem", color: "#666", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pdfFile.name}</span>
                    </div>
                  </div>
                </div>
              )}
              {!pdfFile && (
                <div style={{ position: "absolute", right: "1rem", top: "90%", display: "flex", gap: "0.5rem", opacity: 0.4 }}>
                  <PiUploadSimple size={20} /> <PiLink size={20} /> <FaGoogleDrive size={18} /> <FaDropbox size={18} /> <PiClipboard size={20} />
                </div>
              )}
            </div>
            <div style={{ marginTop: "3rem", fontFamily: "Georgia, serif" }}>
              <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>Split your PDF into multiple files by extracting pages or dividing into equal parts.</p>
              <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0 }}>
                {["Extract specific pages into a new PDF", "Split by page ranges or fixed intervals", "Secure browser-side processing"].map((t, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><PiCheckCircle size={18} style={{ color: "green" }} /> {t}</li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: "3rem", padding: "1.5rem", backgroundColor: "#f0f9ff", border: "1px solid #cce5ff", borderRadius: "10px", fontSize: "0.95rem", fontFamily: "Georgia, serif" }}>
              <strong>Protected. Encrypted.</strong> <p style={{ marginTop: "0.5rem", color: "#555" }}>Your files are processed locally and never stored on our servers.</p>
            </div>
          </div>
          <div className="ad-column"><VerticalAdRight /></div>
        </div>
      )}

      <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
      <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 2rem 4rem' }}>
        <RecommendedTools />
      </div>
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={splitBlobs[0]} fileName="split.pdf" />
      <Footer />

      {showUrlModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowUrlModal(false)}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem", fontFamily: "Georgia, serif" }}>Paste PDF URL</h3>
            <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com/document.pdf" style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "6px", marginBottom: "1rem" }} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowUrlModal(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", background: "white", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleUrlSubmit} disabled={isUploading} style={{ padding: "0.5rem 1rem", border: "none", background: "#D879FD", color: "white", borderRadius: "6px", cursor: "pointer" }}>{isUploading ? "Loading..." : "Add PDF"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}