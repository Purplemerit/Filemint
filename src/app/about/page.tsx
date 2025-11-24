"use client";
import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
const AboutPage = () => {
   const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkWidth = () => setIsMobile(window.innerWidth <= 720);
        checkWidth();
        window.addEventListener("resize", checkWidth);
        return () => window.removeEventListener("resize", checkWidth);
      }, []);
  return (
   
    <div style={{ margin: "0 auto", fontFamily: "Georgia, Times New Roman, serif" }}>
      <Navbar />

      {/* Main Content */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem 1rem",
          textAlign: "left",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 4rem)",
            marginBottom: "1rem",
            color: "#222",
          }}
        >
          Why Choose<a style={{color:"#082988"}}> FileMint.com</a>
        </h1>
        <h3
          style={{
            fontSize: "clamp(1.2rem, 3vw, 2rem)",
            color: "#444",
            marginBottom: "1.5rem",
          }}
        >
          Fast, Secure & User-Friendly File Conversion
        </h3>

        <p
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "#555",
            lineHeight: 1.6,
            maxWidth: "800px",
            // margin: "0 auto",
          }}
        >
          Our platform empowers users to convert, compress, and manage documents
          quickly and easily — with zero learning curve. Whether you're merging
          PDFs, converting Word files, or compressing media, FileMint delivers
          with speed and precision.
        </p>

        {/* Features Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginTop: "3rem",
          }}
          className="features-grid"
        >
          <style>{`
            @media (min-width: 768px) {
              .features-grid {
                grid-template-columns: repeat(3, 1fr) !important;
              }
              .feature-tall {
                grid-row: span 2 !important;
              }
              .feature-wide {
                grid-column: span 2 !important;
              }
            }
            @media (max-width: 767px) {
              .features-grid > div {
                grid-column: 1 !important;
                grid-row: auto !important;
              }
            }
          `}</style>
          {/* Row 1 - First 2 cards */}
          <div
            style={{
              backgroundColor: "#FFDCC8",
              padding: "2rem",
              borderRadius: "1rem",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              border: "2px solid #FF800033",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
              
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
             <img src={"./images/image1.svg"}/>
            </div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem", fontWeight: "600" }}>
              Smart Conversion Tools
            </h2>
            <p style={{ lineHeight: 1.6, color: "#333", fontSize: "0.95rem" }}>
              Convert PDFs, images, Word docs, and more using powerful and
              secure algorithms — no formatting loss, no hassle.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#C8F4E3",
              padding: "2rem",
              borderRadius: "1rem",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              border: "2px solid #39B93933",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
               
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
             <img src={"./images/image2.svg"}/>
            </div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem", fontWeight: "600" }}>
              Privacy First
            </h2>
            <p style={{ lineHeight: 1.6, color: "#333", fontSize: "0.95rem" }}>
              We don't store your files. All uploads are encrypted and
              auto-deleted within hours. Your data stays yours — always.
            </p>
          </div>

          {/* Built for Everyone - Spans 2 rows */}
          <div
            className="feature-tall"
            style={{
              backgroundColor: "#D9E9FF",
              padding: "2rem",
              borderRadius: "1rem",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              border: "2px solid #9AEBFE",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
             <img src={"./images/image3.svg"}/>
            </div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem", fontWeight: "600" }}>
              Built for Everyone
            </h2>
            <p style={{ lineHeight: 1.6, color: "#333", fontSize: "0.95rem", marginBottom: "auto" }}>
              From students to professionals, FileMint is designed for real-world workflows.
              Compress a report before emailing, merge invoices in a click, or convert scanned
              images into editable documents.
            </p>
            <div style={{ 
              width: "100%",
              height: "250px",
              
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "1rem",
            }}>
              <div style={{ 
                fontSize: "80px",
                opacity: 0.5,
              }}>
                <img src={"./images/main.svg"}/>
              </div>
            </div>
          </div>

          {/* Row 2 - Cloud-Ready card spanning 2 columns */}
          <div
            className="feature-wide"
            style={{
              backgroundColor: "#E8D9FF",
              padding: "2rem",
              borderRadius: "1rem",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              border: "2px solid #B80DFB33",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
               
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
             <img src={"./images/image4.svg"}/>
            </div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem", fontWeight: "600" }}>
              Cloud-Ready
            </h2>
            <p style={{ lineHeight: 1.6, color: "#333", fontSize: "0.95rem" }}>
              Seamlessly import and export from Google Drive, Dropbox, or OneDrive. No more downloads and reuploads —
              just convert directly from your cloud.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
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
    </div>
  );
};

export default AboutPage;