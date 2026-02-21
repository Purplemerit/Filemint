"use client";

import React, { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface FilePreviewProps {
    file: File;
    className?: string;
    style?: React.CSSProperties;
    defaultIcon?: string;
}

export default function FilePreview({ file, className, style, defaultIcon = "/pdf.svg" }: FilePreviewProps) {
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'html'>('image');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let objectUrl: string | null = null;

        const generateThumbnail = async () => {
            if (!file) return;

            // Handle common image types directly
            if (file.type.startsWith("image/")) {
                objectUrl = URL.createObjectURL(file);
                setThumbnail(objectUrl);
                setPreviewType('image');
                return;
            }

            // Handle PDF thumbnail generation
            if (file.type === "application/pdf") {
                setLoading(true);
                setError(false);

                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    const page = await pdf.getPage(1);

                    const viewport = page.getViewport({ scale: 0.5 });
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");

                    if (!context) throw new Error("Canvas context failed");

                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                    }).promise;

                    if (isMounted) {
                        setThumbnail(canvas.toDataURL());
                        setPreviewType('image');
                        setLoading(false);
                    }
                } catch (err) {
                    console.error("Error generating thumbnail:", err);
                    if (isMounted) {
                        setError(true);
                        setLoading(false);
                    }
                }
            }
            // Handle Word (.docx) thumbnail generation
            else if (
                file.name.toLowerCase().endsWith(".docx") ||
                file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ) {
                setLoading(true);
                setError(false);
                try {
                    const mammoth = await import("mammoth");
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });

                    if (isMounted) {
                        setThumbnail(result.value.substring(0, 1500)); // Store a snippet of HTML
                        setPreviewType('html');
                        setLoading(false);
                    }
                } catch (err) {
                    console.error("Error generating docx thumbnail:", err);
                    if (isMounted) {
                        setError(true);
                        setLoading(false);
                    }
                }
            } else {
                // For other types, we just use the default icon
                setError(true);
            }
        };

        generateThumbnail();

        return () => {
            isMounted = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [file]);

    if (loading) {
        return (
            <div
                className={className}
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "4px"
                }}
            >
                <div style={{ width: "20px", height: "20px", border: "2px solid #ccc", borderTopColor: "#333", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                <style dangerouslySetInnerHTML={{ __html: "@keyframes spin { to { transform: rotate(360deg); } }" }} />
            </div>
        );
    }

    if (error || !thumbnail) {
        return (
            <div
                className={className}
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#fff2e6",
                    borderRadius: "4px",
                    border: "1px solid #ffd8b3",
                    padding: "10px"
                }}
            >
                <img
                    src="/word.svg"
                    alt="Word File"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    onError={(e) => {
                        // Final safety if even word.svg is gone
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                    }}
                />
            </div>
        );
    }

    if (previewType === 'html') {
        return (
            <div
                className={className}
                style={{
                    ...style,
                    backgroundColor: "white",
                    padding: "8px",
                    fontSize: "6px",
                    lineHeight: "1.2",
                    color: "#333",
                    overflow: "hidden",
                    border: "1px solid #eee",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    textAlign: "left",
                    fontFamily: "sans-serif"
                }}
                dangerouslySetInnerHTML={{ __html: thumbnail }}
            />
        );
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: "4px",
                ...style
            }}
        >
            <img
                src={thumbnail}
                alt="File Preview"
                style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
            />
        </div>
    );
}
