"use client";

import Navbar from "../components/Navbar";
import { useState, useEffect, useRef } from "react";
import { generateId } from "@/lib/generateId";
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
  PiX
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
import { PiPlus } from "react-icons/pi";
import FilePreview from "../components/FilePreview";
import RecommendedTools from "../components/RecommendedTools";

// Interface for File with ID
interface FileWithId {
  id: string;
  file: File;
}

// Sortable File Card Component
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
        <FilePreview
          file={item.file}
          defaultIcon="./html.png"
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
    </div>
  );
}

export default function HtmlToPdfPage() {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [convertedFileBlob, setConvertedFileBlob] = useState<Blob | null>(null);
  const instructionData = toolData["html-to-pdf"];

  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConverted, setIsConverted] = useState(false);

  const handleDownload = () => {
    if (!convertedFileBlob) return;
    const url = window.URL.createObjectURL(convertedFileBlob);
    const a = document.createElement("a");
    a.href = url;
    const firstFileName = files[0]?.file?.name?.replace(/\.[^/.]+$/, "") || "documents";
    a.download = `converted_${firstFileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Smart auto-download: fires after 10s only if user hasn't clicked manually
  const triggerDownload = useAutoDownload(isConverted && !!convertedFileBlob, handleDownload, 10000);

  const handleReset = () => {
    setFiles([]);
    setConvertedFileBlob(null);
    setIsConverted(false);
    setError(null);
  };

  const handleConvert = async () => {
    if (files.length === 0 && !urlInput.trim()) {
      setError("Please upload at least one HTML file or enter a URL.");
      return;
    }

    setIsConverting(true);
    setError(null);

    const formData = new FormData();
    if (files.length > 0) {
      files.forEach((item) => formData.append("files", item.file));
    } else {
      formData.append("url", urlInput.trim());
    }

    try {
      const response = await fetch("/api/htmltopdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Conversion failed");
      }

      const contentType = response.headers.get("Content-Type");
      if (contentType !== "application/pdf") {
        const errorText = await response.text();
        throw new Error(`Unexpected response: ${errorText}`);
      }

      const blob = await response.blob();
      setConvertedFileBlob(blob);
      setIsConverted(true);
      setShowUrlModal(false);
      setUrlInput("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const filesWithIds = newFiles.map(file => ({
      id: generateId(),
      file
    }));
    setFiles(prev => [...prev, ...filesWithIds]);
  };

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({
    onFilePicked: (file) => {
      addFiles([file]);
      setIsDropdownOpen(false);
      setIsAddDropdownOpen(false);
    },
  });

  const { openPicker: openDropboxPicker } = useDropboxPicker({
    onFilePicked: (file) => {
      addFiles([file]);
      setIsDropdownOpen(false);
      setIsAddDropdownOpen(false);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target as Node)) {
        setIsAddDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.name.endsWith(".html") || file.name.endsWith(".htm")
    );
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        file.name.endsWith(".html") || file.name.endsWith(".htm")
      );
      if (selectedFiles.length > 0) {
        addFiles(selectedFiles);
        setError(null);
      }
    }
    setIsDropdownOpen(false);
    setIsAddDropdownOpen(false);
  };

  const handleFromDevice = () => {
    fileInputRef.current?.click();
  };

  const handleAddFromDevice = () => {
    addFileInputRef.current?.click();
  };

  const handlePasteUrl = async () => {
    setShowUrlModal(true);
    setIsDropdownOpen(false);
    setIsAddDropdownOpen(false);
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    handleConvert();
  };

  const handleGoogleDrive = () => {
    openGoogleDrivePicker();
  };

  const handleDropbox = () => {
    openDropboxPicker();
  };

  const handleFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        if (item.types.includes("text/html")) {
          const blob = await item.getType("text/html");
          const file = new File([blob], "clipboard.html", { type: "text/html" });
          addFiles([file]);
          setError(null);
          break;
        }
      }
    } catch (error) {
      alert("No HTML file found in clipboard or clipboard access denied");
    }
    setIsDropdownOpen(false);
    setIsAddDropdownOpen(false);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((item) => item.id !== id));
    if (files.length === 1) {
      setConvertedFileBlob(null);
      setIsConverted(false);
    }
    setError(null);
  };

  const handleShare = () => {
    if (!convertedFileBlob) {
      alert("Please convert the file first before sharing");
      return;
    }
    setShowShareModal(true);
  };

  const menuItems = [
    { icon: <PiUploadSimple size={18} />, label: "From Device", onClick: handleFromDevice, onClickAdd: handleAddFromDevice },
    { icon: <PiLink size={18} />, label: "Paste URL", onClick: handlePasteUrl, onClickAdd: handlePasteUrl },
    { icon: <FaGoogleDrive size={16} />, label: "Google Drive", onClick: handleGoogleDrive, onClickAdd: handleGoogleDrive },
    { icon: <FaDropbox size={16} />, label: "Drop Box", onClick: handleDropbox, onClickAdd: handleDropbox },
    { icon: <PiClipboard size={18} />, label: "From Clipboard", onClick: handleFromClipboard, onClickAdd: handleFromClipboard },
  ];

  return (
    <div>
      <Navbar />

      <style>{`
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
          .file-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important;
            gap: 1rem !important;
            justify-content: center !important;
          }
          .title-text {
             font-size: 1.5rem !important;
             text-align: center !important;
          }
          .upload-btn-container {
             justify-content: center !important;
          }
          .url-input-group {
             flex-direction: column !important;
             gap: 0.75rem !important;
          }
          .url-input-group input, .url-input-group button {
             width: 100% !important;
          }
          .drop-zone {
             padding: 1rem !important;
             min-height: auto !important;
          }
          .quick-action-icons {
             display: none !important;
          }
        }
      `}</style>

      <div className="main-container" style={{
        display: "flex",
        maxWidth: "1400px",
        margin: "4rem auto",
        padding: "0 2rem",
        gap: "2rem",
        alignItems: "flex-start"
      }}>
        {/* Left Ad */}
        <div className="ad-column">
          <VerticalAdLeft />
        </div>

        {/* Main Content */}
        <div className="content-area" style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 className="title-text" style={{
            fontSize: "2rem",
            fontWeight: "600",
            marginBottom: "2rem",
            textAlign: "left",
            color: "#1a1a1a",
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
            HTML to PDF
          </h1>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="drop-zone"
            style={{
              border: "3px solid #FF800080",
              backgroundColor: "rgb(255 234 215)",
              borderRadius: "12px",
              padding: "2rem",
              textAlign: "center",
              marginBottom: "2rem",
              position: "relative",
              minHeight: "280px",
            }}
          >
            {isConverted ? (
              /* Success State - Download */
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
                  marginBottom: "0.5rem"
                }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0, textAlign: "center" }}>
                  Converted Successfully!
                </h2>
                <p style={{ color: "#666", textAlign: "center", maxWidth: "400px" }}>
                  Your HTML files have been converted to PDF. Download your file below.
                </p>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    onClick={triggerDownload}
                    className="download-button"
                    style={{
                      backgroundColor: "#e11d48", // Brand color
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
                    Download PDF
                  </button>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    onClick={handleShare}
                    style={{
                      background: "transparent",
                      color: "#666",
                      border: "1px solid #ccc",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <TbShare3 /> Share
                  </button>
                  <button
                    onClick={handleReset}
                    style={{
                      background: "transparent",
                      color: "#666",
                      border: "1px solid #ccc",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Convert Another File
                  </button>
                </div>
                <RecommendedTools />
              </div>
            ) : files.length === 0 ? (
              /* Empty State - Show upload UI */
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "300px",
                padding: "1rem 0"
              }}>
                {/* Cloud Upload Icon */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <img src="./upload.svg" alt="Upload Icon" />
                </div>

                {/* Dropdown Button */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", width: "100%", maxWidth: "400px" }}>
                  <div className="url-input-group" style={{ display: "flex", width: "100%", gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Enter Website URL (e.g., https://google.com)"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                        fontSize: "0.9rem",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      }}
                    />
                    <button
                      onClick={handleUrlSubmit}
                      disabled={isConverting}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#FF8000",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: isConverting ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        opacity: isConverting ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isConverting ? (
                        <>
                          <div className="animate-spin" style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid white',
                            borderTopColor: 'transparent',
                            borderRadius: '50%'
                          }} />
                          Processing...
                        </>
                      ) : "Convert URL"}
                    </button>
                  </div>

                  <p style={{ color: "#666", fontSize: "0.9rem", margin: "0.5rem 0" }}>OR</p>

                  <div ref={dropdownRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      style={{
                        backgroundColor: "white",
                        padding: "0.6rem 1rem",
                        border: "1px solid #e0e0e0",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        color: "#333",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      <PiFiles size={18} />
                      Select HTML Files
                      <PiCaretDown size={14} style={{ marginLeft: "0.25rem" }} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 4px)",
                          left: "50%",
                          transform: "translateX(-50%)",
                          backgroundColor: "white",
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          zIndex: 1000,
                          minWidth: "180px",
                          overflow: "hidden",
                        }}
                      >
                        {menuItems.map((item, index) => (
                          <button
                            key={index}
                            onClick={item.onClick}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              padding: "0.7rem 1rem",
                              width: "100%",
                              border: "none",
                              backgroundColor: "transparent",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              color: "#333",
                              textAlign: "left",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f5f5f5";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <span style={{ color: "#666", display: "flex", alignItems: "center" }}>
                              {item.icon}
                            </span>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".html,.htm,text/html"
                      multiple
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Files Uploaded State - Show sortable file cards */
              <div>
                {/* Convert and Share buttons */}
                <div className="upload-btn-container" style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginBottom: "1.5rem",
                }}>
                  <button
                    onClick={handleConvert}
                    disabled={isConverting}
                    style={{
                      backgroundColor: "#e11d48",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: isConverting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      opacity: isConverting ? 0.7 : 1,
                    }}
                  >
                    {isConverting ? (
                      <>
                        <div className="animate-spin" style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid white',
                          borderTopColor: 'transparent',
                          borderRadius: '50%'
                        }} />
                        Converting...
                      </>
                    ) : (
                      "Convert to PDF"
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={!isConverted}
                    style={{
                      backgroundColor: "white",
                      color: "#333",
                      border: "1px solid #e0e0e0",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: !isConverted ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      opacity: !isConverted ? 0.5 : 1
                    }}
                  >
                    <TbShare3 />
                    Share
                  </button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={files.map((f) => f.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="file-grid" style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1.5rem",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      marginBottom: "3rem"
                    }}>
                      {files.map((item) => (
                        <SortableFileCard
                          key={item.id}
                          item={item}
                          onRemove={removeFile}
                        />
                      ))}

                      <div ref={addDropdownRef} style={{ position: "relative" }}>
                        <div
                          onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                          style={{
                            backgroundColor: "#f9fafb",
                            borderRadius: "16px",
                            width: "140px",
                            height: "180px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            cursor: "pointer",
                            border: "2px dashed #d1d5db",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f3f4f6";
                            e.currentTarget.style.borderColor = "#9ca3af";
                            e.currentTarget.style.transform = "translateY(-4px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#f9fafb";
                            e.currentTarget.style.borderColor = "#d1d5db";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "1rem",
                            background: "white",
                            color: "#3b82f6",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                          }}>
                            <PiPlus size={24} />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#4b5563' }}>Add HTML</span>
                        </div>

                        {isAddDropdownOpen && (
                          <div style={{
                            position: "absolute",
                            top: "calc(100% + 8px)",
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            zIndex: 1000,
                            minWidth: "200px",
                            border: "1px solid #e5e7eb",
                            padding: '4px'
                          }}>
                            {menuItems.map((item, index) => (
                              <button
                                key={index}
                                onClick={item.onClickAdd}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.75rem",
                                  padding: "0.75rem 1rem",
                                  width: "100%",
                                  border: "none",
                                  backgroundColor: "transparent",
                                  cursor: "pointer",
                                  fontSize: "0.875rem",
                                  color: "#374151",
                                  borderRadius: '8px',
                                  textAlign: "left",
                                  transition: 'background-color 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <span style={{ color: "#6b7280" }}>{item.icon}</span>
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </SortableContext>
                </DndContext>

                {error && (
                  <p style={{
                    color: "#dc2626",
                    fontSize: "0.85rem",
                    marginTop: "1rem",
                    textAlign: "center"
                  }}>
                    {error}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                    marginTop: "1.5rem",
                    opacity: 0.4,
                  }}
                >
                  <PiUploadSimple size={18} />
                  <PiLink size={18} />
                  <FaGoogleDrive size={16} />
                  <FaDropbox size={16} />
                  <PiClipboard size={18} />
                </div>
              </div>
            )}

            {/* Quick action icons for empty state */}
            {files.length === 0 && (
              <div
                className="quick-action-icons"
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "90%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  gap: "0.5rem",
                  opacity: 0.4,
                }}
              >
                <PiUploadSimple size={20} />
                <PiLink size={20} />
                <FaGoogleDrive size={18} />
                <FaDropbox size={18} />
                <PiClipboard size={20} />
              </div>
            )}
          </div>

          {/* Info Section */}
          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>
              Easily convert your HTML files to PDF format with our seamless online tool.
            </p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {[
                "Convert files in seconds with drag-and-drop simplicity",
                "Works on any device — desktop, tablet, or mobile",
                "Trusted by users worldwide for secure and fast conversion"
              ].map((text, index) => (
                <li key={index} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <PiCheckCircle size={18} style={{ color: "green", flexShrink: 0 }} />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Security Section */}
          <div
            style={{
              marginTop: "3rem",
              padding: "1.5rem",
              backgroundColor: "#f0f9ff",
              border: "1px solid #cce5ff",
              borderRadius: "10px",
              fontSize: "0.95rem",
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            <strong>Protected. Encrypted. Automatically Deleted.</strong>
            <p style={{ marginTop: "0.5rem", color: "#555" }}>
              For years, our platform has helped users convert and manage files
              securely—with no file tracking, no storage, and full privacy. Every
              document you upload is encrypted and automatically deleted after 2
              hours. Your data stays yours—always.
            </p>
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                filter: "grayscale(100%)",
              }}
            >
              <img src="/google-cloud-logo.png" alt="Google Cloud" style={{ height: "30px" }} />
              <img src="/onedrive-logo.png" alt="OneDrive" style={{ height: "30px" }} />
              <img src="/dropbox-logo.png" alt="Dropbox" style={{ height: "30px" }} />
              <img src="/norton-logo.png" alt="Norton" style={{ height: "30px" }} />          </div>
          </div>

          {/* URL Input Modal */}
          {
            showUrlModal && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2000,
                }}
                onClick={() => setShowUrlModal(false)}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "2rem",
                    borderRadius: "10px",
                    width: "90%",
                    maxWidth: "500px",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginBottom: "1rem" }}>Paste HTML URL</h3>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/page.html"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      marginBottom: "1rem",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setShowUrlModal(false)}
                      style={{
                        padding: "0.5rem 1rem",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        backgroundColor: "white",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUrlSubmit}
                      disabled={isConverting}
                      style={{
                        padding: "0.5rem 1rem",
                        border: "none",
                        borderRadius: "6px",
                        backgroundColor: "#e11d48",
                        color: "white",
                        cursor: isConverting ? "not-allowed" : "pointer",
                        opacity: isConverting ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isConverting ? (
                        <>
                          <div className="animate-spin" style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid white',
                            borderTopColor: 'transparent',
                            borderRadius: '50%'
                          }} />
                          Processing...
                        </>
                      ) : "Convert URL"}
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          <ToolInstructions
            title={instructionData.title}
            steps={instructionData.steps as any}
          />
          <Testimonials
            title="What Our Users Say"
            testimonials={testimonialData.testimonials}
            autoScrollInterval={3000}
          />
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
            <RecommendedTools />
          </div>
        </div>

        {/* Right Ad */}
        <VerticalAdRight />
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        fileBlob={convertedFileBlob}
        fileName="converted.pdf"
      />
      <Footer />
    </div>
  );
}