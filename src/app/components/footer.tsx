"use Client";
import React,{useState,useEffect} from "react";
export default function Footer() {
    const [isMobile, setIsMobile] = useState(false);
     useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth <= 720);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);
    return(
    <>
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
</footer></>);}