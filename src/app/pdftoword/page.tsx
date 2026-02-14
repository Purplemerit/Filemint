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
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
      {...attributes}
      {...listeners}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "120px",
          height: "140px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          position: "relative",
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
            top: "4px",
            right: "4px",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "50%",
            width: "22px",
            height: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          <PiX size={14} />
        </button>

        <img
          src="./pdf.svg"
          alt="PDF"
          style={{ width: "35px", height: "45px", marginBottom: "0.5rem" }}
        />
        <span
          style={{
            fontSize: "0.65rem",
            color: "#666",
            maxWidth: "100px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: "0 0.5rem",
            textAlign: "center"
          }}
        >
          {item.file.name}
        </span>

        {item.status === 'converting' && (
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            height: '4px',
            width: '100%',
            backgroundColor: '#f3f3f3',
            borderRadius: '0 0 8px 8px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: '50%',
              backgroundColor: '#e11d48',
              animation: 'loading 1s linear infinite'
            }}></div>
          </div>
        )}

        {item.status === 'completed' && (
          <div style={{
            position: 'absolute',
            top: 2,
            left: 2,
            color: '#2e7d32'
          }}>
            <PiCheckCircle size={18} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

export default function PdfToWordPage() {
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
  const instructionData = toolData["pdf-to-word"];

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

    // Process all files in parallel
    const conversionPromises = files.map(async (fileData) => {
      setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'converting' } : f));

      try {
        const formData = new FormData();
        formData.append("files", fileData.file);

        const response = await fetch("/api/pdftoword", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Conversion failed");

        const blob = await response.blob();
        setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'completed', result: blob } : f));
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
        successfulResults.forEach(res => {
          const fileName = res.name.replace(/\.[^/.]+$/, "") + ".docx";
          zip.file(fileName, res.blob);
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
    a.download = files.length > 1 ? "converted_files.zip" : `converted_${files[0].file.name.replace(/\.[^/.]+$/, "")}.docx`;
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
      if (blob.type !== "application/pdf") {
        alert("URL must point to a PDF file");
        return;
      }
      const fileName = urlInput.split("/").pop() || "downloaded.pdf";
      addFiles([new File([blob], fileName, { type: "application/pdf" })]);
      setUrlInput("");
      setShowUrlModal(false);
    } catch (error) {
      alert("Failed to fetch PDF from URL");
    } finally {
      setIsUploading(false);
    }
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
    } catch (error) {
      alert("No PDF found in clipboard or clipboard access denied");
    }
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
    <div>
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
            border: 3px solid rgba(216, 121, 253, 0.5);
            backgroundColor: rgb(243, 230, 255);
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
              padding: 1rem;
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
            PDF to Word
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
                  Batch Complete!
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
                    boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)"
                  }}
                >
                  Download {files.length > 1 ? "All (ZIP)" : "Word Doc"}
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
                    <PiFiles size={18} /> Select Files <PiCaretDown size={14} />
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
                  <input ref={fileInputRef} type="file" multiple accept="application/pdf,.pdf" onChange={handleFileChange} style={{ display: "none" }} />
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
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>Batch convert multiple PDFs to Word simultaneously with extreme layout accuracy.</p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {["High-speed parallel processing", "Maintains complex layouts and images", "Secure and encrypted transfers"].map((text, index) => (
                <li key={index} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><PiCheckCircle size={18} style={{ color: "green", flexShrink: 0 }} /> {text}</li>
              ))}
            </ul>
          </div>
        </div>

        <VerticalAdRight />
      </div>

      {showUrlModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowUrlModal(false)}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "10px", width: "90%", maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem" }}>Paste PDF URL</h3>
            <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com/document.pdf" style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "6px", fontSize: "0.9rem", marginBottom: "1rem", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowUrlModal(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "6px", backgroundColor: "white", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleUrlSubmit} disabled={isUploading} style={{ padding: "0.5rem 1rem", border: "none", borderRadius: "6px", backgroundColor: "#e11d48", color: "white", cursor: isUploading ? "not-allowed" : "pointer", opacity: isUploading ? 0.7 : 1 }}>{isUploading ? "Loading..." : "Add PDF"}</button>
            </div>
          </div>
        </div>
      )}

      <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
      <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={zipBlob} fileName={files.length > 1 ? "converted_files.zip" : "converted.docx"} />
      <Footer />
    </div>
  );
}