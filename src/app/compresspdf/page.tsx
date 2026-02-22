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
import FilePreview from "../components/FilePreview";
import VerticalAdLeft from "../components/Verticaladleft";
import VerticalAdRight from "../components/Verticaladright";
import RecommendedTools from "../components/RecommendedTools";

export default function CompressPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [compressedFileBlob, setCompressedFileBlob] = useState<Blob | null>(null);
  const instructionData = toolData["compress-pdf"];

  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompressed, setIsCompressed] = useState(false);
  const [stats, setStats] = useState<{ original: number; compressed: number; percent: number } | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<"extreme" | "recommended" | "less">("recommended");

  const handleDownload = () => {
    if (!compressedFileBlob) return;
    const url = window.URL.createObjectURL(compressedFileBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compressed_${files[0]?.name || "document.pdf"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const triggerDownload = useAutoDownload(isCompressed && !!compressedFileBlob, handleDownload, 10000);

  const handleReset = () => {
    setFiles([]);
    setCompressedFileBlob(null);
    setIsCompressed(false);
    setStats(null);
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleCompress = async () => {
    if (files.length === 0) { setError("Please upload a PDF file."); return; }
    setIsCompressing(true);
    setError(null);
    const originalFile = files[0];
    const originalSize = originalFile.size;
    const formData = new FormData();
    formData.append("file", originalFile);
    formData.append("compressionLevel", compressionLevel);

    try {
      const response = await fetch("/api/compresspdf", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Server compression failed.");
      }

      const serverOriginal = parseInt(response.headers.get("X-Original-Size") || "0");
      const serverCompressed = parseInt(response.headers.get("X-Compressed-Size") || "0");
      const blob = await response.blob();
      const finalOriginal = serverOriginal > 0 ? serverOriginal : originalSize;
      const finalCompressed = serverCompressed > 0 ? serverCompressed : blob.size;
      const percentSaved = Math.max(0, Math.round(((finalOriginal - finalCompressed) / finalOriginal) * 100));

      setCompressedFileBlob(blob);
      setStats({ original: finalOriginal, compressed: finalCompressed, percent: percentSaved });
      setIsCompressed(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during compression.");
    } finally {
      setIsCompressing(false);
    }
  };

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => { setFiles([file]); setIsDropdownOpen(false); },
  });

  const { openPicker: openDropboxPicker } = useDropboxPicker({
    onFilePicked: (file) => { setFiles([file]); setIsDropdownOpen(false); },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (dropped.length > 0) { setFiles([dropped[0]]); setError(null); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) { setFiles([e.target.files[0]]); setError(null); }
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
      setFiles([new File([blob], urlInput.split("/").pop() || "downloaded.pdf", { type: "application/pdf" })]);
      setShowUrlModal(false);
    } catch (err) { alert("Failed to fetch PDF"); } finally { setIsUploading(false); }
  };

  const handleFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes("application/pdf")) {
          const blob = await item.getType("application/pdf");
          setFiles([new File([blob], "clipboard.pdf", { type: "application/pdf" })]);
          break;
        }
      }
    } catch (err) { alert("No PDF found in clipboard"); }
    setIsDropdownOpen(false);
  };

  const removeFile = () => { setFiles([]); setCompressedFileBlob(null); setIsCompressed(false); };

  const handleShare = () => {
    if (!compressedFileBlob) return;
    setShowShareModal(true);
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
    { icon: <FaDropbox size={16} />, label: "Dropbox", onClick: openDropboxPicker },
  ];

  const LEVELS = [
    { id: "extreme", emoji: "🔴", label: "EXTREME", desc: "Smallest file · lower quality" },
    { id: "recommended", emoji: "🟡", label: "RECOMMENDED", desc: "Best balance of size and quality" },
    { id: "less", emoji: "🟢", label: "LESS", desc: "Highest quality · mild reduction" },
  ] as const;

  return (
    <div>
      <Navbar />
      <style>{`
        .main-container { display: flex; max-width: 1400px; margin: 4rem auto; padding: 0 1rem; gap: 2rem; align-items: flex-start; }
        .ad-column { width: 160px; flex-shrink: 0; }
        .content-area { flex: 1; min-width: 0; }
        .drop-zone-container { border: 3px solid rgba(216, 121, 253, 0.4); background-color: #F3E6FF; border-radius: 12px; padding: 2.5rem 1rem; text-align: center; position: relative; min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; transition: all 0.2s; }
        .tool-title { font-size: 2rem; font-weight: 600; margin-bottom: 2rem; color: #1a1a1a; font-family: Georgia, serif; }
        .level-card { padding: 1rem; border-radius: 10px; cursor: pointer; border: 2px solid #eee; background: white; margin-bottom: 0.5rem; transition: all 0.2s; text-align: left; }
        .level-card.active { border-color: #D879FD; background: #F3E6FF; }
        .level-card:hover:not(.active) { border-color: #D879FD; opacity: 0.8; }
        @media (max-width: 1024px) { 
          .main-container { flex-direction: column !important; padding: 0 1rem !important; margin: 2rem auto !important; }
          .ad-column { display: none !important; }
          .content-area { max-width: 100% !important; width: 100% !important; }
          .compress-workspace { flex-direction: column !important; }
        }
      `}</style>

      <div className="main-container">
        <div className="ad-column"><VerticalAdLeft /></div>
        <div className="content-area">
          <h1 className="tool-title">Compress PDF</h1>
          <div onDrop={handleDrop} onDragOver={e => e.preventDefault()} className="drop-zone-container">
            {isCompressed ? (
              <div style={{ maxWidth: "540px", padding: "1.5rem", textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", margin: "0 auto 1rem" }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", fontWeight: "600", color: "#333", margin: 0 }}>Compressed Successfully!</h2>
                {stats && (
                  <div style={{ background: "#f9fafb", borderRadius: 12, padding: "1.25rem", margin: "1.25rem 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>ORIGINAL</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>{formatSize(stats.original)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#D879FD" }}>COMPRESSED</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#D879FD" }}>{formatSize(stats.compressed)}</div>
                    </div>
                    <div style={{ gridColumn: "span 2", fontWeight: "700", color: "#15803d", fontSize: "0.9rem" }}>🎉 Saved {stats.percent}% of space!</div>
                  </div>
                )}
                <button onClick={handleDownload} style={{ width: "100%", backgroundColor: "#D879FD", color: "white", padding: "1rem", borderRadius: "10px", fontSize: "1.1rem", fontWeight: "600", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(216, 121, 253, 0.3)" }}>Download Compressed PDF</button>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                  <button onClick={handleShare} style={{ flex: 1, padding: "0.6rem", border: "1px solid #ccc", background: "white", borderRadius: "8px", cursor: "pointer" }}><TbShare3 /> Share</button>
                  <button onClick={handleReset} style={{ flex: 1, padding: "0.6rem", border: "1px solid #ccc", background: "white", borderRadius: "8px", cursor: "pointer" }}>Compress Another</button>
                </div>
              </div>
            ) : files.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px" }}>
                <div style={{ marginBottom: "1.5rem" }}><img src="./upload.svg" alt="Upload Icon" /></div>
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ backgroundColor: "#D879FD", padding: "0.6rem 1rem", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: "600", color: "white", boxShadow: "0 2px 4px rgba(216, 121, 253, 0.3)" }}>
                    <PiFiles size={18} /> Select PDF <PiCaretDown size={14} />
                  </button>
                  {isDropdownOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 10px 24px rgba(0,0,0,0.12)", zIndex: 1000, minWidth: "180px", overflow: "hidden" }}>
                      {menuItems.map((item, i) => (
                        <button key={i} onClick={item.onClick} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", width: "100%", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "0.85rem", color: "#333", textAlign: "left" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f5f5f5"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}><span style={{ color: "#666", display: "flex" }}>{item.icon}</span> {item.label}</button>
                      ))}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: "none" }} />
                </div>
              </div>
            ) : (
              <div className="compress-workspace" style={{ display: "flex", gap: "2rem", width: "100%", padding: "1rem" }}>
                <div style={{ flex: 1, backgroundColor: "white", borderRadius: "12px", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                  <div style={{ position: "relative" }}>
                    <button onClick={removeFile} style={{ position: "absolute", top: -10, right: -10, background: "white", border: "1px solid #ddd", borderRadius: "50%", width: 28, height: 28, cursor: "pointer" }}><PiX size={18} /></button>
                    <FilePreview file={files[0]} style={{ width: 140, height: 180, marginBottom: "1rem" }} />
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#333" }}>{files[0].name}</span>
                  <span style={{ fontSize: "0.75rem", color: "#666" }}>{formatSize(files[0].size)}</span>
                </div>
                <div style={{ width: "320px", textAlign: "left" }}>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", fontWeight: "600" }}>Compression Level</h3>
                  {LEVELS.map(lvl => (
                    <div key={lvl.id} className={`level-card ${compressionLevel === lvl.id ? "active" : ""}`} onClick={() => setCompressionLevel(lvl.id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "700", marginBottom: "4px" }}><span>{lvl.emoji}</span> {lvl.label}</div>
                      <div style={{ fontSize: "0.75rem", color: "#666" }}>{lvl.desc}</div>
                    </div>
                  ))}
                  <button onClick={handleCompress} disabled={isCompressing} style={{ width: "100%", marginTop: "1rem", backgroundColor: "#D879FD", color: "white", padding: "1rem", borderRadius: "10px", border: "none", cursor: isCompressing ? "wait" : "pointer", fontWeight: "700", fontSize: "1rem", boxShadow: "0 4px 12px rgba(216, 121, 253, 0.3)" }}>
                    {isCompressing ? "Compressing..." : "Compress PDF →"}
                  </button>
                </div>
              </div>
            )}
            {!isCompressed && files.length === 0 && (
              <div style={{ position: "absolute", right: "1rem", top: "90%", display: "flex", gap: "0.5rem", opacity: 0.4 }}>
                <PiUploadSimple size={20} /> <PiLink size={20} /> <FaGoogleDrive size={18} /> <FaDropbox size={18} /> <PiClipboard size={20} />
              </div>
            )}
          </div>
          <div style={{ marginTop: "3rem", fontFamily: "Georgia, serif" }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>Reduce the size of your PDF files without compromising quality.</p>
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {["Optimized compression for web, print, or storage", "Batch processing and auto-download", "Privacy-first processing"].map((t, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><PiCheckCircle size={18} style={{ color: "green" }} /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="ad-column"><VerticalAdRight /></div>
      </div>

      <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
      <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 2rem 4rem' }}>
        <RecommendedTools />
      </div>
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={compressedFileBlob} fileName="compressed.pdf" />
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