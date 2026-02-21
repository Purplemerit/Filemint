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
import ToolInstructions from "../components/ToolInstructions";
import toolData from "../data/toolInstructions.json";
import Testimonials from "../components/Testimonials";
import testimonialData from "../data/testimonials.json";
import Footer from "../components/footer";
import FilePreview from "../components/FilePreview";
import VerticalAdLeft from "../components/Verticaladleft";
import VerticalAdRight from "../components/Verticaladright";

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

  // Auto-download
  useEffect(() => {
    let tid: NodeJS.Timeout;
    if (isCompressed && compressedFileBlob) {
      tid = setTimeout(handleDownload, 7000);
    }
    return () => clearTimeout(tid);
  }, [isCompressed, compressedFileBlob]);

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
        throw new Error(errorData.error || "Server compression failed. Please try again.");
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
      console.error("Compression error:", err);
      setError(
        err.message?.toLowerCase().includes("fetch")
          ? "Upload failed. Check your internet connection or try a smaller file."
          : err.message || "An unexpected error occurred during compression."
      );
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (dropped.length > 0) { setFiles([dropped[0]]); setError(null); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) { setFiles([e.target.files[0]]); setError(null); }
    setIsDropdownOpen(false);
  };

  const handleFromDevice = () => fileInputRef.current?.click();
  const handlePasteUrl = () => { setShowUrlModal(true); setIsDropdownOpen(false); };
  const handleGoogleDrive = () => openGoogleDrivePicker();
  const handleDropbox = () => openDropboxPicker();

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    try {
      setIsUploading(true);
      const response = await fetch(urlInput);
      const blob = await response.blob();
      if (blob.type !== "application/pdf") { alert("URL must point to a PDF file."); return; }
      const fileName = urlInput.split("/").pop() || "downloaded.pdf";
      setFiles([new File([blob], fileName, { type: "application/pdf" })]);
      setUrlInput(""); setShowUrlModal(false); setError(null);
    } catch { alert("Failed to fetch PDF from URL."); }
    finally { setIsUploading(false); }
  };

  const handleFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes("application/pdf")) {
          const blob = await item.getType("application/pdf");
          setFiles([new File([blob], "clipboard.pdf", { type: "application/pdf" })]);
          setError(null);
          break;
        }
      }
    } catch { alert("No PDF found in clipboard or clipboard access denied."); }
    setIsDropdownOpen(false);
  };

  const removeFile = () => { setFiles([]); setCompressedFileBlob(null); setIsCompressed(false); setError(null); };
  const handleShare = () => {
    if (!compressedFileBlob) { alert("Please compress the file first."); return; }
    setShowShareModal(true);
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: handleGoogleDrive },
    { icon: <FaDropbox size={16} />, label: "Dropbox", onClick: handleDropbox },
    { icon: <PiClipboard size={18} />, label: "From Clipboard", onClick: handleFromClipboard },
  ];

  const LEVELS = [
    { id: "extreme", emoji: "🔴", label: "EXTREME", desc: "Smallest file · lower visual quality" },
    { id: "recommended", emoji: "🟡", label: "RECOMMENDED", desc: "Best balance of size and quality" },
    { id: "less", emoji: "🟢", label: "LESS", desc: "Highest quality · mild size reduction" },
  ] as const;

  return (
    <div>
      <style>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes fadeInUp    { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

        .cp-wrapper {
          width: 100%;
          max-width: 940px;
          margin: 0 auto;
          padding: 0 1rem;
          box-sizing: border-box;
          animation: fadeInUp 0.4s ease;
        }
        .cp-split {
          display: flex;
          gap: 1.75rem;
          width: 100%;
          align-items: flex-start;
        }
        .cp-preview-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fcfcfc;
          border-radius: 18px;
          border: 2px dashed #e5e7eb;
          padding: 2.5rem 1.5rem;
          min-height: 340px;
          box-sizing: border-box;
        }
        .cp-control-col {
          width: 320px;
          flex-shrink: 0;
          background: white;
          padding: 1.75rem;
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.09);
          border: 1px solid #f0f0f0;
          box-sizing: border-box;
        }
        .cp-level-card {
          padding: 1rem 1.1rem;
          border-radius: 12px;
          cursor: pointer;
          border: 2px solid #f3f4f6;
          background: white;
          transition: border-color 0.2s, background 0.2s;
          position: relative;
          user-select: none;
          margin-bottom: 0.65rem;
        }
        .cp-level-card:last-child { margin-bottom: 0; }
        .cp-level-card.active { border-color: #e11d48; background: #fff5f7; }
        .cp-level-card:hover:not(.active) { border-color: #fca5a5; background: #fff9f9; }

        .cp-btn-primary {
          background: linear-gradient(135deg, #e11d48, #f43f5e);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 1rem;
          font-size: 1rem;
          font-weight: 700;
          width: 100%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          box-shadow: 0 6px 18px rgba(225,29,72,0.28);
          transition: transform 0.2s, opacity 0.2s;
          letter-spacing: 0.5px;
        }
        .cp-btn-primary:hover:not(:disabled) { transform: scale(1.02); }
        .cp-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

        .cp-btn-secondary {
          flex: 1;
          background: white;
          color: #374151;
          border: 1.5px solid #e5e7eb;
          border-radius: 11px;
          padding: 0.75rem 0.5rem;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          transition: background 0.2s, border-color 0.2s;
        }
        .cp-btn-secondary:hover { background: #f9fafb; border-color: #d1d5db; }

        .cp-spinner {
          width: 19px; height: 19px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          flex-shrink: 0;
        }
        .cp-success-card {
          max-width: 540px;
          margin: 1.5rem auto;
          background: white;
          border-radius: 22px;
          padding: 3rem 2rem;
          box-shadow: 0 12px 44px rgba(0,0,0,0.1);
          text-align: center;
          animation: fadeInUp 0.5s ease;
        }
        .cp-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          background: #f9fafb;
          border-radius: 14px;
          padding: 1.25rem;
          margin: 1.25rem 0;
        }
        .cp-action-row {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }
        .cp-error-box {
          margin-top: 1rem;
          padding: 0.8rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          font-size: 0.85rem;
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
        }
        .cp-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.72rem 1rem;
          width: 100%;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.88rem;
          color: #333;
          text-align: left;
          transition: background 0.15s;
        }
        .cp-menu-item:hover { background: #f5f5f5; }

        /* ── Mobile ─────────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .main-layout { display: flex; flex-direction: column; align-items: center; }
          .cp-wrapper { max-width: 100%; }
        }

        @media (max-width: 680px) {
          .cp-split {
            flex-direction: column;
          }
          .cp-control-col {
            width: 100%;
          }
          .cp-preview-col {
            min-height: 220px;
            padding: 1.75rem 1rem;
          }
          .cp-success-card {
            padding: 2rem 1.25rem;
            border-radius: 16px;
          }
          .cp-stats-grid {
            gap: 0.75rem;
            padding: 1rem;
          }
          .cp-action-row {
            flex-direction: column;
          }
          /* Hide ads on mobile/small screens for better focus */
          aside { display: none !important; }
        }
        @media (max-width: 420px) {
          .cp-btn-primary { font-size: 0.95rem; padding: 0.9rem; }
          .cp-success-card h2 { font-size: 1.35rem; }
        }
      `}</style>


      <Navbar />

      <div className="main-layout">
        <VerticalAdLeft />

        <div className="cp-wrapper">
          <h1 className="tool-title">Compress PDF</h1>

          {/* ── Drop zone ─────────────────────────────────────────────── */}
          <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="drop-zone-container">

            {/* SUCCESS */}
            {isCompressed ? (
              <div className="cp-success-card">
                <div style={{
                  width: 86, height: 86, borderRadius: "50%",
                  background: "#dcfce7", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  color: "#16a34a", margin: "0 auto 1.25rem",
                  boxShadow: "0 6px 20px rgba(22,163,74,0.18)",
                }}>
                  <PiCheckCircle size={50} />
                </div>

                <h2 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
                  Your PDF is Compressed!
                </h2>
                <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.92rem", marginBottom: 0 }}>
                  Auto-downloading in a few seconds…
                </p>

                {stats && (
                  <>
                    <div className="cp-stats-grid">
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Original</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#374151" }}>{formatSize(stats.original)}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.78rem", color: "#e11d48", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Compressed</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#e11d48" }}>{formatSize(stats.compressed)}</div>
                      </div>
                    </div>
                    <div style={{
                      background: "#f0fdf4", borderRadius: 10,
                      padding: "0.75rem 1rem", color: "#15803d",
                      fontWeight: 700, fontSize: "0.95rem", marginBottom: "1.25rem"
                    }}>
                      🎉 You saved {stats.percent}% of the original file size!
                    </div>
                  </>
                )}

                <button className="cp-btn-primary" style={{ marginBottom: "0.75rem" }} onClick={handleDownload}>
                  ⬇&nbsp;&nbsp;Download Compressed PDF
                </button>
                <div className="cp-action-row">
                  <button className="cp-btn-secondary" onClick={handleShare}>
                    <TbShare3 size={18} /> Share
                  </button>
                  <button className="cp-btn-secondary" onClick={handleReset}>
                    Compress Another
                  </button>
                </div>
              </div>

              /* EMPTY – upload */
            ) : files.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 260 }}>
                <img src="./upload.svg" alt="Upload" style={{ marginBottom: "1.5rem" }} />

                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      background: "white", padding: "0.68rem 1.25rem",
                      border: "1.5px solid #e0e0e0", borderRadius: 9,
                      cursor: "pointer", display: "flex", alignItems: "center",
                      gap: "0.5rem", fontSize: "0.95rem", fontWeight: 600,
                      color: "#333", boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    <PiFiles size={18} />
                    Select PDF File
                    <PiCaretDown size={14} />
                  </button>

                  {isDropdownOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 6px)", left: "50%",
                      transform: "translateX(-50%)", background: "white",
                      border: "1px solid #e5e7eb", borderRadius: 12,
                      boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                      zIndex: 1000, minWidth: 210, overflow: "hidden",
                    }}>
                      {menuItems.map((item, i) => (
                        <button key={i} onClick={item.onClick} className="cp-menu-item">
                          <span style={{ color: "#666", display: "flex", alignItems: "center" }}>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" accept="application/pdf,.pdf"
                    onChange={handleFileChange} style={{ display: "none" }} />
                </div>

                <p style={{ marginTop: "1rem", color: "#9ca3af", fontSize: "0.85rem" }}>
                  Drag &amp; drop a PDF here, or click Select File
                </p>
              </div>

              /* FILE SELECTED */
            ) : (
              <div className="cp-split">

                {/* Preview col */}
                <div className="cp-preview-col">
                  <div style={{
                    background: "white", borderRadius: 16, width: 160, height: 210,
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", boxShadow: "0 8px 28px rgba(0,0,0,0.11)",
                    position: "relative", transition: "transform 0.3s ease",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-5px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <button onClick={removeFile} style={{
                      position: "absolute", top: -11, right: -11,
                      background: "white", border: "1.5px solid #e5e7eb",
                      borderRadius: "50%", width: 30, height: 30,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "#666",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 10,
                    }}>
                      <PiX size={16} />
                    </button>

                    <div style={{ padding: "0.75rem", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <FilePreview file={files[0]} style={{ width: 110, height: 145, borderRadius: 6, objectFit: "cover", marginBottom: "0.75rem" }} />
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {files[0].name}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.2rem" }}>
                        {formatSize(files[0].size)}
                      </span>
                    </div>
                  </div>

                  {isCompressing && (
                    <div style={{ marginTop: "1.75rem", textAlign: "center" }}>
                      <div style={{
                        width: 42, height: 42,
                        border: "3.5px solid #fee2e2",
                        borderTopColor: "#e11d48",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 0.75rem",
                      }} />
                      <p style={{ color: "#e11d48", fontWeight: 700, fontSize: "0.9rem", margin: "0 0 0.25rem" }}>Compressing…</p>
                      <p style={{ color: "#9ca3af", fontSize: "0.78rem", margin: 0 }}>
                        May take a moment for larger files
                      </p>
                    </div>
                  )}
                </div>

                {/* Control col */}
                <div className="cp-control-col">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <div style={{ background: "#fee2e2", color: "#e11d48", padding: "0.5rem", borderRadius: 10, display: "flex" }}>
                      <PiFiles size={22} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1a1a1a" }}>
                      Compression Level
                    </h3>
                  </div>

                  {LEVELS.map((opt) => (
                    <div
                      key={opt.id}
                      className={`cp-level-card ${compressionLevel === opt.id ? "active" : ""}`}
                      onClick={() => setCompressionLevel(opt.id)}
                    >
                      <div style={{ fontWeight: 700, fontSize: "0.84rem", color: compressionLevel === opt.id ? "#e11d48" : "#374151", marginBottom: "0.2rem" }}>
                        {opt.emoji} {opt.label} COMPRESSION
                      </div>
                      <div style={{ fontSize: "0.77rem", color: "#6b7280" }}>{opt.desc}</div>
                      {compressionLevel === opt.id && (
                        <div style={{ position: "absolute", top: "50%", right: "1rem", transform: "translateY(-50%)", color: "#e11d48" }}>
                          <PiCheckCircle size={20} />
                        </div>
                      )}
                    </div>
                  ))}

                  <div style={{ marginTop: "1.5rem" }}>
                    <button
                      className="cp-btn-primary"
                      onClick={handleCompress}
                      disabled={isCompressing}
                    >
                      {isCompressing
                        ? <><div className="cp-spinner" /> Processing…</>
                        : "COMPRESS PDF"
                      }
                    </button>
                  </div>

                  {error && (
                    <div className="cp-error-box">
                      <PiX size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      {error}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1.25rem", opacity: 0.3 }}>
                    <PiUploadSimple size={18} />
                    <PiLink size={18} />
                    <FaGoogleDrive size={16} />
                    <FaDropbox size={16} />
                    <PiClipboard size={18} />
                  </div>
                </div>
              </div>
            )}

            {/* quick-action icons behind upload drop-zone */}
            {files.length === 0 && !isCompressed && (
              <div style={{
                position: "absolute", right: "1rem", top: "90%",
                transform: "translateY(-50%)",
                display: "flex", gap: "0.5rem", opacity: 0.25,
              }}>
                <PiUploadSimple size={20} />
                <PiLink size={20} />
                <FaGoogleDrive size={18} />
                <FaDropbox size={18} />
                <PiClipboard size={20} />
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ marginTop: "3rem", fontFamily: 'Georgia,"Times New Roman",serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>
              Compress your PDF files quickly and reduce file size while maintaining readable quality.
            </p>
            <ul style={{ listStyle: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {[
                "Compress files in seconds with drag-and-drop simplicity",
                "Works on any device — desktop, tablet, or mobile",
                "Trusted by users worldwide for secure and fast compression",
              ].map((t, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <PiCheckCircle size={18} style={{ color: "green", flexShrink: 0 }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Security */}
          <div style={{
            marginTop: "3rem", padding: "1.5rem",
            background: "#f0f9ff", border: "1px solid #cce5ff",
            borderRadius: 12, fontSize: "0.95rem",
            fontFamily: 'Georgia,"Times New Roman",serif',
          }}>
            <strong>Protected. Encrypted. Automatically Deleted.</strong>
            <p style={{ marginTop: "0.5rem", color: "#555" }}>
              Every document you upload is encrypted and automatically deleted after 2 hours. Your data stays yours — always.
            </p>
            <div style={{
              marginTop: "1rem", display: "flex", justifyContent: "space-around",
              alignItems: "center", flexWrap: "wrap", gap: "1rem", filter: "grayscale(100%)",
            }}>
              <img src="/google-cloud-logo.png" alt="Google Cloud" style={{ height: 30 }} />
              <img src="/onedrive-logo.png" alt="OneDrive" style={{ height: 30 }} />
              <img src="/dropbox-logo.png" alt="Dropbox" style={{ height: 30 }} />
              <img src="/norton-logo.png" alt="Norton" style={{ height: 30 }} />
            </div>
          </div>
        </div>

        <VerticalAdRight />
      </div>

      {/* URL Modal */}
      {showUrlModal && (
        <div onClick={() => setShowUrlModal(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "white", padding: "2rem", borderRadius: 14,
            width: "90%", maxWidth: 500, boxShadow: "0 20px 48px rgba(0,0,0,0.22)",
          }}>
            <h3 style={{ marginBottom: "1rem", color: "#1a1a1a" }}>Paste PDF URL</h3>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/document.pdf"
              style={{
                width: "100%", padding: "0.75rem", border: "1.5px solid #e5e7eb",
                borderRadius: 9, fontSize: "0.9rem", marginBottom: "1rem",
                boxSizing: "border-box", outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowUrlModal(false)} style={{
                padding: "0.5rem 1.1rem", border: "1px solid #ccc", borderRadius: 7,
                background: "white", cursor: "pointer", fontWeight: 500,
              }}>Cancel</button>
              <button onClick={handleUrlSubmit} disabled={isUploading} style={{
                padding: "0.5rem 1.1rem", border: "none", borderRadius: 7,
                background: "#e11d48", color: "white",
                cursor: isUploading ? "not-allowed" : "pointer", opacity: isUploading ? 0.7 : 1, fontWeight: 600,
              }}>
                {isUploading ? "Loading…" : "Add PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
      <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={compressedFileBlob} fileName="compressed.pdf" />
      <Footer />
    </div>
  );
}