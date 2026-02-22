'use client'

import Link from "next/link";
import Navbar from "../components/Navbar";

import {
  PiFiles,
  PiPlusCircle,
  PiNotePencil,
  PiSignature,
  PiColumns,
  PiFilePdf
} from "react-icons/pi";
import RecommendedTools from "../components/RecommendedTools";
import Footer from "../components/footer";

const batchTools = [
  {
    title: "PDF to Word",
    icon: <PiFilePdf size={40} />,
    color: "linear-gradient(135deg, #E8D5FF 0%, #D1BFFF 100%)",
    route: "/pdftoword",
  },
  {
    title: "Merge PDF",
    icon: <PiPlusCircle size={40} />,
    color: "linear-gradient(135deg, #D5F5D5 0%, #BFF0BF 100%)",
    route: "/mergepdf",
  },
  {
    title: "Edit PDF",
    icon: <PiNotePencil size={40} />,
    color: "linear-gradient(135deg, #FFE5D5 0%, #FFD1BFFF 100%)",
    route: "/editpdf",
  },
  {
    title: "eSign PDF",
    icon: <PiSignature size={40} />,
    color: "linear-gradient(135deg, #F0D5FF 0%, #E0BFFF 100%)",
    route: "/esignpdf",
  },
  {
    title: "Compare PDF",
    icon: <PiColumns size={40} />,
    color: "linear-gradient(135deg, #D5E5FF 0%, #BFCFFF 100%)",
    route: "/comparepdf",
  },
  {
    title: "Word to PDF",
    icon: <PiFilePdf size={40} />,
    color: "linear-gradient(135deg, #E5F0FF 0%, #BFD5FF 100%)",
    route: "/wordtopdf",
  },
];

export default function BatchProcessingSection() {
  return (<>
    <Navbar />
    <section className="main-layout" style={{
      flexDirection: 'column',
      alignItems: 'center',
      padding: '4rem 2rem',
      background: 'linear-gradient(180deg, #fff 0%, #f9fafb 100%)',
      minHeight: '80vh'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{
          fontSize: "3rem",
          fontWeight: "800",
          marginBottom: "1rem",
          color: "#111827",
          letterSpacing: '-0.025em'
        }}>
          Batch Processing
        </h1>
        <p style={{
          fontSize: "1.25rem",
          color: "#4b5563",
          maxWidth: "600px",
          margin: "0 auto",
          fontFamily: 'Inter, sans-serif'
        }}>
          Save time by applying actions to multiple documents simultaneously. Professional-grade tools at your fingertips.
        </p>
      </div>

      <div
        className="tools-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '2rem',
          maxWidth: "1100px",
          width: '100%',
          margin: '0 auto'
        }}
      >
        {batchTools.map((tool, index) => (
          <Link href={tool.route} key={index} style={{ textDecoration: "none" }}>
            <div
              className="batch-tool-card"
              style={{
                background: tool.color,
                color: "#1f2937",
                borderRadius: "24px",
                padding: "2.5rem 1.5rem",
                height: '100%',
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
              }}
            >
              <div style={{
                marginBottom: "1.5rem",
                background: 'rgba(255, 255, 255, 0.3)',
                padding: '1.5rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
              }}>
                {tool.icon}
              </div>
              <h3
                style={{
                  fontSize: "1.35rem",
                  fontWeight: "700",
                  lineHeight: "1.3",
                  color: '#111827',
                  margin: 0
                }}
              >
                {tool.title}
              </h3>
              <p style={{
                marginTop: '0.75rem',
                fontSize: '0.9rem',
                color: 'rgba(17, 24, 39, 0.7)',
                fontWeight: '500'
              }}>
                Actionable batch conversion
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: '6rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <RecommendedTools />
      </div>
    </section>
    <Footer />
  </>
  );
}
