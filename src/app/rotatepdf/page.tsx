'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import React from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import Navbar from '../components/Navbar';

export default function RotatePdfClient() {
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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [rotatedBlobUrl, setRotatedBlobUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
      setRotatedBlobUrl(null);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
      setRotatedBlobUrl(null);
    } else {
      setError('Only PDF files are supported.');
    }
  };

  const rotatePdf = async () => {
    if (!pdfFile) return;

    setLoading(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotation) % 360));
      });

      const rotatedBytes = await pdfDoc.save();
      const blob = new Blob([rotatedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setRotatedBlobUrl(url);
    } catch (err) {
      setError('Failed to rotate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadRotatedPdf = () => {
    if (!rotatedBlobUrl) return;

    const a = document.createElement('a');
    a.href = rotatedBlobUrl;
    a.download = 'rotated.pdf';
    a.click();
  };

  return (
    <div>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      <Navbar />

      <div style={{ maxWidth: '900px', margin: '4rem auto', padding: '0 2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Rotate PDF</h1>

        {error && (
          <div
            style={{
              backgroundColor: '#ffe6e6',
              padding: '1rem',
              borderRadius: '5px',
              marginBottom: '1rem',
              color: '#d00',
            }}
          >
            {error}
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: '2px dashed #90EE90',
            backgroundColor: '#f0fff0',
            borderRadius: '10px',
            padding: '4rem',
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          <i className="fas fa-file-pdf" style={{ fontSize: '3rem', color: '#888' }}></i>
          <p style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            Drag and drop a PDF file here
          </p>
          <label
            htmlFor="fileInput"
            style={{
              backgroundColor: 'white',
              padding: '0.5rem 1rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'inline-block',
            }}
          >
            Select PDF File
            <input
              id="fileInput"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {pdfFile && (
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                backgroundColor: '#f9f9f9',
                padding: '0.75rem 1rem',
                borderRadius: '5px',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>
                <i
                  className="fas fa-file-pdf"
                  style={{ color: '#007bff', marginRight: '0.5rem' }}
                ></i>
                {pdfFile.name}
              </span>
              <button
                onClick={() => {
                  setPdfFile(null);
                  setRotatedBlobUrl(null);
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c00',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="rotation" style={{ marginRight: '0.5rem' }}>
                Rotate:
              </label>
              <select
                id="rotation"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                style={{
                  padding: '0.4rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              >
                <option value={90}>90°</option>
                <option value={180}>180°</option>
                <option value={270}>270°</option>
              </select>
            </div>

            <button
              onClick={rotatePdf}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
              }}
            >
              <i className="fas fa-sync-alt" style={{ marginRight: '0.5rem' }}></i>
              {loading ? 'Processing...' : 'Rotate PDF'}
            </button>
          </div>
        )}

        {rotatedBlobUrl && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={downloadRotatedPdf}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '5px',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              <i className="fas fa-download" style={{ marginRight: '0.5rem' }}></i>
              Download Rotated PDF
            </button>
          </div>
        )}

        <div style={{ marginTop: '3rem' }}>
          <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
            Quickly rotate your PDF pages clockwise and download the corrected version.
          </p>
        </div>

        <div
          style={{
            marginTop: '3rem',
            padding: '1.5rem',
            backgroundColor: '#f0f9ff',
            border: '1px solid #cce5ff',
            borderRadius: '10px',
            fontSize: '0.95rem',
          }}
        >
          <strong>Private. Secure. Auto-deleted.</strong>
          <p style={{ marginTop: '0.5rem' }}>
            Your files are processed in the browser and not stored. Instant and safe.
          </p>
        </div>
      </div>
    </div>
  );
}
