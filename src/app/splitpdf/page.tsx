"use client";
// import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
export default function DeletePdfPagesPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [scale, setScale] = useState(1.2);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectMode, setSelectMode] = useState<"individual" | "range">(
    "individual"
  );
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadOption, setDownloadOption] = useState<"selected" | "non-selected">("selected");

    const downloadPdf = async () => {
    if (!pdfDoc || selectedPages.size === 0) {
        alert("Please select at least one page to download.");
        return;
    }

    try {
        setIsProcessing(true);

        // Load PDF-lib (for PDF manipulation)
        const script = document.createElement("script");
        script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";

        await new Promise((resolve) => {
        script.onload = resolve;
        document.head.appendChild(script);
        });

        // @ts-ignore
        const { PDFDocument } = window.PDFLib;

        // Read the original PDF
        const arrayBuffer = await pdfFile!.arrayBuffer();
        const pdfDocLib = await PDFDocument.load(arrayBuffer);

        // Create new PDF with pages to download (either selected or non-selected)
        const newPdf = await PDFDocument.create();

        // Get pages to include based on the selection
        const pagesToInclude: number[] = downloadOption === "selected" 
        ? Array.from(selectedPages) // Include selected pages
        : Array.from({ length: totalPages }, (_, i) => i + 1).filter(page => !selectedPages.has(page)); // Include non-selected pages

        // Copy the selected pages to the new PDF
        const copiedPages = await newPdf.copyPages(pdfDocLib, pagesToInclude.map(page => page - 1)); // Convert to 0-based index
        copiedPages.forEach((page: any) => newPdf.addPage(page));

        // Generate the modified PDF
        const pdfBytes = await newPdf.save();

        // Download the file
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${downloadOption}_pages_${pdfFile!.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(
        `PDF modified successfully! ${
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

  // Load PDF.js
    useEffect(() => {
    const script = document.createElement("script");
    script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
        // @ts-ignore
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    };
    document.head.appendChild(script);

    // Corrected cleanup function with no return value
    return () => {
        document.head.removeChild(script);
    };
    }, []);


  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  const loadPdf = async (url: string) => {
    try {
      setIsProcessing(true);
      // @ts-ignore
      const loadingTask = window.pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);

      // Render all pages as images for preview
      const images: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.8 }); // Smaller scale for thumbnails

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

  const togglePageSelection = (pageNum: number) => {
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
    const allPages = new Set<number>();
    for (let i = 1; i <= totalPages; i++) {
      allPages.add(i);
    }
    setSelectedPages(allPages);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

const splitPdfAndDownload = async () => {
  if (!pdfDoc || selectedPages.size === 0) {
    alert("Please select at least one page to include.");
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

    // @ts-ignore
    const { PDFDocument } = window.PDFLib;

    const arrayBuffer = await pdfFile!.arrayBuffer();
    const originalPdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const selectedPagesArray = Array.from(selectedPages).sort((a, b) => a - b);
    const pagesToCopy = selectedPagesArray.map((pageNum) => pageNum - 1); // convert to 0-based

    const copiedPages = await newPdf.copyPages(originalPdf, pagesToCopy);
    copiedPages.forEach((page:any) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `split_${pdfFile!.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Split PDF created with ${selectedPages.size} page(s).`);
    setIsProcessing(false);
  } catch (error) {
    console.error("Error splitting PDF:", error);
    alert("Error creating split PDF. Please try again.");
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
  };

  if (isEditingMode) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
        <style>{`
          @media (max-width: 768px) {
            .header-controls {
              flex-direction: column !important;
              gap: 1rem !important;
            }
            .header-controls > * {
              width: 100% !important;
            }
            .main-container {
              flex-direction: column !important;
            }
            .control-panel {
              width: 100% !important;
              position: static !important;
              margin-bottom: 1.5rem;
            }
            .download-options {
              flex-direction: column !important;
            }
            .page-grid {
              grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
            }
          }
          @media (max-width: 480px) {
            .page-grid {
              grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
              gap: 0.75rem !important;
            }
            .control-panel {
              padding: 1rem !important;
            }
          }
        `}</style>
        
        <div
          className="header-controls"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={goBack}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "1rem",
              minWidth: "120px",
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", margin: 0 }}>Delete PDF Pages</h1>
          <button
            onClick={splitPdfAndDownload}
            disabled={selectedPages.size === 0 || isProcessing}
            style={{
              backgroundColor:
                selectedPages.size > 0 && !isProcessing ? "#dc3545" : "#6c757d",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "5px",
              cursor:
                selectedPages.size > 0 && !isProcessing
                  ? "pointer"
                  : "not-allowed",
              fontSize: "1rem",
              minWidth: "120px",
            }}
          >
            {isProcessing
              ? "Processing..."
              : `Delete ${selectedPages.size} Pages`}
          </button>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 3vw, 1rem)" }}>Download Option</h4>
          <div
            className="download-options"
            style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
          >
            <button
              onClick={() => setDownloadOption("selected")}
              style={{
                backgroundColor:
                  downloadOption === "selected" ? "#007bff" : "white",
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
                backgroundColor:
                  downloadOption === "non-selected" ? "#007bff" : "white",
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
          </div>
        </div>

        <div className="main-container" style={{ display: "flex", gap: "2rem" }}>
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
            <h3 style={{ marginTop: 0, marginBottom: "1.5rem", fontSize: "clamp(1rem, 3vw, 1.17rem)" }}>
              Page Selection
            </h3>

            {/* Selection Mode */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Selection Mode</h4>
              <div
                style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
              >
                <button
                  onClick={() => setSelectMode("individual")}
                  style={{
                    backgroundColor:
                      selectMode === "individual" ? "#007bff" : "white",
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
                    backgroundColor:
                      selectMode === "range" ? "#007bff" : "white",
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
                <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Select Page Range</h4>
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
                    onChange={(e) =>
                      setRangeStart(parseInt(e.target.value) || null)
                    }
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
                    onChange={(e) =>
                      setRangeEnd(parseInt(e.target.value) || null)
                    }
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
                      rangeStart && rangeEnd && rangeStart <= rangeEnd
                        ? "#28a745"
                        : "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "3px",
                    cursor:
                      rangeStart && rangeEnd && rangeStart <= rangeEnd
                        ? "pointer"
                        : "not-allowed",
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
              <h4 style={{ marginBottom: "0.5rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>Quick Actions</h4>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
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
                <strong>Selected for Deletion:</strong> {selectedPages.size}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#28a745" }}>
                <strong>Remaining Pages:</strong>{" "}
                {totalPages - selectedPages.size}
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
              1. Click pages to select/deselect
              <br />
              2. Or use range selection
              <br />
              3. Selected pages will be deleted
              <br />
              4. Click "Delete Pages" when ready
            </div>
          </div>

          {/* PDF Pages Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isProcessing ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "400px",
                  fontSize: "clamp(1rem, 3vw, 1.2rem)",
                  color: "#666",
                }}
              >
                Loading PDF pages...
              </div>
            ) : (
              <div
                className="page-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "1rem",
                  padding: "1rem",
                }}
              >
                {pageImages.map((imageUrl, index) => {
                  const pageNum = index + 1;
                  const isSelected = selectedPages.has(pageNum);
                  return (
                    <div
                      key={pageNum}
                      onClick={() =>
                        selectMode === "individual" &&
                        togglePageSelection(pageNum)
                      }
                      style={{
                        border: isSelected
                          ? "3px solid #dc3545"
                          : "2px solid #dee2e6",
                        borderRadius: "8px",
                        padding: "0.5rem",
                        backgroundColor: isSelected ? "#f8d7da" : "white",
                        cursor:
                          selectMode === "individual" ? "pointer" : "default",
                        position: "relative",
                        boxShadow: isSelected
                          ? "0 4px 12px rgba(220, 53, 69, 0.3)"
                          : "0 2px 4px rgba(0,0,0,0.1)",
                        transition: "all 0.2s ease",
                      }}
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
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <style>{`
        @media (max-width: 768px) {
          .upload-container {
            padding: 2rem 1rem !important;
          }
          .file-info-card {
            flex-direction: column !important;
            gap: 1rem;
          }
          .file-info-card > div:first-child {
            width: 100%;
          }
        }
        @media (max-width: 480px) {
          .upload-container {
            padding: 1.5rem 0.75rem !important;
          }
        }
      `}</style>
      <div
        style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 1rem" }}
      >
        <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", marginBottom: "2rem" }}>
          Delete PDF Pages
        </h1>

        <div
          className="upload-container"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: "2px dashed #dc3545",
            backgroundColor: "#fdf2f2",
            borderRadius: "10px",
            padding: "4rem 2rem",
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{ fontSize: "clamp(2rem, 8vw, 3rem)", color: "#dc3545", marginBottom: "1rem" }}
          >
            <i className="fa fa-pdf"></i>
            <i className="fa fa-scissors"></i>
          </div>
          <p
            style={{
              marginTop: "1rem",
              marginBottom: "1rem",
              fontSize: "clamp(0.95rem, 3vw, 1.1rem)",
            }}
          >
            Drag and drop a PDF file to remove pages
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
              fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
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
              className="file-info-card"
              style={{
                backgroundColor: "#f9f9f9",
                padding: "1rem",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #e9ecef",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "1.5rem",
                    color: "#dc3545",
                    marginRight: "0.75rem",
                  }}
                >

                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontWeight: "bold", fontSize: "clamp(0.9rem, 2.5vw, 1rem)", wordBreak: "break-word" }}>
                    {pdfFile.name}
                  </div>
                  <div style={{ fontSize: "clamp(0.8rem, 2vw, 0.9rem)", color: "#666" }}>
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
                  flexShrink: 0,
                }}
              >
                <i className="fa fa-trash" aria-hidden="true"></i>
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
                fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
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
            backgroundColor:  "rgb(253, 242, 242)",
            border: "1px solid red",
            borderRadius: "10px",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
          }}
        >
          <strong>⚠️ Important:</strong>
          <p style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            This tool allows you to permanently delete pages from your PDF.
            Please review your selection carefully before downloading.
          </p>
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
            <li>Select individual pages or ranges of pages</li>
            <li>Preview all pages before deletion</li>
            <li>At least one page must remain in the document</li>
            <li>The modified PDF will be downloaded automatically</li>
          </ul>
        </div>
      </div>
    </>
  );
}