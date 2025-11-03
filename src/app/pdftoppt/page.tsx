"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
// import { useState } from "react";
import Navbar from "../components/Navbar";

export default function PdfToPptPage() {
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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") { setFile(f); setError(null); }
    else setError("Please upload a valid PDF file.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f?.type === "application/pdf") { setFile(f); setError(null); }
    else setError("Please upload a valid PDF file.");
  };

  const handleConvert = async () => {
    if (!file) { setError("Select a PDF first."); return; }
    setIsConverting(true); setError(null);

    const fd = new FormData();
    fd.append("files", file);

    try {
      const res = await fetch("/api/pdftoppt", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error || "Conversion failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "converted.pptx"; a.click();
      window.URL.revokeObjectURL(url); setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "4rem auto", padding: "0 2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Convert PDF to PowerPoint</h1>
        {error && <div style={{ background: "#ffe6e6", padding: "1rem", color: "#d00" }}>{error}</div>}

        <div onDrop={handleDrop} onDragOver={e => e.preventDefault()} style={{ border: "2px dashed #90EE90", background: "#f0fff0", padding: "4rem", textAlign: "center", borderRadius: "10px", marginBottom: "2rem" }}>
          <i className="fas fa-cloud-upload-alt" style={{ fontSize: "3rem", color: "#888" }}></i>
          <p>Drag & drop a PDF here</p>
          <label style={{ background: "white", padding: "0.5rem 1rem", borderRadius: "5px", border: "1px solid #ccc", cursor: "pointer" }}>
            Select File
            <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: "none" }}/>
          </label>
        </div>

        {file && (
          <div style={{ background: "#f9f9f9", padding: "1rem", borderRadius: "5px", marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
            <span><i className="fas fa-file-pdf" style={{ color: "#d00", marginRight: ".5rem" }} />{file.name}</span>
            <button onClick={() => setFile(null)} style={{ background: "none", border: "none", color: "#c00", cursor: "pointer" }}>
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        )}

        <button onClick={handleConvert} disabled={isConverting} style={{ background: isConverting ? "#ccc" : "#007bff", color: "#fff", padding: "0.6rem 1.2rem", borderRadius: "5px", border: "none", cursor: isConverting ? "not-allowed" : "pointer", fontSize: "1rem" }}>
          {isConverting ? "Converting…" : <>
            <i className="fas fa-file-powerpoint" style={{ marginRight: ".5rem" }} />Convert to PPTX
          </>}
        </button>
      </div>
    </div>
  );
}
