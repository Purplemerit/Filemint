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
  PiPlus,
  PiFileDoc,
  PiDownloadSimple
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
import { generateId } from "@/lib/generateId";
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
  result?: Blob;
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
    <>
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
          <FilePreview
            file={item.file}
            defaultIcon="./word.png"
            style={{ width: "100%", height: "100%", borderRadius: '8px' }}
          />
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
              backgroundColor: '#2b579a',
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
      </div>
      <style>{`
          @keyframes loading-stripes {
            from { background-position: 1rem 0; }
            to { background-position: 0 0; }
          }
        `}</style>
    </>
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
  const [downloadFileName, setDownloadFileName] = useState<string>("");
  const instructionData = toolData["word-pdf"] || { title: "How to convert Word to PDF", steps: [] };

  const [isConvertingBatch, setIsConvertingBatch] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const validFiles = newFiles.filter(file =>
      file.type.includes("msword") ||
      file.type.includes("officedocument") ||
      file.name.toLowerCase().endsWith(".doc") ||
      file.name.toLowerCase().endsWith(".docx")
    );
    if (validFiles.length < newFiles.length) {
      setError("Only DOC/DOCX files are supported.");
    }
    const filesWithIds: FileWithId[] = validFiles.map(f => ({
      id: generateId(),
      file: f,
      status: 'idle'
    }));
    setFiles(prev => [...prev, ...filesWithIds]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (files.length <= 1) setIsConverted(false);
  };

  const handleConvertBatch = async () => {
    if (files.length === 0) return;

    setIsConvertingBatch(true);
    setIsConverted(false);
    setZipBlob(null);
    setError(null);

    // Process based on count
    if (files.length === 1) {
      const fileData = files[0];
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
        const contentDisposition = response.headers.get("Content-Disposition");
        const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
        setDownloadFileName(filenameMatch?.[1] || "converted.pdf");
        setZipBlob(blob);
        setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'completed', result: blob } : f));
        setIsConverted(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Conversion failed";
        setError(msg);
        setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'error', error: msg } : f));
      } finally {
        setIsConvertingBatch(false);
      }
    } else {
      // Batch conversion
      try {
        const formData = new FormData();
        files.forEach(f => formData.append("files", f.file));
        setFiles(prev => prev.map(f => ({ ...f, status: 'converting' })));

        const response = await fetch("/api/batch/wordtopdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Batch conversion failed");

        const blob = await response.blob();
        setDownloadFileName("converted_files.zip");
        setZipBlob(blob);
        setFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
        setIsConverted(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Batch conversion failed";
        setError(msg);
        setFiles(prev => prev.map(f => ({ ...f, status: 'error', error: msg })));
      } finally {
        setIsConvertingBatch(false);
      }
    }
  };

  const handleDownload = () => {
    if (!zipBlob) return;
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setZipBlob(null);
    setIsConverted(false);
    setError(null);
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
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
    setIsDropdownOpen(false);
  };

  const handleFromDevice = () => {
    fileInputRef.current?.click();
  };

  const handlePasteUrl = () => {
    setShowUrlModal(true);
    setIsDropdownOpen(false);
  };

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
    } catch (error) {
      alert("Failed to fetch file from URL");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFromClipboard = async () => {
    // Simple clipboard check for word would be hard without specific data types, 
    // but we can try to see if there's a file there.
    alert("Clipboard file extraction is not supported for Word files via this method.");
    setIsDropdownOpen(false);
  };

  const handleShare = () => {
    if (!zipBlob) return;
    setShowShareModal(true);
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: openGoogleDrivePicker },
    { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: openDropboxPicker },
    { icon: <PiClipboard size={18} />, label: "From Clipboard", onClick: handleFromClipboard },
  ];

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      <Navbar />

      <style>{`
          .main-layout {
            display: flex;
            max-width: 1400px;
            margin: 2rem auto;
            padding: 0 1rem;
            gap: 2rem;
            align-items: flex-start;
          }
          .drop-zone-container {
            border: 3px solid rgba(50, 61, 104, 0.3);
            background-color: #f0f7ff;
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            margin-bottom: 2rem;
            position: relative;
            min-height: 280px;
            width: 100%;
            box-sizing: border-box;
          }
          @media (max-width: 1024px) {
            .main-layout {
              flex-direction: column;
              margin: 1rem auto;
            }
            .ad-column {
              display: none !important;
            }
            h1 {
              font-size: 1.5rem !important;
              text-align: center !important;
            }
          }
          @media (max-width: 640px) {
            .drop-zone-container {
              padding: 1.5rem 1rem;
            }
            .action-buttons {
              flex-direction: column;
              width: 100%;
            }
            .action-buttons button {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>
      <div className="main-layout">
        <VerticalAdLeft />

        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "600",
            marginBottom: "2rem",
            textAlign: "left",
            color: "#1a1a1a",
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
            Word to PDF
          </h1>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="drop-zone-container"
          >
            {isConverted ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "1.5rem",
              }}>
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
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0 }}>
                  Conversion Complete!
                </h2>
                <button
                  onClick={handleDownload}
                  style={{
                    backgroundColor: "#e11d48",
                    color: "white",
                    padding: "1rem 2.5rem",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)"
                  }}
                >
                  <PiDownloadSimple size={24} />
                  Download {files.length > 1 ? "All (ZIP)" : "PDF"}
                </button>
                <div className="action-buttons" style={{ display: "flex", gap: "1rem" }}>
                  <button onClick={handleShare} style={{ background: "transparent", color: "#666", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}><TbShare3 /> Share</button>
                  <button onClick={handleReset} style={{ background: "transparent", color: "#666", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}>Start Over</button>
                </div>
              </div>
            ) : files.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px" }}>
                <div style={{ marginBottom: "1.5rem" }}><img src="./upload.svg" alt="Upload Icon" /></div>
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ backgroundColor: "white", padding: "0.6rem 1rem", border: "1px solid #e0e0e0", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: "500", color: "#333", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    <PiFiles size={18} /> Select Word Files <PiCaretDown size={14} />
                  </button>
                  {isDropdownOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, minWidth: "180px", overflow: "hidden" }}>
                      {menuItems.map((item, index) => (
                        <button key={index} onClick={item.onClick} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", width: "100%", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "0.85rem", color: "#333", textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                          <span style={{ color: "#666", display: "flex", alignItems: "center" }}>{item.icon}</span> {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" multiple accept=".doc,.docx" onChange={handleFileChange} style={{ display: "none" }} />
                </div>
              </div>
            ) : (
              <div>
                <div className="action-buttons" style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <button onClick={handleFromDevice} style={{ backgroundColor: "white", border: "1px solid #ddd", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><PiPlus /> Add More</button>
                  <button onClick={handleConvertBatch} disabled={isConvertingBatch} style={{ backgroundColor: "#e11d48", color: "white", border: "none", padding: "0.5rem 1.5rem", borderRadius: "6px", cursor: isConvertingBatch ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: "600", opacity: isConvertingBatch ? 0.7 : 1 }}>
                    {isConvertingBatch ? "Processing..." : `Convert ${files.length} Files`}
                  </button>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={files.map(f => f.id)} strategy={rectSortingStrategy}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
                      {files.map((item) => <SortableFileCard key={item.id} item={item} onRemove={removeFile} />)}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>

          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>Convert Word documents (DOC and DOCX) to high-quality PDF files with perfect formatting.</p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {["Preserves fonts, tables, and layouts", "Supports batch conversion of multiple files", "100% secure and private"].map((text, index) => (
                <li key={index} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><PiCheckCircle size={18} style={{ color: "green", flexShrink: 0 }} /> {text}</li>
              ))}
            </ul>
          </div>
        </div>

        <VerticalAdRight />
      </div>

      {
        showUrlModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowUrlModal(false)}>
            <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginBottom: "1rem" }}>Paste Document URL</h3>
              <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com/document.docx" style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "6px", fontSize: "0.9rem", marginBottom: "1rem", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button onClick={() => setShowUrlModal(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "6px", backgroundColor: "white", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleUrlSubmit} disabled={isUploading} style={{ padding: "0.5rem 1rem", border: "none", borderRadius: "6px", backgroundColor: "#e11d48", color: "white", cursor: isUploading ? "not-allowed" : "pointer", opacity: isUploading ? 0.7 : 1 }}>{isUploading ? "Loading..." : "Add Document"}</button>
              </div>
            </div>
          </div>
        )
      }

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }}>
        {/* How to Convert Word to PDF Section */}
        <div style={{
          margin: "3rem 0",
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}>
          <h2 style={{
            fontSize: "1.75rem",
            fontWeight: "700",
            color: "#1a1a1a",
            textAlign: "center",
            marginBottom: "2.5rem",
          }}>
            How to Convert Word to PDF
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
          }}>
            {[
              {
                step: "1",
                title: "Upload Your Word File",
                description: "Drag and drop your DOC or DOCX file into the upload area, or click \"Select Word Files\" to browse from your device, Google Drive, Dropbox, or paste a URL. You can upload multiple files for batch conversion.",
              },
              {
                step: "2",
                title: "Convert to PDF",
                description: "Once your files are uploaded, click the \"Convert\" button. Our advanced engine preserves all formatting, fonts, tables, images, and layouts — producing a pixel-perfect PDF replica of your original Word document.",
              },
              {
                step: "3",
                title: "Download Your PDF",
                description: "After conversion is complete, download your PDF instantly. For multiple files, you'll receive a convenient ZIP archive. Your converted files are 100% secure and processed on our encrypted servers.",
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "16px",
                  padding: "2rem",
                  border: "1px solid #e2e8f0",
                  transition: "all 0.3s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2b579a, #4b8bd4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  marginBottom: "1.25rem",
                }}>
                  {item.step}
                </div>
                <h3 style={{
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: "0.75rem",
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: "0.9rem",
                  lineHeight: "1.7",
                  color: "#555",
                  margin: 0,
                }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
        <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
          <RecommendedTools />
        </div>
      </div>

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={zipBlob} fileName={downloadFileName} onDownload={handleDownload} />
      <Footer />
    </div>
  );
}
