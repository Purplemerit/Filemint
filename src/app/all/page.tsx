"use client";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";

// ------------------- TOOLS DATA -------------------
const pdfOperations = [
  {
    title: "Merge PDF",
    description:
      "Combine multiple PDF files into one organized document in seconds — fast, simple, and secure.",
    route: "/mergepdf",
    image: "./images/merge.svg",
    color: "#E6F4EA",
  },
  {
    title: "Split PDF",
    description: "Separate PDF pages into individual files.",
    route: "/splitpdf",
    image: "./images/split.svg",
    color: "#E6F4EA",
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF file size quickly without compromising quality.",
    route: "/compresspdf",
    image: "./images/compress.svg",
    color: "#E6F4EA",
  },
  {
    title: "Edit PDF",
    description: "Modify text and images in your PDF as easily as in a word processor.",
    route: "/editpdf",
    image: "./images/edit.svg",
    color: "#E6F4EA",
  },
  {
    title: "eSign PDF",
    description: "Sign PDFs electronically, track status, and store securely.",
    route: "/esignpdf",
    image: "./images/esign.svg",
    color: "#E6F4EA",
  },
  {
    title: "Rotate PDF",
    description: "Rotate one or more PDF pages.",
    route: "/rotatepdf",
    image: "./images/rotate.svg",
    color: "#E6F4EA",
  },
  {
    title: "Delete PDF Pages",
    description: "Remove unwanted pages from your PDF.",
    route: "/deletepdfpages",
    image: "./images/delete.svg",
    color: "#E6F4EA",
  },
  {
    title: "Rearrange PDF",
    description: "Drag-and-drop pages to reorder your PDF.",
    route: "/reorderpdf",
    image: "./images/rearrange.svg",
    color: "#E6F4EA",
  },
];

const convertToPDF = [
  {
    title: "Word to PDF",
    description:
      "Convert Word documents into PDF while preserving formatting and layout.",
    route: "/wordtopdf",
    image: "./images/word-to-pdf.svg",
    color: "#FFF2E6",
  },
  {
    title: "Excel to PDF",
    description:
      "Turn spreadsheets into clean, printable PDFs. Keeps your tables, charts, and formulas intact.",
    route: "/exceltopdf",
    image: "./images/exceltopdf.svg",
    color: "#FFF2E6",
  },
  {
    title: "PowerPoint to PDF",
    description:
      "Convert slides into a portable PDF format. Perfect for sharing presentations without losing design.",
    route: "/ppttopdf",
    image: "./images/powerpointtopdf.svg",
    color: "#FFF2E6",
  },
  {
    title: "JPG to PDF",
    description:
      "Merge one or more JPG images into a single PDF. Great for creating photo albums or documents.",
    route: "/jpgtopdf",
    image: "./images/jpgtopdf.svg",
    color: "#FFF2E6",
  },
  {
    title: "PNG to PDF",
    description: "Merge PNG images into a PDF document quickly.",
    route: "/pngtopdf",
    image: "./image1.svg",
    color: "#FFF2E6",
  },
  {
    title: "TIFF to PDF",
    description: "Convert TIFF files to PDF with high fidelity.",
    route: "/tifftopdf",
    image: "./images/tifftopdf.svg",
    color: "#FFF2E6",
  },
  {
    title: "HTML to PDF",
    description: "Convert web pages (HTML) into PDF files.",
    route: "/htmltopdf",
    image: "./images/htmltopdf.svg",
    color: "#FFF2E6",
  },
  {
    title: "Scan to PDF",
    description: "Turn scanned images into searchable PDFs.",
    route: "/scantopdf",
    image: "./image4.svg",
    color: "#FFF2E6",
  },
];

const convertFromPDF = [
  {
    title: "PDF to Word",
    description: "Extract text and formatting from PDF to Word.",
    route: "/pdftoword",
    image: "./image3.svg",
    color: "#F3E6FF",
  },
  {
    title: "PDF to Excel",
    description: "Export tables and data from PDF to Excel.",
    route: "/pdftoexcel",
    image: "./images/pdfexcel.svg",
    color: "#F3E6FF",
  },
  {
    title: "PDF to PowerPoint",
    description: "Turn your PDF slides back into PowerPoint files.",
    route: "/pdftoppt",
    image: "./image5.svg",
    color: "#F3E6FF",
  },
  {
    title: "PDF to JPG",
    description: "Export PDF pages as high-quality JPG images.",
    route: "/pdftojpg",
    image: "./images/pdfjpg.svg",
    color: "#F3E6FF",
  },
  {
    title: "PDF to PNG",
    description: "Export PDF pages as PNG images.",
    route: "/pdftopng",
    image: "./images/pdfpng.svg",
    color: "#F3E6FF",
  },
  {
    title: "PDF to Text",
    description: "Extract plain text from your PDF.",
    route: "/pdftotext",
    image: "./images/pdftext.svg",
    color: "#F3E6FF",
  },
  {
    title: "PDF to HTML",
    description: "Convert PDF into web-ready HTML.",
    route: "/pdftohtml",
    image: "./images/pdfhtml.svg",
    color: "#F3E6FF",
  },
  {
    title: "PDF to Markdown",
    description: "Extract Markdown-friendly text from your PDF.",
    route: "/pdftomarkdown",
    image: "./images/pdfmarkdown.svg",
    color: "#F3E6FF",
  },
  {
    title: "PDF to ePub",
    description: "Turn your PDF into an ePub ebook.",
    route: "/pdftoepub",
    image: "./images/pdfepub.svg",
    color: "#F3E6FF",
  },
  {
    title: "PDF to XML",
    description: "Export PDF content as XML.",
    route: "/pdftoxml",
    image: "./image5.svg",
    color: "#F3E6FF",
  },
];

const advancedTools = [
  {
    title: "Batch Processing",
    description: "Apply actions to multiple PDFs in one go.",
    route: "/batch",
    image: "./images/summarizer.svg",
    color: "#E6F0FF",
  },
  {
    title: "Compare PDFs",
    description: "Visually compare two PDFs and highlight differences.",
    route: "/comparepdf",
    image: "./images/comparelast.svg",
    color: "#E6F0FF",
  },
  {
    title: "Add Watermark & Remove",
    description: "Stamp or remove watermarks from your PDFs.",
    route: "/watermark",
    image: "./images/question.svg",
    color: "#E6F0FF",
  },
  {
    title: "OCR PDF → AI",
    description: "Make scanned PDFs searchable with OCR powered by AI.",
    route: "/ocr",
    image: "./images/ocr.svg",
    color: "#E6F0FF",
  },
];

const premiumTools = [
  {
    title: "All PDF Summarizer",
    description: "AI summaries of any PDF document.",
    route: "/summarizer",
    image: "./images/summarizer.svg",
    color: "#E6F0FF",
  },
  {
    title: "PDF Language Converter",
    description: "Translate your PDF into 100+ languages.",
    route: "/translate",
    image: "./images/translate.svg",
    color: "#E6F0FF",
  },
  {
    title: "All Questions Generator",
    description: "Generate quiz questions from your PDF.",
    route: "/quiz",
    image: "./images/question.svg",
    color: "#E6F0FF",
  },
];

// ------------------- COMPONENT -------------------
export default function AllToolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Track page view when component mounts
  useEffect(() => {
    trackPageView();
  }, []);

  // Function to track page view
  const trackPageView = async () => {
    try {
      await fetch('/api/track/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'All Tools Page',
          toolRoute: '/alltools',
          category: 'Page View',
          page: '/alltools',
          element: 'Page Load',
          elementType: 'pageview'
        })
      });
    } catch (error) {
      console.error('Page view tracking failed:', error);
    }
  };

  // Function to track tool clicks
  const trackToolClick = async (tool, category) => {
    try {
      await fetch('/api/track/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: tool.title,
          toolRoute: tool.route,
          category: category,
          page: '/alltools',
          element: tool.title,
          elementType: 'tool-card'
        })
      });
    } catch (error) {
      console.error('Click tracking failed:', error);
    }
  };

  // Function to track search
  const trackSearch = async (query) => {
    if (!query) return;
    try {
      await fetch('/api/track/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'Search',
          toolRoute: '/alltools',
          category: 'Search',
          page: '/alltools',
          element: `Search: ${query}`,
          elementType: 'search'
        })
      });
    } catch (error) {
      console.error('Search tracking failed:', error);
    }
  };

  const sections = [
    { title: "PDF Operations", items: pdfOperations, category: "PDF Operations",bordercolor:"#308F0080" },
    { title: "Convert to PDF", items: convertToPDF, category: "Convert to PDF" ,bordercolor:"#FF800080"},
    { title: "Convert from PDF", items: convertFromPDF, category: "Convert from PDF",bordercolor:"#D879FD80" },
    { title: "Advanced & Specialized Tools", items: advancedTools, category: "Advanced Tools",bordercolor:"#1B95F84D" },
    { title: "Premium", items: premiumTools, category: "Premium Tools", bordercolor:"#1B95F84D" },
  ];

  return (
    <>
      <Navbar />
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#ffffffff",
          paddingBottom: "3rem",
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: isMobile ? "1.5rem 1rem" : "2.5rem 2rem",
          }}
        >
          {/* Header with Search */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "stretch" : "flex-start",
              marginBottom: isMobile ? "1.5rem" : "2.5rem",
              gap: "1.5rem",
            }}
          >
            <div style={{ flex: "1" }}>
              <h1
                style={{
                  fontSize: isMobile ? "1.6rem" : "2rem",
                  fontWeight: "700",
                  marginBottom: "0.5rem",
                  color: "#000",
                  lineHeight: "1.2",
                  textAlign: isMobile ? "center" : "left",
                }}
              >
                All-in-One PDF Toolkit
              </h1>
              <p
                style={{
                  color: "#666",
                  fontSize: isMobile ? "0.95rem" : "0.875rem",
                  lineHeight: "1.5",
                  margin: "0",
                  textAlign: isMobile ? "center" : "left",
                  marginTop: isMobile ? "0rem" : "20px",
                }}
              >
                Easily manage your PDFs with our quick and reliable tools — split, merge, edit, or
                convert in just a few clicks.
              </p>
            </div>

            {/* Search & Categories */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "0.75rem",
                alignItems: isMobile ? "stretch" : "center",
                marginTop: isMobile ? "0rem" : "70px",
              }}
            >
              <div style={{ position: "relative", width: isMobile ? "100%" : "240px" }}>
                <input
                  type="search"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      trackSearch(searchQuery);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "0.6rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    outline: "none",
                    backgroundColor: "#fff",
                  }}
                />
              </div>
              <button
                onClick={() => {
                  trackToolClick({ title: 'Categories Button', route: '/alltools' }, 'UI Interaction');
                }}
                style={{
                  padding: "0.6rem 1rem",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Categories
              </button>
            </div>
          </div>

          {/* Sections */}
          {sections.map((section, idx) => {
            const filteredItems = section.items.filter(
              (tool) =>
                tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.description.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredItems.length === 0) return null;

            return (
              <section key={idx} style={{ marginBottom: "2.5rem" }}>
                <h2
                  style={{
                    fontSize: isMobile ? "1.1rem" : "1.25rem",
                    fontWeight: "600",
                    marginBottom: "1rem",
                    color: "#000",
                    textAlign: isMobile ? "center" : "left",
                  }}
                >
                  {section.title}
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "0.875rem",
                  }}
                >
                  {filteredItems.map((tool, i) => (
                    <Link
                      key={i}
                      href={tool.route}
                      onClick={() => trackToolClick(tool, section.category)}
                      style={{
                        backgroundColor: tool.color,
                        borderRadius: "12px",
                        padding: "1.25rem",
                        display: "flex",
                        
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        border: `2px solid ${section.bordercolor}`,
                        textDecoration: "none",
                        height: "100%",
                        minHeight: "140px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(0, 0, 0, 0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <img
                        src={tool.image}
                        alt={tool.title}
                        style={{
                          width: "32px",
                          height: "32px",
                          marginBottom: "0.75rem",
                        }}
                      />
                      <h3
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: "600",
                          color: "#000",
                          marginBottom: "0.375rem",
                          lineHeight: "1.3",
                        }}
                      >
                        {tool.title}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.8125rem",
                          color: "#666",
                          lineHeight: "1.4",
                          margin: 0,
                        }}
                      >
                        {tool.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {/* No Results */}
          {searchQuery &&
            sections.every(
              (s) =>
                s.items.filter(
                  (t) =>
                    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.description.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0
            ) && (
              <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <p style={{ color: "#999", fontSize: "1rem" }}>
                  No tools found matching "{searchQuery}"
                </p>
              </div>
            )}
        </div>

        {/* Footer */}
        
      </div>
      <footer
  style={{
    backgroundColor: "white",
    padding: "1rem 0 2rem 0", // reduced padding
    borderTop: "1px solid #e5e7eb",
    width: "100%",
    overflowX: "hidden",
    backgroundImage: "url('/images/footer-bg.png')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: isMobile ? "top center" : "center right",
    backgroundSize: isMobile ? "cover" : "contain",
  }}
>
  <div
    style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "0 1rem" : "0 2rem",
      width: "100%",
      position: "relative",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: isMobile ? "flex-start" : "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        flexWrap: "wrap",
        gap: isMobile ? "1rem" : "2rem",
        width: "100%",
      }}
    >
      {/* Logo */}
      <div
        style={{
          position: "relative",
          width: isMobile ? "100%" : "auto",
          zIndex: 2,
        }}
      >
        <a href="/">
          <img
            src="/Group-14.svg"
            alt="Logo"
            style={{ height: "20px", cursor: "pointer" }}
          />
        </a>
      </div>

      {/* Navigation */}
      <nav
        style={{
          display: "flex",
          gap: isMobile ? "1rem" : "2rem",
          fontSize: "0.85rem",
          flexDirection: isMobile ? "column" : "row",
          width: isMobile ? "100%" : "auto",
          marginLeft: isMobile ? "0" : "auto",
          marginRight: isMobile ? "0" : "auto",
          zIndex: 2,
        }}
      >
        <a href="/about" style={{ color: "#000000ff", textDecoration: "none" }}>About</a>
        <a href="/blogs" style={{ color: "#000000ff", textDecoration: "none" }}>Blog Posts</a>
        <a href="/faq" style={{ color: "#000000ff", textDecoration: "none" }}>FAQ</a>
        <a href="/terms" style={{ color: "#000000ff", textDecoration: "none" }}>Terms & Conditions</a>
        <a href="/privacy-policy" style={{ color: "#000000ff", textDecoration: "none" }}>Privacy Policy</a>
      </nav>
    </div>

    {/* Bottom Row: centered text + icons right */}
    <div
      style={{
        marginTop: "1.5rem",
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      {/* Center text */}
      <div
        style={{
          color: "#000000ff",
          fontSize: "0.8rem",
          textAlign: isMobile ? "center" : "center",
          flex: 1,
          marginLeft: isMobile ?"0px":"250px"
        }}
      >
        © 2025 FileMint. All rights reserved. Powered by PurpleMerit.
      </div>

      {/* Icons Right */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "flex-end",
          fontSize: "1.6rem",
          color: "#666",
          flexShrink: 0,
          marginTop: isMobile ? "1rem" : "0",
        }}
      >
        <a href="#" style={{ color: "#000000ff" }}><i className="fab fa-facebook"></i></a>
        <a href="#" style={{ color: "#000000ff" }}><i className="fab fa-instagram"></i></a>
        <a href="#" style={{ color: "#000000ff" }}><i className="fab fa-x-twitter"></i></a>
        <a href="#" style={{ color: "#000000ff" }}><i className="fab fa-youtube"></i></a>
      </div>
    </div>
  </div>
</footer>
    </>
  );
}