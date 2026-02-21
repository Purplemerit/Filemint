"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  PiX,
  PiCopy,
  PiCheck,
  PiWhatsappLogo,
  PiTelegramLogo,
  PiEnvelope,
  PiChatCircle,
  PiLink,
  PiWarningCircle,
  PiDownloadSimple,
  PiArrowClockwise,
  PiInfo,
} from "react-icons/pi";
import { SiTrello, SiSlack } from "react-icons/si";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileBlob: Blob | null;
  fileName: string;
  /** Optional: pass a triggerDownload fn so the modal can offer "Download instead" */
  onDownload?: () => void;
}

type NotifType = "error" | "warning" | "info" | "success";

interface Notification {
  type: NotifType;
  title: string;
  message: string;
  /** If provided, renders an action button */
  action?: { label: string; onClick: () => void };
}

// ─── helpers ────────────────────────────────────────────────────────────────

const UNSHAREABLE_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/octet-stream", // generic binary – often zips
];

const UNSHAREABLE_EXTS = ["zip", "rar", "7z", "gz", "tar", "bz2"];

function isUnshareable(blob: Blob | null, fileName: string): boolean {
  if (!blob && !fileName) return false;
  if (blob && UNSHAREABLE_TYPES.includes(blob.type)) return true;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return UNSHAREABLE_EXTS.includes(ext);
}

function getFileType(blob: Blob | null, fileName: string): string {
  if (!blob && !fileName) return "file";
  if (blob?.type) {
    if (blob.type.includes("pdf")) return "PDF";
    if (blob.type.includes("image")) return "Image";
    if (blob.type.includes("word") || blob.type.includes("document")) return "Document";
    if (blob.type.includes("sheet") || blob.type.includes("excel")) return "Spreadsheet";
    if (blob.type.includes("presentation") || blob.type.includes("powerpoint")) return "Presentation";
    if (blob.type.includes("text")) return "Text file";
    if (blob.type.includes("zip") || blob.type.includes("rar") || blob.type.includes("7z")) return "Archive";
  }
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "PDF";
    case "png": case "jpg": case "jpeg": case "gif": case "webp": case "svg": case "bmp": return "Image";
    case "doc": case "docx": return "Document";
    case "xls": case "xlsx": return "Spreadsheet";
    case "ppt": case "pptx": return "Presentation";
    case "txt": return "Text file";
    case "zip": case "rar": case "7z": return "Archive";
    case "mp3": case "wav": case "ogg": return "Audio";
    case "mp4": case "avi": case "mov": return "Video";
    default: return "File";
  }
}

// ─── Notification banner component ──────────────────────────────────────────

const notifColors: Record<NotifType, { bg: string; border: string; icon: string; text: string }> = {
  error: { bg: "#fff5f5", border: "#fca5a5", icon: "#dc2626", text: "#7f1d1d" },
  warning: { bg: "#fffbeb", border: "#fcd34d", icon: "#d97706", text: "#78350f" },
  info: { bg: "#eff6ff", border: "#93c5fd", icon: "#2563eb", text: "#1e3a8a" },
  success: { bg: "#f0fdf4", border: "#86efac", icon: "#16a34a", text: "#14532d" },
};

function NotifIcon({ type }: { type: NotifType }) {
  const color = notifColors[type].icon;
  if (type === "error") return <PiWarningCircle size={20} color={color} />;
  if (type === "warning") return <PiWarningCircle size={20} color={color} />;
  return <PiInfo size={20} color={color} />;
}

function NotificationBanner({ notif, onDismiss }: { notif: Notification; onDismiss: () => void }) {
  const c = notifColors[notif.type];
  return (
    <div
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "10px",
        padding: "0.85rem 1rem",
        marginBottom: "1rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.6rem",
        position: "relative",
        animation: "fadeSlideIn 0.25s ease",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: "1px" }}>
        <NotifIcon type={notif.type} />
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: c.text }}>
          {notif.title}
        </p>
        <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: c.text, opacity: 0.85 }}>
          {notif.message}
        </p>
        {notif.action && (
          <button
            onClick={notif.action.onClick}
            style={{
              marginTop: "0.45rem",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: c.icon,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {notif.action.label}
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.1rem",
          color: c.text,
          opacity: 0.5,
          flexShrink: 0,
        }}
        title="Dismiss"
      >
        <PiX size={16} />
      </button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ShareModal({
  isOpen,
  onClose,
  fileBlob,
  fileName,
  onDownload,
}: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notif, setNotif] = useState<Notification | null>(null);

  const fileType = getFileType(fileBlob, fileName);
  const cantShare = isUnshareable(fileBlob, fileName);

  const dismiss = useCallback(() => setNotif(null), []);

  const showNotif = useCallback((n: Notification) => setNotif(n), []);

  // ── Generate share link ──────────────────────────────────────────────────
  const generateShareLink = useCallback(async () => {
    if (!fileBlob) return;

    // Block ZIPs / archives upfront with a friendly message
    if (cantShare) {
      showNotif({
        type: "warning",
        title: "Sharing not available for this file type",
        message:
          "Archive files (ZIP, RAR, etc.) cannot be shared via a link because cloud storage doesn't support them. Please download the file directly.",
        action: onDownload
          ? { label: "Download now →", onClick: () => { onDownload(); onClose(); } }
          : undefined,
      });
      return;
    }

    setIsUploading(true);
    dismiss();

    try {
      const formData = new FormData();
      formData.append("file", fileBlob, fileName);

      const response = await fetch("/api/upload-temp", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let reason = "Upload failed";
        try {
          const json = await response.json();
          reason = json.error || json.message || reason;
        } catch (_e) {
          /* non-JSON body */
        }
        throw new Error(reason);
      }

      const data = await response.json();
      if (!data.url) throw new Error("No URL returned from server");
      setShareUrl(data.url);
    } catch (err: any) {
      const msg: string = err?.message ?? "Unknown error";

      // Detect common server-side refusal for binary/large files
      const isTypeError =
        msg.toLowerCase().includes("type") ||
        msg.toLowerCase().includes("format") ||
        msg.toLowerCase().includes("unsupported");

      const isSizeError =
        msg.toLowerCase().includes("size") ||
        msg.toLowerCase().includes("large") ||
        msg.toLowerCase().includes("limit");

      if (isTypeError) {
        showNotif({
          type: "warning",
          title: "This file type can't be shared via link",
          message:
            "The file format isn't supported for link sharing. Try downloading the file instead.",
          action: onDownload
            ? { label: "Download instead →", onClick: () => { onDownload(); onClose(); } }
            : undefined,
        });
      } else if (isSizeError) {
        showNotif({
          type: "warning",
          title: "File too large to share",
          message:
            "The file exceeds the sharing limit. Please download it directly to your device.",
          action: onDownload
            ? { label: "Download instead →", onClick: () => { onDownload(); onClose(); } }
            : undefined,
        });
      } else {
        showNotif({
          type: "error",
          title: "Couldn't generate share link",
          message:
            "Something went wrong while uploading your file. Check your connection and try again.",
          action: {
            label: "Try again",
            onClick: () => { dismiss(); generateShareLink(); },
          },
        });
      }
    } finally {
      setIsUploading(false);
    }
  }, [fileBlob, fileName, cantShare, onDownload, onClose, dismiss, showNotif]);

  // ── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && fileBlob && !shareUrl) {
      generateShareLink();
    }
    if (!isOpen) {
      setShareUrl(null);
      setNotif(null);
      setCopied(false);
    }
  }, [isOpen, fileBlob]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Copy to clipboard ────────────────────────────────────────────────────
  const copyToClipboard = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showNotif({
        type: "success",
        title: "Link copied!",
        message: "The share link has been copied to your clipboard.",
      });
      setTimeout(() => dismiss(), 3000);
    } catch (_e) {
      showNotif({
        type: "error",
        title: "Clipboard access denied",
        message: "Your browser blocked clipboard access. Please copy the link manually.",
      });
    }
  }, [shareUrl, showNotif, dismiss]);

  // ── Share options ────────────────────────────────────────────────────────
  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <PiWhatsappLogo size={24} />,
      onClick: () => {
        if (!shareUrl) return;
        const text = `Check out this ${fileType}: ${fileName}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + shareUrl)}`, "_blank");
      },
    },
    {
      name: "Telegram",
      icon: <PiTelegramLogo size={24} />,
      onClick: () => {
        if (!shareUrl) return;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(fileName)}`, "_blank");
      },
    },
    {
      name: "Trello",
      icon: <SiTrello size={20} />,
      onClick: copyToClipboard,
    },
    {
      name: "Slack",
      icon: <SiSlack size={20} />,
      onClick: copyToClipboard,
    },
    {
      name: "Message",
      icon: <PiChatCircle size={24} />,
      onClick: () => {
        if (!shareUrl) return;
        window.open(`sms:?body=${encodeURIComponent(`Check out this ${fileType}: ${shareUrl}`)}`, "_blank");
      },
    },
    {
      name: "Mail",
      icon: <PiEnvelope size={24} />,
      onClick: () => {
        if (!shareUrl) return;
        const subject = `Shared ${fileType}: ${fileName}`;
        const body = `Here's the ${fileType} I wanted to share with you:\n\n${shareUrl}`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
      },
    },
  ];

  if (!isOpen) return null;

  // ── Derived ──────────────────────────────────────────────────────────────
  const linkPlaceholder = isUploading
    ? "Generating link…"
    : shareUrl
      ? shareUrl
      : cantShare
        ? "Sharing not supported for this file type"
        : "Link unavailable";

  const linkDisabled = !shareUrl;
  const optionsDisabled = !shareUrl;

  return (
    <>
      {/* Inline keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
        }}
        onClick={onClose}
      >
        {/* Modal card */}
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
          {/* Close */}
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
              color: "#555",
            }}
          >
            <PiX size={24} />
          </button>

          {/* Title */}
          <h2 style={{
            textAlign: "center",
            fontSize: "1.4rem",
            fontWeight: 700,
            marginBottom: "0.3rem",
            paddingRight: "2rem",
            color: "#111",
          }}>
            Share {fileType}
          </h2>
          <p style={{
            textAlign: "center",
            fontSize: "0.82rem",
            color: "#888",
            marginBottom: "1.2rem",
            wordBreak: "break-word",
            paddingRight: "2rem",
          }}>
            {fileName}
          </p>

          {/* ── Notification banner ── */}
          {notif && <NotificationBanner notif={notif} onDismiss={dismiss} />}

          {/* ── ZIP / archive early-bail UI ── */}
          {cantShare && !notif && (
            <div
              style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: "10px",
                padding: "1rem",
                marginBottom: "1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                textAlign: "center",
              }}
            >
              <PiWarningCircle size={28} color="#d97706" />
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", color: "#78350f" }}>
                Archive files can&apos;t be shared via link
              </p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400e" }}>
                ZIP / RAR files are not supported for link sharing. Please download the file to your device instead.
              </p>
              {onDownload && (
                <button
                  onClick={() => { onDownload(); onClose(); }}
                  style={{
                    marginTop: "0.4rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    backgroundColor: "#f59e0b",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.55rem 1.1rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <PiDownloadSimple size={16} />
                  Download instead
                </button>
              )}
            </div>
          )}

          {/* ── URL row ── */}
          <div style={{
            backgroundColor: "#f0f4f8",
            borderRadius: "8px",
            padding: "0.85rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.2rem",
            opacity: cantShare ? 0.5 : 1,
          }}>
            <PiLink size={18} style={{ color: "#888", flexShrink: 0 }} />
            <input
              type="text"
              value={linkPlaceholder}
              readOnly
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: "0.82rem",
                color: shareUrl ? "#333" : "#999",
                outline: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
                fontStyle: shareUrl ? "normal" : "italic",
              }}
            />
            {isUploading ? (
              <span style={{ fontSize: "0.75rem", color: "#aaa", flexShrink: 0 }}>…</span>
            ) : shareUrl ? (
              <button
                onClick={copyToClipboard}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  color: copied ? "#10b981" : "#666",
                  flexShrink: 0,
                  transition: "color 0.2s",
                }}
                title={copied ? "Copied!" : "Copy link"}
              >
                {copied ? <PiCheck size={20} /> : <PiCopy size={20} />}
              </button>
            ) : !cantShare ? (
              <button
                onClick={generateShareLink}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  color: "#888",
                  flexShrink: 0,
                }}
                title="Retry"
              >
                <PiArrowClockwise size={18} />
              </button>
            ) : null}
          </div>

          {/* ── Share options grid ── */}
          <div style={{ marginBottom: "1.4rem" }}>
            <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: "0.65rem", fontWeight: 600 }}>
              Share via
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.35rem", flexWrap: "wrap" }}>
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.onClick}
                  disabled={optionsDisabled}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.65rem 0.5rem",
                    border: "1px solid #f0f0f0",
                    background: "none",
                    cursor: optionsDisabled ? "not-allowed" : "pointer",
                    opacity: optionsDisabled ? 0.4 : 1,
                    borderRadius: "8px",
                    transition: "background-color 0.15s, border-color 0.15s",
                    flex: "1 1 calc(16.666% - 0.5rem)",
                    minWidth: "58px",
                  }}
                  onMouseEnter={(e) => {
                    if (!optionsDisabled) {
                      e.currentTarget.style.backgroundColor = "#f9f9f9";
                      e.currentTarget.style.borderColor = "#e0e0e0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "#f0f0f0";
                  }}
                >
                  <span style={{ color: "#333" }}>{option.icon}</span>
                  <span style={{ fontSize: "0.62rem", color: "#777", textAlign: "center", lineHeight: 1.2 }}>
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── QR code ── */}
          <div>
            <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: "0.65rem", fontWeight: 600 }}>
              Scan to open
            </p>
            <div style={{
              display: "flex",
              justifyContent: "center",
              padding: "1rem",
              backgroundColor: "#f9fafb",
              borderRadius: "10px",
              border: "1px solid #f0f0f0",
            }}>
              {shareUrl ? (
                <QRCodeSVG
                  value={shareUrl}
                  size={170}
                  level="M"
                  includeMargin
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              ) : (
                <div style={{
                  width: 170,
                  height: 170,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  backgroundColor: "#f0f0f0",
                  borderRadius: "8px",
                  color: "#999",
                  fontSize: "0.78rem",
                  textAlign: "center",
                  padding: "1rem",
                }}>
                  {isUploading ? (
                    <>
                      <div style={{
                        width: 28,
                        height: 28,
                        border: "3px solid #ddd",
                        borderTop: "3px solid #999",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }} />
                      <span>Generating…</span>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </>
                  ) : cantShare ? (
                    <>
                      <PiWarningCircle size={24} color="#d97706" />
                      <span style={{ color: "#b45309" }}>Not available for archives</span>
                    </>
                  ) : (
                    <>
                      <PiWarningCircle size={24} color="#aaa" />
                      <span>No link available</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}