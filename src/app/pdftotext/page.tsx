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
  PiPlus
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
import RecommendedTools from "../components/RecommendedTools";
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FilePreview from "../components/FilePreview";

interface FileWithId {
  id: string;
  file: File;
  status: 'idle' | 'extracting' | 'completed' | 'error';
  text?: string;
  error?: string;
}

function SortableFileCard({
  item,
  onRemove,
}: {
  item: FileWithId;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: "white",
        borderRadius: "16px",
        width: "140px",
        height: "180px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: isDragging ? "0 20px 25px -5px rgba(0, 0, 0, 0.1)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        position: "relative",
        border: "1px solid #e5e7eb",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      {...attributes}
      {...listeners}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: "-8px",
          right: "-8px",
          background: "#ef4444",
          border: "2px solid white",
          borderRadius: "50%",
          width: "26px",
          height: "26px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
          color: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        <PiX size={14} />
      </button>

      <div style={{
        width: "100px",
        height: "130px",
        marginBottom: "0.5rem",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px'
      }}>
        <FilePreview file={item.file} style={{ width: "100%", height: "100%", borderRadius: '8px' }} />
      </div>

      <div style={{
        width: '100%',
        padding: '0 0.75rem',
        textAlign: 'center'
      }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: "600",
            color: "#374151",
            maxWidth: "110px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block"
          }}
        >
          {item.file.name}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
          {(item.file.size / 1024 / 1024).toFixed(2)} MB
        </span>
      </div>

      {item.status === 'extracting' && (
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          height: '6px',
          width: '100%',
          backgroundColor: '#f3f4f6',
          borderRadius: '0 0 16px 16px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: '100%',
            backgroundColor: '#D879FD',
            backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
            backgroundSize: '1rem 1rem',
            animation: 'loading-stripes 1s linear infinite'
          }}></div>
        </div>
      )}

      {item.status === 'completed' && (
        <div style={{
          position: 'absolute',
          top: "-8px",
          left: "-8px",
          color: 'white',
          background: '#D879FD',
          borderRadius: '50%',
          padding: '4px',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <PiCheckCircle size={18} />
        </div>
      )}
      <style>{`
        @keyframes loading-stripes {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
}

export default function PdfToTextPage() {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { token, isLoading } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const instructionData = toolData["pdf-to-text"];

  const [isConvertingBatch, setIsConvertingBatch] = useState(false);
  const [isConverted, setIsConverted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (validFiles.length < newFiles.length) {
      alert("Only PDF files are supported.");
    }
    const filesWithIds: FileWithId[] = validFiles.map(f => ({
      id: uuidv4(),
      file: f,
      status: 'idle'
    }));
    setFiles(prev => [...prev, ...filesWithIds]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleConvertBatch = async () => {
    if (files.length === 0) return;

    setIsConvertingBatch(true);
    setIsConverted(false);
    setZipBlob(null);

    const extractionPromises = files.map(async (fileData) => {
      setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'extracting' } : f));

      try {
        const formData = new FormData();
        formData.append("files", fileData.file);

        const response = await fetch("/api/pdftotext", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Extraction failed");

        const text = await response.text();
        setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'completed', text } : f));
        return { id: fileData.id, text, name: fileData.file.name };
      } catch (err) {
        setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'error', error: 'Failed' } : f));
        return null;
      }
    });

    const results = await Promise.all(extractionPromises);
    const successfulResults = results.filter((r): r is { id: string; text: string; name: string } => r !== null);

    if (successfulResults.length > 0) {
      if (successfulResults.length === 1) {
        setZipBlob(new Blob([successfulResults[0].text], { type: "text/plain" }));
      } else {
        const zip = new JSZip();
        successfulResults.forEach(res => {
          const fileName = res.name.replace(/\.[^/.]+$/, "") + ".txt";
          zip.file(fileName, res.text);
        });
        const content = await zip.generateAsync({ type: "blob" });
        setZipBlob(content);
      }
      setIsConverted(true);
    }

    setIsConvertingBatch(false);
  };

  const handleDownload = () => {
    if (!zipBlob) return;
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = files.length > 1 ? "extracted_text_files.zip" : `extracted_${files[0].file.name.replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setZipBlob(null);
    setIsConverted(false);
  };

  const handleCopyOne = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Text copied to clipboard!");
    } catch (err) {
      alert("Failed to copy text");
    }
  };

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      addFiles([file]);
      setIsDropdownOpen(false);
    },
  });

  const { openPicker: openDropboxPicker } = useDropboxPicker({
    onFilePicked: (file) => {
      addFiles([file]);
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
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
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
      const fileName = urlInput.split("/").pop() || "downloaded.pdf";
      addFiles([new File([blob], fileName, { type: "application/pdf" })]);
      setUrlInput("");
      setShowUrlModal(false);
    } catch (error) { alert("Failed to fetch PDF"); } finally { setIsUploading(false); }
  };

  const handleFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        if (item.types.includes("application/pdf")) {
          const blob = await item.getType("application/pdf");
          addFiles([new File([blob], "clipboard.pdf", { type: "application/pdf" })]);
          break;
        }
      }
    } catch (e) { alert("No PDF in clipboard"); }
    setIsDropdownOpen(false);
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
    { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: openDropboxPicker },
    { icon: <PiClipboard size={18} />, label: "From Clipboard", onClick: handleFromClipboard },
  ];

  return (
    <div>
      <Navbar />

      <style>{`
        .main-container {
          display: flex;
          max-width: 1400px;
          margin: 4rem auto;
          padding: 0 1rem;
          gap: 2rem;
          align-items: flex-start;
        }
        .ad-column {
          width: 160px;
          flex-shrink: 0;
        }
        .content-area {
          flex: 1;
          min-width: 0;
        }
        .drop-zone-container {
          border: 3px solid rgba(216, 121, 253, 0.4);
          background-color: #F3E6FF;
          border-radius: 12px;
          padding: 2.5rem 1rem;
          text-align: center;
          position: relative;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .tool-title {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 2rem;
          color: #1a1a1a;
          font-family: Georgia, serif;
          text-align: left;
        }
        @media (max-width: 1024px) {
          .main-container {
            flex-direction: column !important;
            padding: 0 1rem !important;
            margin: 2rem auto !important;
          }
          .ad-column {
            display: none !important;
          }
          .content-area {
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="main-container">
        <div className="ad-column">
          <VerticalAdLeft />
        </div>

        <div className="content-area">
          <h1 className="tool-title">PDF to Text</h1>

          <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="drop-zone-container">
            {isConverted ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem" }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#e8f5e9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2e7d32",
                }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0, fontWeight: "600" }}>Extraction Complete!</h2>
                <button
                  onClick={handleDownload}
                  style={{
                    backgroundColor: "#D879FD",
                    color: "white",
                    padding: "1rem 2.5rem",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(216, 121, 253, 0.3)"
                  }}
                >
                  Download {files.length > 1 ? "All (ZIP)" : "Text File"}
                </button>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button onClick={() => setShowShareModal(true)} style={{ background: "transparent", color: "#666", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><TbShare3 /> Share</button>
                  <button onClick={handleReset} style={{ background: "transparent", color: "#666", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}>Start Over</button>
                </div>

                {files.length === 1 && files[0].text && (
                  <div style={{ marginTop: '2rem', textAlign: 'left', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: "600" }}>Preview extracted text:</h3>
                      <button onClick={() => handleCopyOne(files[0].text!)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: 'white', fontWeight: "500" }}>Copy Text</button>
                    </div>
                    <pre style={{ background: 'white', padding: '1rem', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap', border: '1px solid #ddd', fontSize: '0.85rem', color: "#444", lineHeight: "1.5" }}>{files[0].text}</pre>
                  </div>
                )}
              </div>
            ) : files.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", minHeight: "220px" }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <img src="./upload.svg" alt="Upload" />
                </div>
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      backgroundColor: "#D879FD",
                      padding: "0.6rem 1rem",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "white",
                      boxShadow: "0 2px 4px rgba(216, 121, 253, 0.3)"
                    }}
                  >
                    <PiFiles size={18} /> Select Files <PiCaretDown size={14} style={{ marginLeft: "0.25rem" }} />
                  </button>
                  {isDropdownOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, minWidth: "180px", overflow: "hidden" }}>
                      {menuItems.map((item, i) => (
                        <button key={i} onClick={item.onClick} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", width: "100%", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.85rem", color: "#333", textAlign: "left", transition: "background-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <span style={{ color: "#666", display: "flex", alignItems: "center" }}>{item.icon}</span> {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" multiple accept="application/pdf" onChange={handleFileChange} style={{ display: "none" }} />
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <button onClick={handleFromDevice} style={{ backgroundColor: "white", border: "1px solid #ddd", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "500" }}><PiPlus /> Add More</button>
                  <button
                    onClick={handleConvertBatch}
                    disabled={isConvertingBatch}
                    style={{
                      backgroundColor: "#D879FD",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1.5rem",
                      borderRadius: "6px",
                      cursor: isConvertingBatch ? "not-allowed" : "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      opacity: isConvertingBatch ? 0.7 : 1,
                      boxShadow: "0 4px 6px rgba(216, 121, 253, 0.25)"
                    }}
                  >
                    {isConvertingBatch ? "Extracting..." : `Extract ${files.length} Files`}
                  </button>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={files.map(f => f.id)} strategy={rectSortingStrategy}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
                      {files.map(item => <SortableFileCard key={item.id} item={item} onRemove={removeFile} />)}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {files.length === 0 && (
              <div style={{ position: "absolute", right: "1rem", top: "90%", transform: "translateY(-50%)", display: "flex", gap: "0.5rem", opacity: 0.4 }}>
                <PiUploadSimple size={20} /> <PiLink size={20} /> <FaGoogleDrive size={18} /> <FaDropbox size={18} /> <PiClipboard size={20} />
              </div>
            )}
          </div>

          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>
              Extract plain text from multiple PDFs simultaneously with high-speed parallel processing.
            </p>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
              {["Extract text from multiple files", "Supports any PDF structure", "Secure and private extraction"].map((t, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <PiCheckCircle size={18} style={{ color: "green", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.95rem", color: "#333" }}>{t}</span>
                </li>
              ))}
            </ul>
            <div style={{
              marginTop: "3rem",
              padding: "1.5rem",
              backgroundColor: "#f0f9ff",
              border: "1px solid #cce5ff",
              borderRadius: "10px",
              fontSize: "0.95rem"
            }}>
              <h4 style={{ marginBottom: "0.5rem", color: "#1e40af", fontWeight: "600" }}>💡 Technical Insight</h4>
              <p style={{ color: "#1e3a8a", lineHeight: "1.6", margin: 0 }}>
                Plain text extraction removes formatting, images, and layout, giving you raw content that is perfect for data analysis, search indexing, or re-purposing content across different platforms.
              </p>
            </div>
          </div>
        </div>

        <div className="ad-column">
          <VerticalAdRight />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 2rem 4rem' }}>
        <RecommendedTools />
      </div>

      {showUrlModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowUrlModal(false)}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem", fontFamily: "Georgia, serif" }}>Paste PDF URL</h3>
            <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com/document.pdf" style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "6px", marginBottom: "1rem" }} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowUrlModal(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", background: "white", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              <button
                onClick={handleUrlSubmit}
                disabled={isUploading}
                style={{
                  padding: "0.5rem 1rem",
                  border: "none",
                  background: "#D879FD",
                  color: "white",
                  borderRadius: "6px",
                  cursor: isUploading ? "not-allowed" : "pointer",
                  opacity: isUploading ? 0.7 : 1
                }}
              >
                {isUploading ? "Loading..." : "Add PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={zipBlob} fileName={files.length > 1 ? "extracted_text.zip" : "extracted.txt"} />
      <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
      <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
      <Footer />
    </div>
  );
}