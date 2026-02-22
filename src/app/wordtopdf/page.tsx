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
  status: 'idle' | 'converting' | 'completed' | 'error';
  blob?: Blob;
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
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
        }
      }}
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
        <FilePreview file={item.file} defaultIcon="./word.svg" style={{ width: "100%", height: "100%", borderRadius: '8px' }} />
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

      {item.status === 'converting' && (
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
            backgroundColor: '#e11d48',
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
          background: '#10b981',
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

export default function WordToPdfPage() {
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
  const instructionData = toolData["word-pdf"];

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
    const validFiles = newFiles.filter(f =>
      f.name.toLowerCase().endsWith(".doc") ||
      f.name.toLowerCase().endsWith(".docx") ||
      f.type.includes("word") ||
      f.type.includes("document")
    );

    if (validFiles.length < newFiles.length) {
      alert("Only Word documents (.doc, .docx) are supported.");
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

    const conversionPromises = files.map(async (fileData) => {
      setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'converting' } : f));

      try {
        const formData = new FormData();
        formData.append("files", fileData.file);

        const response = await fetch("/api/wordtopdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Conversion failed");

        const blob = await response.blob();
        setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'completed', blob } : f));
        return { id: fileData.id, blob, name: fileData.file.name };
      } catch (err) {
        setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'error', error: 'Failed' } : f));
        return null;
      }
    });

    const results = await Promise.all(conversionPromises);
    const successfulResults = results.filter((r): r is { id: string; blob: Blob; name: string } => r !== null);

    if (successfulResults.length > 0) {
      if (successfulResults.length === 1) {
        setZipBlob(successfulResults[0].blob);
      } else {
        const zip = new JSZip();
        for (const res of successfulResults) {
          const fileName = res.name.replace(/\.[^/.]+$/, "") + ".pdf";
          zip.file(fileName, res.blob);
        }
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
    a.download = files.length > 1 ? "converted_pdfs.zip" : `converted_${files[0].file.name.replace(/\.[^/.]+$/, "")}.pdf`;
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
      const fileName = urlInput.split("/").pop() || "downloaded.docx";
      addFiles([new File([blob], fileName, { type: blob.type })]);
      setUrlInput("");
      setShowUrlModal(false);
    } catch (error) { alert("Failed to fetch document"); } finally { setIsUploading(false); }
  };

  const handleFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.includes("word") || type.includes("document")) {
            const blob = await item.getType(type);
            addFiles([new File([blob], "clipboard.docx", { type })]);
            break;
          }
        }
      }
    } catch (e) { alert("No Word document in clipboard"); }
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

      <div style={{ display: "flex", maxWidth: "1400px", margin: "4rem auto", padding: "0 2rem", gap: "2rem", alignItems: "flex-start" }}>
        <VerticalAdLeft />

        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "2rem", color: "#1a1a1a", fontFamily: 'Georgia, serif' }}>Word to PDF</h1>

          <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} style={{ border: "3px solid #FF800080", backgroundColor: "rgb(255 234 215)", borderRadius: "12px", padding: "2rem", textAlign: "center", marginBottom: "2rem", position: "relative", minHeight: "280px" }}>
            {isConverted ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32" }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0 }}>Conversion Complete!</h2>
                <button onClick={handleDownload} style={{ backgroundColor: "#e11d48", color: "white", padding: "1rem 2.5rem", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "600", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)" }}>
                  Download {files.length > 1 ? "All (ZIP)" : "PDF File"}
                </button>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button onClick={() => setShowShareModal(true)} style={{ background: "transparent", color: "#666", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><TbShare3 /> Share</button>
                  <button onClick={handleReset} style={{ background: "transparent", color: "#666", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}>Start Over</button>
                </div>
                <RecommendedTools />
              </div>
            ) : files.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px" }}>
                <div style={{ marginBottom: "1.5rem" }}><img src="./upload.svg" alt="Upload" /></div>
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ backgroundColor: "white", padding: "0.6rem 1rem", border: "1px solid #e0e0e0", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#333", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    <PiFiles size={18} /> Select Files <PiCaretDown size={14} />
                  </button>
                  {isDropdownOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, minWidth: "180px" }}>
                      {menuItems.map((item, i) => <button key={i} onClick={item.onClick} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", width: "100%", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.85rem", textAlign: "left" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}><span style={{ color: "#666" }}>{item.icon}</span> {item.label}</button>)}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" multiple accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} style={{ display: "none" }} />
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <button onClick={handleFromDevice} style={{ backgroundColor: "white", border: "1px solid #ddd", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><PiPlus /> Add More</button>
                  <button onClick={handleConvertBatch} disabled={isConvertingBatch} style={{ backgroundColor: "#e11d48", color: "white", border: "none", padding: "0.5rem 1.5rem", borderRadius: "6px", cursor: isConvertingBatch ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: "600", opacity: isConvertingBatch ? 0.7 : 1 }}>{isConvertingBatch ? "Converting..." : `Convert ${files.length} Files`}</button>
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
          </div>

          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>Convert multiple Word documents to PDF simultaneously with high-speed parallel processing.</p>
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {["Convert multiple files at once", "Perfect layout fidelity", "Secure and private processing"].map((t, i) => <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><PiCheckCircle size={18} style={{ color: "green" }} /> {t}</li>)}
            </ul>
            <div style={{ marginTop: "3rem", padding: "1.5rem", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", fontSize: "0.95rem" }}>
              <h4 style={{ marginBottom: "0.5rem", color: "#92400e" }}>💡 Technical Insight</h4>
              <p style={{ color: "#92400e", lineHeight: "1.5", margin: 0 }}>
                Unlike your local computer which has the full Microsoft Office suite installed, web tools must "re-draw" the Word document's XML structure into a High-Fidelity PDF.
                <strong> Why can't we just change the extension?</strong> A .docx file is a collection of XML data, while a .pdf is a fixed-layout binary file. We use a professional rendering engine to ensure your text and layout are reconstructed with pixel-perfect intent.
              </p>
            </div>
          </div>
        </div>
        <VerticalAdRight />
      </div>

      {showUrlModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowUrlModal(false)}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem" }}>Paste Document URL</h3>
            <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "6px", marginBottom: "1rem" }} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowUrlModal(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", background: "white", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleUrlSubmit} disabled={isUploading} style={{ padding: "0.5rem 1rem", border: "none", background: "#e11d48", color: "white", borderRadius: "6px", opacity: isUploading ? 0.7 : 1 }}>{isUploading ? "Loading..." : "Add"}</button>
            </div>
          </div>
        </div>
      )}

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={zipBlob} fileName={files.length > 1 ? "converted_pdfs.zip" : "converted.pdf"} />
      <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
      <Testimonials title="What Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
      <Footer />
    </div>
  );
}