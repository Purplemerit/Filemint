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
  PiPlus,
  PiCaretDown,
  PiUploadSimple,
  PiCheckCircle,
  PiX
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
          cursor: "grab",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent drag start when clicking delete
            onRemove(item.id);
          }}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            background: "rgba(255, 255, 255, 1)",
            border: "none",
            borderRadius: "50%",
            width: "25px",
            height: "25px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "black",
            zIndex: 10,
          }}
        >
          <PiX size={18} />
        </button>

        <FilePreview file={item.file} defaultIcon="./jpg.png" style={{ width: "80px", height: "100px", marginBottom: "0.5rem" }} />
        <p
          style={{
            fontSize: "0.75rem",
            color: "#333",
            textAlign: "center",
            padding: "0 5px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
            margin: 0,
          }}
        >
          {item.file.name}
        </p>
      </div>
    </div>
  );
}
export default function JpgToPdfPage() {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [convertedFileBlob, setConvertedFileBlob] = useState<Blob | null>(null);
  const instructionData = toolData["jpg-to-pdf"];

  const [isConverting, setIsConverting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isConverted, setIsConverted] = useState(false);

  const handleDownload = () => {
    if (!convertedFileBlob) return;
    const url = window.URL.createObjectURL(convertedFileBlob);
    const a = document.createElement("a");
    a.href = url;
    const firstFileName = files[0]?.file?.name?.replace(/\.[^/.]+$/, "") || "images";
    a.download = `converted_${firstFileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Auto-download effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isConverted && convertedFileBlob) {
      timeoutId = setTimeout(() => {
        handleDownload();
      }, 7000); // 7 seconds delay
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isConverted, convertedFileBlob]);

  const handleReset = () => {
    setFiles([]);
    setConvertedFileBlob(null);
    setIsConverted(false);
    setError(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setError("Please upload at least one JPG file.");
      return;
    }

    setIsConverting(true);
    setError(null);

    const formData = new FormData();
    files.forEach((item) => formData.append("files", item.file));

    try {
      const response = await fetch("/api/jpgtopdf", {
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const filesWithIds = newFiles.map(file => ({
      id: crypto.randomUUID(),
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
      file.type === "image/jpeg" || file.type === "image/jpg" ||
      file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg")
    );
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        file.type === "image/jpeg" || file.type === "image/jpg" ||
        file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg")
      );
      if (selectedFiles.length > 0) {
        addFiles(selectedFiles);
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

    try {
      setIsUploading(true);
      const response = await fetch(urlInput);
      const blob = await response.blob();

      if (!blob.type.includes("image/jpeg") && !blob.type.includes("image/jpg")) {
        alert("URL must point to a JPG/JPEG file");
        return;
      }

      const fileName = urlInput.split("/").pop() || "downloaded.jpg";
      const file = new File([blob], fileName, { type: "image/jpeg" });
      addFiles([file]);
      setUrlInput("");
      setShowUrlModal(false);
    } catch (error) {
      alert("Failed to fetch file from URL");
    } finally {
      setIsUploading(false);
    }
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
        for (const type of item.types) {
          if (type.includes("image/jpeg") || type.includes("image/jpg")) {
            const blob = await item.getType(type);
            const file = new File([blob], "clipboard.jpg", { type: "image/jpeg" });
            addFiles([file]);
            break;
          }
        }
      }
    } catch (error) {
      alert("No JPG image found in clipboard or clipboard access denied");
    }
    setIsDropdownOpen(false);
    setIsAddDropdownOpen(false);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((item) => item.id !== id));
    setIsConverted(false);
  };

  const handleShare = () => {
    if (!convertedFileBlob) {
      alert("Please convert the files first before sharing");
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

      <div style={{
        display: "flex",
        maxWidth: "1400px",
        margin: "4rem auto",
        padding: "0 2rem",
        gap: "2rem",
        alignItems: "flex-start"
      }}>
        {/* Left Ad */}
        <VerticalAdLeft />

        {/* Main Content */}
        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "600",
            marginBottom: "2rem",
            textAlign: "left",
            color: "#1a1a1a",
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
            JPG to PDF
          </h1>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
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
                  Your JPG images have been converted to PDF. Download your file below.
                </p>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    onClick={handleDownload}
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
              </div>
            ) : files.length === 0 ? (
              /* Empty State - Show upload UI */
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "300px",
                minHeight: "220px",
              }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <img src="./upload.svg" alt="Upload Icon" />
                </div>

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
                    Select Files
                    <PiCaretDown size={14} style={{ marginLeft: "0.25rem" }} />
                  </button>

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

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,image/jpeg"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            ) : (
              /* Files Uploaded State - Show file cards */
              <div>
                <div style={{
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
                    {isConverting ? "Converting..." : "Convert to PDF"}
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
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}>
                      {files.map((item, index) => (
                        <SortableFileCard
                          key={item.id}
                          item={item}
                          onRemove={removeFile}
                        />
                      ))}

                      {/* Add Files Card */}
                      <div ref={addDropdownRef} style={{ position: "relative" }}>
                        <div
                          onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
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
                            cursor: "pointer",
                            border: "2px dashed #ccc",
                            padding: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              border: "2px dashed #3b82f6",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <PiPlus size={20} style={{ color: "#3b82f6" }} />
                          </div>
                          <p style={{
                            fontSize: "0.55rem",
                            color: "#000000ff",
                            marginTop: "0.5rem",
                            textAlign: "center",
                            maxWidth: "120px",
                          }}>
                            Add more JPG images
                          </p>
                        </div>

                        {/* Add Files Dropdown */}
                        {isAddDropdownOpen && (
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
                                onClick={item.onClickAdd}
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

                        <input
                          ref={addFileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,image/jpeg"
                          multiple
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
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

            {files.length === 0 && (
              <div
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
              Easily convert your JPG images into a single PDF document with our seamless online tool.
            </p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {[
                "Convert multiple images at once",
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
        </div>

        {/* Right Ad */}
        <VerticalAdRight />
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
              <h3 style={{ marginBottom: "1rem" }}>Paste Image URL</h3>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
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
                  disabled={isUploading}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "#007bff",
                    color: "white",
                    cursor: isUploading ? "not-allowed" : "pointer",
                    opacity: isUploading ? 0.7 : 1,
                  }}
                >
                  {isUploading ? "Loading..." : "Add Image"}
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
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        fileBlob={convertedFileBlob}
        fileName="converted.pdf"
      />
      <Footer />
    </div >
  );
}