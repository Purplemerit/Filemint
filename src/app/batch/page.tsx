'use client'

import Link from "next/link";
import Navbar from "../components/Navbar";

const batchTools = [
  {
    title: "PDF to Word",
    icon: "fa-regular fa-file-word",
    color: "#E8D5FF",
    route: "/pdftoword",
  },
  {
    title: "Merge PDF",
    icon: "fas fa-upload",
    color: "#D5F5D5",
    route: "/mergepdf",
  },
  {
    title: "Edit PDF",
    icon: "fa-regular fa-edit",
    color: "#FFE5D5",
    route: "/editpdf",
  },
  {
    title: "eSign PDF",
    icon: "fas fa-file-signature",
    color: "#F0D5FF",
    route: "/esignpdf",
  },
  {
    title: "Compare PDF",
    icon: "fas fa-columns",
    color: "#D5E5FF",
    route: "/comparepdf",
  },
  {
    title: "Word to PDF",
    icon: "fas fa-file-pdf",
    color: "#E5F0FF",
    route: "/wordtopdf",
  },
];

export default function BatchProcessingSection() {
  return (<>
    <Navbar />
    <section style={{ padding: "3rem 1rem", textAlign: "center" }}>
      <h2 style={{ fontSize: "1.75rem", marginBottom: "2rem" }}>
        Batch Processing
      </h2>
      <p style={{ marginBottom: "2rem", color: "#555" }}>
        Apply actions to multiple PDFs in one go.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        {batchTools.map((tool, index) => (
          <Link href={tool.route} key={index} style={{ textDecoration: "none" }}>
            <div
              style={{
                backgroundColor: tool.color,
                color: "#666",
                borderRadius: "16px",
                padding: "2rem 1.5rem",
                aspectRatio: "1 / 1",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                cursor: "pointer",
                transition: "transform 0.2s ease",
                maxWidth: "160px",
                minHeight: "140px",
              }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <i
                  className={tool.icon}
                  style={{
                    fontSize: "2rem",
                    color: "#666",
                  }}
                ></i>
              </div>
              <h3
                style={{
                  marginBottom: "0",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  lineHeight: "1.2",
                }}
              >
                {tool.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
    </>
  );
}
