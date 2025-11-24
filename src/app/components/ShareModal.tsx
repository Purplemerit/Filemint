"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
  PiX, 
  PiCopy, 
  PiCheck,
  PiWhatsappLogo,
  PiTelegramLogo,
  PiEnvelope,
  PiChatCircle,
  PiLink
} from "react-icons/pi";
import { SiTrello, SiSlack } from "react-icons/si";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileBlob: Blob | null;
  fileName: string;
}

export default function ShareModal({ isOpen, onClose, fileBlob, fileName }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get file type from blob or filename
  const getFileType = () => {
    if (!fileBlob || !fileName) return "file";
    
    // Check blob type first
    if (fileBlob.type) {
      if (fileBlob.type.includes('pdf')) return 'PDF';
      if (fileBlob.type.includes('image')) return 'Image';
      if (fileBlob.type.includes('word') || fileBlob.type.includes('document')) return 'Document';
      if (fileBlob.type.includes('sheet') || fileBlob.type.includes('excel')) return 'Spreadsheet';
      if (fileBlob.type.includes('presentation') || fileBlob.type.includes('powerpoint')) return 'Presentation';
      if (fileBlob.type.includes('text')) return 'Text file';
    }
    
    // Fallback to filename extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'PDF';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'svg':
      case 'bmp': return 'Image';
      case 'doc':
      case 'docx': return 'Document';
      case 'xls':
      case 'xlsx': return 'Spreadsheet';
      case 'ppt':
      case 'pptx': return 'Presentation';
      case 'txt': return 'Text file';
      case 'zip':
      case 'rar':
      case '7z': return 'Archive';
      case 'mp3':
      case 'wav':
      case 'ogg': return 'Audio';
      case 'mp4':
      case 'avi':
      case 'mov': return 'Video';
      default: return 'File';
    }
  };

  const fileType = getFileType();

  // Generate share link when modal opens
  useEffect(() => {
    if (isOpen && fileBlob && !shareUrl) {
      generateShareLink();
    }
    // Reset state when modal closes
    if (!isOpen) {
      setShareUrl(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen, fileBlob]);

  const generateShareLink = async () => {
    if (!fileBlob) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", fileBlob, fileName);
      
      const response = await fetch("/api/upload-temp", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      
      const data = await response.json();
      setShareUrl(data.url);
    } catch (err) {
      setError("Failed to generate share link. Please try again.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Failed to copy to clipboard");
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <PiWhatsappLogo size={24} />,
      onClick: () => {
        if (!shareUrl) return;
        const text = `Check out this ${fileType}: ${fileName}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + shareUrl)}`, "_blank");
      }
    },
    {
      name: "Telegram",
      icon: <PiTelegramLogo size={24} />,
      onClick: () => {
        if (!shareUrl) return;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(fileName)}`, "_blank");
      }
    },
    {
      name: "Trello",
      icon: <SiTrello size={20} />,
      onClick: () => {
        copyToClipboard();
      }
    },
    {
      name: "Slack",
      icon: <SiSlack size={20} />,
      onClick: () => {
        copyToClipboard();
      }
    },
    {
      name: "Message",
      icon: <PiChatCircle size={24} />,
      onClick: () => {
        if (!shareUrl) return;
        window.open(`sms:?body=${encodeURIComponent(`Check out this ${fileType}: ${shareUrl}`)}`, "_blank");
      }
    },
    {
      name: "Mail",
      icon: <PiEnvelope size={24} />,
      onClick: () => {
        if (!shareUrl) return;
        const subject = `Shared ${fileType}: ${fileName}`;
        const body = `Here's the ${fileType} I wanted to share with you:\n\n${shareUrl}`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
      }
    },
  ];

  if (!isOpen) return null;

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "450px",
          padding: "1.5rem",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem",
            zIndex: 10,
          }}
        >
          <PiX size={24} />
        </button>

        {/* Title */}
        <h2 style={{
          textAlign: "center",
          fontSize: "1.5rem",
          fontWeight: "600",
          marginBottom: "0.5rem",
          paddingRight: "2rem",
        }}>
          Share {fileType}
        </h2>
        
        <p style={{
          textAlign: "center",
          fontSize: "0.85rem",
          color: "#666",
          marginBottom: "1.5rem",
          wordBreak: "break-word",
          paddingRight: "2rem",
        }}>
          {fileName}
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            padding: "0.75rem",
            borderRadius: "6px",
            marginBottom: "1rem",
            fontSize: "0.85rem",
          }}>
            {error}
            <button
              onClick={generateShareLink}
              style={{
                marginLeft: "0.5rem",
                textDecoration: "underline",
                background: "none",
                border: "none",
                color: "#dc2626",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* URL Copy Section */}
        <div style={{
          backgroundColor: "#f0f4f8",
          borderRadius: "8px",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}>
          <PiLink size={20} style={{ color: "#666", flexShrink: 0 }} />
          <input
            type="text"
            value={isUploading ? "Generating link..." : (shareUrl || "Failed to generate")}
            readOnly
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontSize: "0.85rem",
              color: "#333",
              outline: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          />
          <button
            onClick={copyToClipboard}
            disabled={!shareUrl}
            style={{
              background: "none",
              border: "none",
              cursor: shareUrl ? "pointer" : "not-allowed",
              padding: "0.25rem",
              color: copied ? "#10b981" : "#666",
              flexShrink: 0,
              transition: "color 0.2s",
            }}
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            {copied ? <PiCheck size={20} /> : <PiCopy size={20} />}
          </button>
        </div>

        {/* Share Options */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{
            fontSize: "0.85rem",
            color: "#666",
            marginBottom: "0.75rem",
            fontWeight: "500",
          }}>
            Share in
          </p>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}>
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={option.onClick}
                disabled={!shareUrl}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  border: "none",
                  background: "none",
                  cursor: shareUrl ? "pointer" : "not-allowed",
                  opacity: shareUrl ? 1 : 0.5,
                  borderRadius: "8px",
                  transition: "background-color 0.2s",
                  flex: "1 1 calc(16.666% - 0.5rem)",
                  minWidth: "60px",
                }}
                onMouseEnter={(e) => {
                  if (shareUrl) e.currentTarget.style.backgroundColor = "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span style={{ color: "#333" }}>{option.icon}</span>
                <span style={{ 
                  fontSize: "0.65rem", 
                  color: "#666",
                  textAlign: "center",
                  lineHeight: "1.2",
                }}>
                  {option.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div>
          <p style={{
            fontSize: "0.85rem",
            color: "#666",
            marginBottom: "0.75rem",
            fontWeight: "500",
          }}>
            Instant Download
          </p>
          <div style={{
            display: "flex",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
          }}>
            {shareUrl ? (
              <QRCodeSVG
                value={shareUrl}
                size={180}
                level="M"
                includeMargin
                style={{
                  maxWidth: "100%",
                  height: "auto",
                }}
              />
            ) : (
              <div style={{
                width: "180px",
                height: "180px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                color: "#666",
                fontSize: "0.85rem",
                textAlign: "center",
                padding: "1rem",
              }}>
                {isUploading ? "Generating QR code..." : "No link available"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}