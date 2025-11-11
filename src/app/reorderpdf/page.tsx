"use client";
import { useState, useRef, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function PdfReorderPage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [pageImages, setPageImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectMode, setSelectMode] = useState("individual");
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [pageOrder, setPageOrder] = useState([]);
  const [downloadOption, setDownloadOption] = useState("selected");
  const fileInputRef = useRef(null);

  // Load PDF.js
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  const loadPdf = async (url) => {
    try {
      setIsProcessing(true);
      const loadingTask = window.pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setPageOrder(Array.from({ length: pdf.numPages }, (_, i) => i + 1));

      const images = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.8 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        images.push(canvas.toDataURL());
      }
      setPageImages(images);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Error loading PDF. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleStartEditing = async () => {
    if (pdfFile && pdfUrl) {
      setIsEditingMode(true);
      await loadPdf(pdfUrl);
    }
  };

  const togglePageSelection = (pageNum) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum);
    } else {
      newSelected.add(pageNum);
    }
    setSelectedPages(newSelected);
  };

  const selectPageRange = () => {
    if (rangeStart && rangeEnd && rangeStart <= rangeEnd) {
      const newSelected = new Set(selectedPages);
      for (let i = rangeStart; i <= rangeEnd; i++) {
        newSelected.add(i);
      }
      setSelectedPages(newSelected);
      setRangeStart(null);
      setRangeEnd(null);
    }
  };

  const selectAllPages = () => {
    const allPages = new Set();
    for (let i = 1; i <= totalPages; i++) {
      allPages.add(i);
    }
    setSelectedPages(allPages);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setPageOrder((items) => {
        const oldIndex = items.indexOf(parseInt(active.id));
        const newIndex = items.indexOf(parseInt(over.id));
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const SortablePage = ({ pageNum, imageUrl, index }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: pageNum.toString() });
    const isSelected = selectedPages.has(pageNum);

    const style = {
      border: isSelected ? "3px solid #dc3545" : "2px solid #dee2e6",
      borderRadius: "8px",
      padding: "0.5rem",
      backgroundColor: isSelected ? "#f8d7da" : "white",
      cursor: selectMode === "individual" ? "pointer" : "move",
      position: "relative",
      boxShadow: isSelected ? "0 4px 12px rgba(220, 53, 69, 0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => selectMode === "individual" && togglePageSelection(pageNum)}
      >
        <img
          src={imageUrl}
          alt={`Page ${pageNum}`}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: "4px",
            opacity: isSelected ? 0.7 : 1,
          }}
        />
        <div
          style={{
            textAlign: "center",
            marginTop: "0.5rem",
            fontSize: "0.9rem",
            fontWeight: "bold",
            color: isSelected ? "#dc3545" : "#495057",
          }}
        >
          Page {pageNum}
        </div>
        {isSelected && (
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              backgroundColor: "#dc3545",
              color: "white",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: "bold",
            }}
          >
            ✓
          </div>
        )}
      </div>
    );
  };

  const downloadPdf = async () => {
    if (!pdfDoc || (downloadOption !== "reorder" && selectedPages.size === 0)) {
      alert("Please select at least one page or choose reorder mode.");
      return;
    }

    try {
      setIsProcessing(true);
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
      await new Promise((resolve) => {
        script.onload = resolve;
        document.head.appendChild(script);
      });

      const { PDFDocument } = window.PDFLib;
      const arrayBuffer = await pdfFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      let pagesToCopy;
      if (downloadOption === "reorder") {
        pagesToCopy = pageOrder.map((pageNum) => pageNum - 1);
      } else {
        pagesToCopy = downloadOption === "selected"
          ? Array.from(selectedPages).sort((a, b) => a - b).map((page) => page - 1)
          : Array.from({ length: totalPages }, (_, i) => i).filter(
              (page) => !selectedPages.has(page + 1)
            );
      }

      const copiedPages = await newPdf.copyPages(originalPdf, pagesToCopy);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${downloadOption}_${pdfFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(
        downloadOption === "reorder"
          ? `PDF reordered successfully with ${pageOrder.length} pages.`
          : `PDF modified successfully! ${
              downloadOption === "selected"
                ? `Downloaded ${selectedPages.size} selected pages.`
                : `Downloaded ${totalPages - selectedPages.size} non-selected pages.`
            }`
      );
      setIsProcessing(false);
    } catch (error) {
      console.error("Error modifying PDF:", error);
      alert("Error modifying PDF. Please try again.");
      setIsProcessing(false);
    }
  };

  const goBack = () => {
    setIsEditingMode(false);
    setSelectedPages(new Set());
    setPageImages([]);
    setPdfDoc(null);
    setRangeStart(null);
    setRangeEnd(null);
    setPageOrder([]);
  };

  if (isEditingMode) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
        <style>
          {`
            @media (max-width: 768px) {
              .header-container {
                flex-direction: column !important;
                gap: 1rem !important;
                align-items: stretch !important;
              }
              .header-title {
                font-size: 1.2rem !important;
                text-align: center;
              }
              .header-button {
                width: 100% !important;
              }
              .download-options {
                flex-direction: column !important;
              }
              .main-content {
                flex-direction: column !important;
              }
              .control-panel {
                width: 100% !important;
                position: static !important;
                margin-bottom: 1rem !important;
              }
              .page-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
              }
            }
            @media (max-width: 480px) {
              .page-grid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
              }
              .control-panel h3 {
                font-size: 1rem !important;
              }
              .control-panel h4 {
                font-size: 0.9rem !important;
              }
            }
          `}
        </style>
        <div
          className="header-container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            marginTop: "1rem",
          }}
        >
          <button
            className="header-button"
            onClick={goBack}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ← Back
          </button>
          <h1 className="header-title" style={{ fontSize: "1.5rem", margin: 0 }}>Reorder PDF Page</h1>
          <button
            className="header-button"
            onClick={downloadPdf}
            disabled={isProcessing || (downloadOption !== "reorder" && selectedPages.size === 0)}
            style={{
              backgroundColor:
                (downloadOption === "reorder" || selectedPages.size > 0) && !isProcessing
                  ? "#28a745"
                  : "#6c757d",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "5px",
              cursor:
                (downloadOption === "reorder" || selectedPages.size > 0) && !isProcessing
                  ? "pointer"
                  : "not-allowed",
              fontSize: "1rem",
            }}
          >
            {isProcessing
              ? "Processing..."
              : downloadOption === "reorder"
              ? "Download Reordered PDF"
              : `Download ${downloadOption === "selected" ? "Selected" : "Non-selected"} Pages`}
          </button>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ marginBottom: "0.5rem" }}>Download Option</h4>
          <div className="download-options" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button
              onClick={() => setDownloadOption("selected")}
              style={{
                backgroundColor: downloadOption === "selected" ? "#007bff" : "white",
                color: downloadOption === "selected" ? "white" : "#007bff",
                border: "1px solid #007bff",
                padding: "0.4rem 0.8rem",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "0.9rem",
                flex: 1,
              }}
            >
              Selected Pages
            </button>
            <button
              onClick={() => setDownloadOption("non-selected")}
              style={{
                backgroundColor: downloadOption === "non-selected" ? "#007bff" : "white",
                color: downloadOption === "non-selected" ? "white" : "#007bff",
                border: "1px solid #007bff",
                padding: "0.4rem 0.8rem",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "0.9rem",
                flex: 1,
              }}
            >
              Non-selected Pages
            </button>
            <button
              onClick={() => setDownloadOption("reorder")}
              style={{
                backgroundColor: downloadOption === "reorder" ? "#007bff" : "white",
                color: downloadOption === "reorder" ? "white" : "#007bff",
                border: "1px solid #007bff",
                padding: "0.4rem 0.8rem",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "0.9rem",
                flex: 1,
              }}
            >
              Reorder Pages
            </button>
          </div>
        </div>

        <div className="main-content" style={{ display: "flex", gap: "2rem" }}>
          {/* Control Panel */}
          <div
            className="control-panel"
            style={{
              width: "300px",
              backgroundColor: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "10px",
              height: "fit-content",
              position: "sticky",
              top: "2rem",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Page Selection</h3>

            {/* Selection Mode */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ marginBottom: "0.5rem" }}>Selection Mode</h4>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <button
                  onClick={() => setSelectMode("individual")}
                  style={{
                    backgroundColor: selectMode === "individual" ? "#007bff" : "white",
                    color: selectMode === "individual" ? "white" : "#007bff",
                    border: "1px solid #007bff",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    flex: 1,
                  }}
                >
                  Individual
                </button>
                <button
                  onClick={() => setSelectMode("range")}
                  style={{
                    backgroundColor: selectMode === "range" ? "#007bff" : "white",
                    color: selectMode === "range" ? "white" : "#007bff",
                    border: "1px solid #007bff",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    flex: 1,
                  }}
                >
                  Range
                </button>
              </div>
            </div>

            {/* Range Selection */}
            {selectMode === "range" && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.5rem" }}>Select Page Range</h4>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <input
                    type="number"
                    placeholder="From"
                    min="1"
                    max={totalPages}
                    value={rangeStart || ""}
                    onChange={(e) => setRangeStart(parseInt(e.target.value) || null)}
                    style={{
                      width: "60px",
                      padding: "0.3rem",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      fontSize: "0.9rem",
                    }}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="To"
                    min="1"
                    max={totalPages}
                    value={rangeEnd || ""}
                    onChange={(e) => setRangeEnd(parseInt(e.target.value) || null)}
                    style={{
                      width: "60px",
                      padding: "0.3rem",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
                <button
                  onClick={selectPageRange}
                  disabled={!rangeStart || !rangeEnd || rangeStart > rangeEnd}
                  style={{
                    backgroundColor:
                      rangeStart && rangeEnd && rangeStart <= rangeEnd ? "#28a745" : "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "3px",
                    cursor:
                      rangeStart && rangeEnd && rangeStart <= rangeEnd ? "pointer" : "not-allowed",
                    fontSize: "0.9rem",
                    width: "100%",
                  }}
                >
                  Select Range
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ marginBottom: "0.5rem" }}>Quick Actions</h4>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <button
                  onClick={selectAllPages}
                  style={{
                    backgroundColor: "#ffc107",
                    color: "#212529",
                    border: "none",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    flex: 1,
                  }}
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    flex: 1,
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Selection Summary */}
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "1rem",
                borderRadius: "5px",
                marginBottom: "1rem",
              }}
            >
              <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                <strong>Total Pages:</strong> {totalPages}
              </div>
              <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                <strong>Selected Pages:</strong> {selectedPages.size}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#28a745" }}>
                <strong>Remaining Pages:</strong> {totalPages - selectedPages.size}
              </div>
            </div>

            {/* Instructions */}
            <div
              style={{
                backgroundColor: "#fff3cd",
                padding: "1rem",
                borderRadius: "5px",
                fontSize: "0.9rem",
                border: "1px solid #ffeaa7",
              }}
            >
              <strong>How to use:</strong>
              <br />
              1. Select pages to include/exclude or drag to reorder
              <br />
              2. Choose download option (Selected, Non-selected, or Reorder)
              <br />
              3. Click "Download" to generate the new PDF
            </div>
          </div>

          {/* PDF Pages Grid */}
          <div style={{ flex: 1 }}>
            {isProcessing ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "400px",
                  fontSize: "1.2rem",
                  color: "#666",
                }}
              >
                Loading PDF pages...
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={pageOrder.map(String)}>
                  <div
                    className="page-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "1rem",
                      padding: "1rem",
                    }}
                  >
                    {pageImages.map((imageUrl, index) => (
                      <SortablePage
                        key={pageOrder[index]}
                        pageNum={pageOrder[index]}
                        imageUrl={imageUrl}
                        index={index}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .upload-container {
              padding: 2rem 1rem !important;
            }
            .upload-icon {
              font-size: 2rem !important;
            }
            .upload-text {
              font-size: 1rem !important;
            }
            .main-title {
              font-size: 1.5rem !important;
            }
          }
          @media (max-width: 480px) {
            .upload-container {
              padding: 1.5rem 0.5rem !important;
            }
            .main-title {
              font-size: 1.3rem !important;
            }
          }
        `}
      </style>
      <div style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 1rem" }}>
        <h1 className="main-title" style={{ fontSize: "2rem", marginBottom: "2rem" }}>Reorder PDF</h1>

        <div
          className="upload-container"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: "2px dashed #dc3545",
            backgroundColor: "#fdf2f2",
            borderRadius: "10px",
            padding: "4rem",
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          <div className="upload-icon" style={{ fontSize: "3rem", color: "#dc3545", marginBottom: "1rem" }}>
            📄
          </div>
          <p className="upload-text" style={{ marginTop: "1rem", marginBottom: "1rem", fontSize: "1.1rem" }}>
            Drag and drop a PDF file to edit or reorder pages
          </p>
          <label
            htmlFor="fileInput"
            style={{
              backgroundColor: "white",
              padding: "0.75rem 1.5rem",
              border: "2px solid #dc3545",
              borderRadius: "5px",
              cursor: "pointer",
              display: "inline-block",
              color: "#dc3545",
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            Select PDF File
            <input
              id="fileInput"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {pdfFile && (
          <div style={{ marginBottom: "2rem" }}>
            <div
              style={{
                backgroundColor: "#f9f9f9",
                padding: "1rem",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #e9ecef",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", flex: "1 1 auto" }}>
                <div style={{ fontSize: "1.5rem", color: "#dc3545", marginRight: "0.75rem" }}>
                  📄
                </div>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "1rem", wordBreak: "break-word" }}>{pdfFile.name}</div>
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setPdfFile(null);
                  setPdfUrl("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#dc3545",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  padding: "0.5rem",
                }}
              >
                🗑️
              </button>
            </div>

            <button
              onClick={handleStartEditing}
              style={{
                marginTop: "1rem",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
                width: "100%",
              }}
            >
              Start Editing Pages
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: "3rem",
            padding: "1.5rem",
            backgroundColor: "rgb(253, 242, 242)",
            border: "1px solid red",
            borderRadius: "10px",
            fontSize: "0.95rem",
          }}
        >
          <strong>⚠️ Important:</strong>
          <p style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            This tool allows you to select, delete, or reorder pages in your PDF. Review your changes
            carefully before downloading.
          </p>
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
            <li>Select individual pages or ranges for inclusion/exclusion</li>
            <li>Drag and drop pages to reorder them</li>
            <li>Preview all pages before finalizing</li>
            <li>The modified PDF will be downloaded automatically</li>
          </ul>
        </div>
      </div>
    </>
  );
}