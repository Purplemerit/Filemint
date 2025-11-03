"use client";

// import { useState } from "react";
import Navbar from "../components/Navbar";
import { PDFDocument } from "pdf-lib";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
export default function ComparePdfPage() {
   const { token, isLoading } = useAuth();
  const router = useRouter();

  // ✅ Redirect if not logged in
  // useEffect(() => {
  //   if (!isLoading && !token) {
  //     router.push("/login");
  //   }
  // }, [isLoading, token, router]);

  // if (isLoading || !token) {
  //   return (
  //     <div
  //       style={{
  //         textAlign: "center",
  //         marginTop: "5rem",
  //         fontSize: "1.5rem",
  //         fontWeight: "bold",
  //       }}
  //     >
  //       Checking authentication...
  //     </div>
  //   );
  // }
  const [pdf1, setPdf1] = useState<File | null>(null);
  const [pdf2, setPdf2] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (index: number, file: File | null) => {
    if (!file || file.type !== "application/pdf") return;
    if (index === 1) setPdf1(file);
    else setPdf2(file);
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();

    let text = "";
    for (const page of pages) {
      // Fallback: Just count pages or detect metadata — pdf-lib lacks full text extraction
      text += `Page size: ${page.getSize().width}x${page.getSize().height}\n`;
    }

    return text;
  };

  const comparePDFs = async () => {
    if (!pdf1 || !pdf2) {
      setResult("Please upload both PDFs.");
      return;
    }

    // Basic file comparison (size & page count)
    const [array1, array2] = await Promise.all([
      pdf1.arrayBuffer(),
      pdf2.arrayBuffer(),
    ]);

    const [doc1, doc2] = await Promise.all([
      PDFDocument.load(array1),
      PDFDocument.load(array2),
    ]);

    const pageCount1 = doc1.getPageCount();
    const pageCount2 = doc2.getPageCount();

    if (array1.byteLength === array2.byteLength && pageCount1 === pageCount2) {
      setResult("The PDFs appear to be identical in size and page count.");
    } else {
      setResult(
        `PDFs differ:\n- PDF 1: ${pageCount1} pages (${array1.byteLength} bytes)\n- PDF 2: ${pageCount2} pages (${array2.byteLength} bytes)`
      );
    }
  };

  return (
    <div>
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "4rem auto", padding: "0 2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Compare PDF</h1>

        {[1, 2].map((num) => (
          <div
            key={num}
            style={{
              border: "2px dashed #ADD8E6",
              backgroundColor: "#f0f8ff",
              borderRadius: "10px",
              padding: "2rem",
              textAlign: "center",
              marginBottom: "2rem",
              position: "relative",
            }}
          >
            <i
              className="fas fa-file-pdf"
              style={{ fontSize: "3rem", color: "#888" }}
            ></i>
            <p style={{ marginTop: "1rem", marginBottom: "1rem" }}>
              Upload PDF {num}
            </p>
            <label
              htmlFor={`fileInput${num}`}
              style={{
                backgroundColor: "white",
                padding: "0.5rem 1rem",
                border: "1px solid #ccc",
                borderRadius: "5px",
                cursor: "pointer",
                display: "inline-block",
              }}
            >
              Select PDF {num}
              <input
                id={`fileInput${num}`}
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  handleFileChange(num, e.target.files?.[0] || null)
                }
                style={{ display: "none" }}
              />
            </label>
          </div>
        ))}

        <button
          onClick={comparePDFs}
          disabled={!pdf1 || !pdf2}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "0.6rem 1.2rem",
            borderRadius: "5px",
            border: "none",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          <i className="fas fa-balance-scale" style={{ marginRight: "0.5rem" }}></i>
          Compare PDFs
        </button>

        {result && (
          <div
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              backgroundColor: "#e9f7ef",
              border: "1px solid #c3e6cb",
              borderRadius: "10px",
              whiteSpace: "pre-wrap",
              fontSize: "0.95rem",
            }}
          >
            <strong>Result:</strong>
            <p>{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
