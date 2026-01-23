"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  PiFiles,
  PiLink,
  PiClipboard,
  PiCaretDown,
  PiUploadSimple,
  PiCheckCircle,
  PiX,
  PiArrowsLeftRight
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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// PDF.js worker setup
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// Sortable Item Component
const SortablePage = ({ id, imageUrl, index }: { id: string; imageUrl: string; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    touchAction: "none"
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", position: "relative" }}>
        <img src={imageUrl} style={{ width: "100%", display: "block", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 5, left: 5, background: "rgba(0,0,0.7,0.5)", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" }}>
          {index + 1}
        </div>
      </div>
    </div>
  );
};

export default function ReorderPdfPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [pageOrder, setPageOrder] = useState<string[]>([]); // Array of original index strings "0", "1", etc.
  const [pageDataUrls, setPageDataUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  // Success & Download State
  const [isReordered, setIsReordered] = useState(false);
  const [modifiedBlob, setModifiedBlob] = useState<Blob | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Upload States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const instructionData = toolData["reorder-pdf"];

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Render PDF ---
  const renderPdfPages = async (file: File) => {
    setIsProcessing(true);
    setPageDataUrls([]);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      setTotalPages(pdf.numPages);

      const urls: string[] = [];
      const order: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 }); // Thumbnail size
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
          order.push((i - 1).toString()); // Store original 0-based index as string ID
        }
      }
      setPageDataUrls(urls);
      setPageOrder(order);
      setIsEditingMode(true);
    } catch (error) {
      console.error("Error rendering PDF:", error);
      alert("Failed to read PDF file.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Drag Handler ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPageOrder((items) => {
        const oldIndex = items.indexOf(active.id.toString());
        const newIndex = items.indexOf(over!.id.toString());
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // --- Reorder & Save ---
  const saveReorderedPdf = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      // Map string IDs back to integers
      const newOrderIndices = pageOrder.map(id => parseInt(id));

      const copiedPages = await newPdf.copyPages(pdfDoc, newOrderIndices);
      copiedPages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setModifiedBlob(blob);
      setIsReordered(true);
      setIsEditingMode(false);

    } catch (err) {
      console.error(err);
      alert("Error reordering PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!modifiedBlob) return;
    const url = URL.createObjectURL(modifiedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reordered_${pdfFile?.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-download
  useEffect(() => {
    let tm: NodeJS.Timeout;
    if (isReordered && modifiedBlob) {
      tm = setTimeout(handleDownload, 7000);
    }
    return () => clearTimeout(tm);
  }, [isReordered, modifiedBlob]);

  const reset = () => {
    setPdfFile(null);
    setIsEditingMode(false);
    setIsReordered(false);
    setModifiedBlob(null);
    setPageOrder([]);
    setPageDataUrls([]);
  };

  // --- Handlers ---
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") {
      setPdfFile(f);
      renderPdfPages(f);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
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

  const { openPicker: openGoogleDrivePicker } = useGoogleDrivePicker({ onFilePicked: (f) => { setPdfFile(f); renderPdfPages(f); setIsDropdownOpen(false); } });
  const { openPicker: openDropboxPicker } = useDropboxPicker({ onFilePicked: (f) => { setPdfFile(f); renderPdfPages(f); setIsDropdownOpen(false); } });


  return (
    <div>
      <Navbar />

      <div style={{ display: "flex", maxWidth: "1400px", margin: "4rem auto", padding: "0 2rem", gap: "2rem", alignItems: "flex-start" }}>
        <VerticalAdLeft />

        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "2rem", textAlign: "left", color: "#1a1a1a", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Reorder PDF Pages
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
            {isReordered ? (
              /* Success State */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem", padding: "2rem 0" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32", marginBottom: "0.5rem" }}>
                  <PiCheckCircle size={48} />
                </div>
                <h2 style={{ fontSize: "1.75rem", color: "#333", margin: 0 }}>Reordered Successfully!</h2>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button onClick={handleDownload} style={{ backgroundColor: "#e11d48", color: "white", padding: "1rem 2.5rem", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "600", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "#666" }}>
                    <PiArrowsLeftRight size={20} /> Drag items to reorder
                  </div>

                  <button
                    onClick={saveReorderedPdf}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white", border: "none", padding: "0.7rem 1.5rem",
                      borderRadius: "6px", cursor: "pointer",
                      fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem"
                    }}
                  >
                    {isProcessing ? "Processing..." : "Reorder PDF"}
                  </button>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={pageOrder}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem", maxHeight: "60vh", overflowY: "auto", padding: "10px" }}>
                      {pageOrder.map((pageId, index) => (
                        <SortablePage
                          key={pageId}
                          id={pageId}
                          imageUrl={pageDataUrls[parseInt(pageId)]}
                          index={index}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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
                      <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: "none" }} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Info & Footer */}
          <div style={{ marginTop: "3rem", fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#555" }}>Reorder your PDF pages easily via drag and drop.</p>
            <ul style={{ listStyleType: "none", fontSize: "0.95rem", padding: 0, margin: 0 }}>
              {["Drag and drop pages", "Process in browser", "100% Secure"].map((text, i) => (
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
              <button onClick={handleUrlSubmit} disabled={isUploading} style={{ padding: "0.5rem 1rem", border: "none", background: "#007bff", color: "white", borderRadius: "6px", cursor: "pointer" }}>{isUploading ? "Loading..." : "Add PDF"}</button>
            </div>
          </div>
        </div>
      )}

      <ToolInstructions title={instructionData.title} steps={instructionData.steps as any} />
      <Testimonials title="What Our Users Say" testimonials={testimonialData.testimonials} autoScrollInterval={3000} />
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} fileBlob={modifiedBlob} fileName="reordered.pdf" />
      <Footer />
    </div>
  );
}