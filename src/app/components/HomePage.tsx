'use client'

import Link from "next/link";
import AdBanner from "./AdBanner";
import BGSvgComponent from "./BG";
import { useEffect, useState } from "react";
import { IoIosArrowForward } from "react-icons/io";

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);
  const tools = [
    {
      img: "./feature3.svg",
      color: "#F87C56",
      title: "Quick Convert & Compress",
      desc: "Our tool are designed for speed and simplicity, making file management easy.",
      btnText: "Explore",
      btnColor: "#F87C56",
      link: "/all"
    },
    {
      img: "./feature2.svg",
      color: "#00C46A",
      title: "Easy PDF Conversion",
      desc: "Experience seamless conversion that maintain the quality of your documents.",
      btnText: "Start",
      btnColor: "#00C46A",
      link: "/all"
    },
    {
      img: "./feature1.svg",
      color: "#F5B623",
      title: "Effortless File Merge",
      desc: "Combine your documents quickly while preserving their original formatting.",
      btnText: "Merge",
      btnColor: "#F5B623",
      link: "/mergepdf"
    },
  ];
  const newtools =[
{
      img: "./imagefianl4.svg",
      color: "#95d1f3ff",
      title: "Experience quick and easy file conversion in just a few clicks.",
      desc: "Follow these easy steps to convert your file seamlessly.",
      btnText: "Explore",
      btnColor: "#95d1f3ff",
      link: "/all"
    },
    {
      img: "./imagefianl5.svg",
      color: "#f8a0a0ff",
      title: "Upload your file and select your desired output format.",
      desc: "Our platform support various formats for your  convenience.",
      btnText: "Start",
      btnColor: "#f8a0a0ff",
      link: "/all"
    },
    {
      img: "./imagefianl6.svg",
      color: "rgba(223, 145, 245, 1)",
      title: "Download your converted file instantly and enjoy!",
      desc: "Our file is ready for download: just click the button below.",
      btnText: "Merge",
      btnColor: "rgba(223, 145, 245, 1)",
      link: "/all"
    },
  ];
    useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth <= 720);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);
  return (
    <>
      {/* <AdBanner /> */}
      {/* Hero Section */}
  <main
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "90vh",
    gap: 0,
    flexWrap: "wrap",
    position: "relative",
    overflow: "hidden",
    width: "100%",
    maxWidth: "100vw",
    fontFamily: 'Georgia, "Times New Roman", serif',
  }}
>
  {/* Text Section */}
  <div
    className="text-section"
    style={{
      flex: "1",
      textAlign: "left",
      paddingRight: "0",
      marginLeft: "6vw",
      position: "relative",
      zIndex: 2,
      fontFamily: 'Georgia, "Times New Roman", serif',
      
    }}
  >
    <h1 style={{ fontSize: "4rem", marginBottom: "1rem",  }}>
      Effortlessly <span style={{ color: "#082988" }}>Convert</span>
      <br />
      Your Files in Seconds
    </h1>
    <p style={{ fontSize: "1.2rem" }}>
      Transform your documents with our easy-to-use file conversion tools.
    </p>
    <p style={{ fontSize: "1.2rem" }}>
      Upload, convert, and download in just a few clicks!
    </p>

    <div className="hero-buttons">
      <button className="primary-btn">
        <Link href="/all" style={{ color: "inherit", textDecoration: "none" }}>
          Convert Now
        </Link>
      </button>
      <button className="secondary-btn">
        <Link href="/about" style={{ color: "#000000ff", textDecoration: "none" }}>
          Learn More
        </Link>
      </button>
    </div>

    {/* Floating PNGs */}
    <img src="/png1.png" alt="" className="floating floating-1" />
    <img src="/png2.png" alt="" className="floating floating-2" />
    <img src="/png3.png" alt="" className="floating floating-3" />
  </div>

  {/* SVG Section (single component) */}
  <div className="svg-section">
    <BGSvgComponent />
  </div>

  <style jsx>{`
    .svg-section {
      flex: 1;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .svg-section :global(svg) {
      width: 100%;
      height: auto;
      object-fit: cover;
    }

    .hero-buttons {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin-top: 2rem;
    }

    .primary-btn {
      padding: 1.25rem 3rem;
      background: linear-gradient(103deg, #0e1c29 -19.6%, #323d68 129.35%);
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      box-shadow:
        0 5px 12px 0 rgba(46, 64, 128, 0.25),
        0 4px 4px 0 rgba(184, 193, 230, 0.35) inset;
      transition: all 0.3s ease;
    }

    .secondary-btn {
      padding: 1.25rem 3rem;
      background: white;
      color: #000000ff;
      font-size: 1.1rem;
      font-weight: 600;
      border: 2px solid #6A89A5;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .primary-btn:hover,
    .secondary-btn:hover {
      transform: translateY(-2px);
    }

    .floating {
      position: absolute;
      opacity: 0.9;
      animation: float 6s ease-in-out infinite;
      z-index: 1;
    }

    .floating-1 {
      top: -40px;
      left: 6%;
      width: 750px;
      height: auto;
      z-index: 5;
    }

    .floating-2 {
      top: 75%;
      right: 70px;
      animation-delay: 1.5s;
    }

    .floating-3 {
      bottom: -30px;
      left: 10%;
      top: 470px;
      animation-delay: 3s;
    }

    @media (max-width: 768px) {
      main {
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 0;
        width: 100%;
        max-width: 100vw;
      }

      .floating {
        display: none;
      }

      .svg-section {
        position: absolute;
        top: 10%;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        opacity: 0.25;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }

      .svg-section :global(svg) {
        width: 110%;
        height: auto;
        object-fit: cover;
      }

      .text-section {
        margin: 0 !important;
        margin-left: 0 !important;
        padding: 12vh 8vw !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        position: relative;
        z-index: 2;
        background: transparent;
        text-align: center;
        width: 100%;
      }

      .text-section h1 {
        font-size: 2rem !important;
        line-height: 1.25;
        margin-bottom: 1rem;
        padding: 0 1rem;
      }

      .text-section p {
        font-size: 1rem !important;
        line-height: 1.4;
        padding: 0 1rem;
      }

      .hero-buttons {
        justify-content: center;
        gap: 1rem;
        padding: 0 1rem;
        width: 100%;
      }

      .primary-btn,
      .secondary-btn {
        padding: 0.9rem 2rem;
        font-size: 1rem;
      }
    }
  `}</style>
</main>
<AdBanner />
 {/* Popular Tools Section */}
<section style={{ padding: "0", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
  <h2
    className="section-title"
    style={{
      fontSize: "2.8rem",
      fontWeight: "500",
      marginBottom: "2.5rem",
      textAlign: "center",
      color: "#222",
      fontFamily: 'Georgia, "Times New Roman", serif'
    }}
  >
    Popular Tools
  </h2>

  <div className="tools-container">
    <div className="tools-grid">
      {[
        {
          title: "Merge PDF",
          img: "./image2.svg",
          color: "#D5F5D5",
          route: "/mergepdf",
          desc: "Combine multiple PDF files into one organized document in seconds — fast, simple, and secure.",
          bordercolor: "#A3D9A5",
        },
        
        {
          title: "Word to PDF",
          img: "./images/summarizer.svg",
          color: "#E5F0FF",
          route: "/wordtopdf",
          desc: "Transforms Microsoft Word documents into PDF format.",
          bordercolor: "#1B95F84D",
        },
        {
          title: "eSign PDF",
          img: "./image5.svg",
          color: "#F0D5FF",
          route: "/esignpdf",
          desc: "Add secure and legally valid eSignatures to your PDF documents.",
          bordercolor: "#D879FD80",
        },
        {
          title: "Edit PDF",
          img: "./image1.svg",
          color: "#FFE5D5",
          route: "/editpdf",
          desc: "Changes text, images, or structure within a PDF using editing tools.",
          bordercolor: "#FF800080",
        },
        {
          title: "PDF to Word",
          img: "./image3.svg",
          color: "#E8D5FF",
          route: "/pdftoword",
          desc: "Converts PDF documents into editable Microsoft Word format.",
          bordercolor: "#D879FD80",
        },
        {
          title: "Compare PDF",
          img: "./images/comparelast.svg",
          color: "#D5E5FF",
          route: "/comparepdf",
          desc: "Compare two PDF documents side by side to find differences easily.",
          bordercolor: "#1B95F84D",
        },
      ].map((tool, index) => (
        <Link href={tool.route} key={index} style={{ textDecoration: "none" }}>
          <div
            className="tool-card"
            style={{
              backgroundColor: tool.color,
              border: `2px solid ${tool.bordercolor}`,

              borderRadius: "12px",
              padding: "1.75rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              textAlign: "left",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              height: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06)";
            }}
          >
            <img
              src={tool.img}
              alt={tool.title}
              style={{
                width: "38px",
                height: "38px",
                marginBottom: "1rem",
              }}
            />
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: "600",
                color: "#222",
                marginBottom: "0.5rem",
              }}
            >
              {tool.title}
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#555",
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              {tool.desc}
            </p>
          </div>
        </Link>
      ))}
    </div>

    <div className="view-all-container">
      <Link
        href="/all"
        style={{
          color: "#000",
          textDecoration: "none",
          fontWeight: "600",
          fontSize: "1.05rem",
          textDecorationLine: "underline",
        }}
      >
        View All
      </Link>
    </div>
  </div>

  <style jsx>{`
    .tools-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .tool-card {
      width: 100%;
      height: 100%;
    }

    .view-all-container {
      text-align: right;
      padding-top: 0.5rem;
    }

    @media (max-width: 1024px) and (min-width: 641px) {
      .tools-container {
        max-width: 768px;
      }

      .tools-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }
    }

    @media (max-width: 640px) {
      .section-title {
        font-size: 2rem !important;
        margin-bottom: 2rem !important;
      }

      .tools-container {
        padding: 0 20px;
      }

      .tools-grid {
        grid-template-columns: 1fr;
        gap: 1.25rem;
        margin-bottom: 1.25rem;
      }

      .tool-card {
        padding: 1.75rem 1.5rem !important;
      }

      .tool-card img {
        width: 40px !important;
        height: 40px !important;
      }

      .tool-card h3 {
        font-size: 1.15rem !important;
      }

      .tool-card p {
        font-size: 0.95rem !important;
      }

      .view-all-container {
        text-align: center !important;
      }

      @media (pointer: coarse) {
        .tool-card {
          transition: none !important;
        }
      }
    }
  `}</style>
</section>

   {/* Advance Tools */}
<section
  style={{
    width: "100%",
    maxWidth: "100vw",
    background: "#fff",
    padding: isMobile ? "60px 1rem" : "100px 40px",
    boxSizing: "border-box",
    overflowX: "hidden",
    fontFamily: 'Georgia, "Times New Roman", serif'
  }}
>
  <div
    style={{
      maxWidth: "1300px",
      margin: "0 auto",
      textAlign: "center",
      fontFamily: 'Georgia, "Times New Roman", serif'
    }}
  >
    <h2
      style={{
        fontSize: "2.8rem",
        fontWeight: "520",
        color: "#111",
      }}
    >
      Advanced Tools
    </h2>
    <p
      style={{
         fontSize: "2.8rem",
        fontWeight: "520",
        color: "#111",
        marginTop: "-25px",
      }}
    >
      Made Simple (and Free)
    </p>
    <p
      style={{
        fontSize: "1.1rem",
        color: "#555",
        maxWidth: "800px",
        margin: "20px auto 60px",
        lineHeight: "1.8",
      }}
    >
      Experience pro-level file conversion without the complexity or the cost. From OCR to PDF tools, everything you need—no sign-ups, no hidden fees, just instant results
    </p>
  </div>

  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "100px",
      alignItems: "center",
    }}
  >
    {/* Feature 1 */}
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "50px",
        width: "100%",
        maxWidth: "1200px",
      }}
    >
      <div style={{ flex: "1 1 500px", textAlign: "left" }}>
        <h3 style={{ fontSize: "1.8rem", fontWeight: "500", color: "#111" }}>
          No Watermark on Output
        </h3>
        <p
          style={{
            color: "#666",
            lineHeight: "1.8",
            marginTop: "15px",
            fontSize: "1.05rem",
          }}
        >
          Unlike many platforms that sneak in their branding or charge extra to
          remove it, our free converter offers clean, watermark-free exports
          every time. What you upload is exactly what you download — professional,
          polished, and truly yours.
        </p>
      </div>
      <div style={{ flex: "1 1 400px", textAlign: "center" }}>
        <img
          src="./toolimage1.svg"
          alt="No Watermark"
          style={{ width: "100%", maxWidth: "380px" }}
        />
      </div>
    </div>

    {/* Feature 2 */}
    <div
      style={{
        display: "flex",
        flexWrap: "wrap-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "50px",
        width: "100%",
        maxWidth: "1200px",
      }}
    >
      <div style={{ flex: "1 1 400px", textAlign: "center" }}>
        <img
          src="./toolimage2.svg"
          alt="Convert Anywhere"
          style={{ width: "100%", maxWidth: "380px" }}
        />
      </div>
      <div style={{ flex: "1 1 500px", textAlign: "left" }}>
        <h3 style={{ fontSize: "1.8rem", fontWeight: "500", color: "#111" }}>
          Convert from Anywhere
        </h3>
        <p
          style={{
            color: "#666",
            lineHeight: "1.8",
            marginTop: "15px",
            fontSize: "1.05rem",
          }}
        >
          Easily upload files from your device, Google Drive, Dropbox, or paste
          a direct URL. No matter where your files live, our converter brings
          them right into your workspace for seamless processing.
        </p>
      </div>
    </div>

    {/* Feature 3 */}
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "50px",
        width: "100%",
        maxWidth: "1200px",
      }}
    >
      <div style={{ flex: "1 1 500px", textAlign: "left" }}>
        <h3 style={{ fontSize: "1.8rem", fontWeight: "500", color: "#111" }}>
          Customize After Conversion
        </h3>
        <p
          style={{
            color: "#666",
            lineHeight: "1.8",
            marginTop: "15px",
            fontSize: "1.05rem",
          }}
        >
          Need to merge, split, compress, or reorder after converting? No
          problem. Our platform offers instant post-conversion flexibility so
          you don't need to start over. No downloads required, all within one
          place.
        </p>
      </div>
      <div style={{ flex: "1 1 400px", textAlign: "center" }}>
        <img
          src="./toolimage3.svg"
          alt="Customize After Conversion"
          style={{ width: "100%", maxWidth: "380px" }}
        />
      </div>
    </div>

    {/* Feature 4 */}
    <div
      style={{
        display: "flex",
        flexWrap: "wrap-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "50px",
        width: "100%",
        maxWidth: "1200px",
      }}
    >
      <div style={{ flex: "1 1 400px", textAlign: "center" }}>
        <img
          src="./toolimage4.svg"
          alt="OCR Conversion"
          style={{ width: "100%", maxWidth: "380px" }}
        />
      </div>
      <div style={{ flex: "1 1 500px", textAlign: "left" }}>
        <h3 style={{ fontSize: "1.8rem", fontWeight: "500", color: "#111" }}>
          Image/PDF Text Conversion
        </h3>
        <p
          style={{
            color: "#666",
            lineHeight: "1.8",
            marginTop: "15px",
            fontSize: "1.05rem",
          }}
        >
          Extract text from scanned images or non-editable PDFs using our
          advanced OCR technology — perfect for making your documents searchable
          or ready to edit.
        </p>
      </div>
    </div>
  </div>

  <style jsx>{`
      @media (max-width: 1024px) {
        section {
          padding: 80px 25px !important;
        }
        h2 {
          font-size: 2.2rem !important;
        }
        h3 {
          font-size: 1.4rem !important;
        }
        p {
          font-size: 1rem !important;
        }
      }
      @media (max-width: 768px) {
        section {
          padding: 60px 15px !important;
        }
        h2 {
          font-size: 1.8rem !important;
        }
        h3 {
          font-size: 1.25rem !important;
        }
        p {
          font-size: 0.95rem !important;
        }
        img {
          max-width: 280px !important;
        }
      }
    `}</style>
</section>

    <section
      style={{
        width: "100%",
        maxWidth: "100vw",
        background: "#ffffffff",
        padding: isMobile ? "3rem 1rem" : "6rem 2rem",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "3rem",
              lineHeight: 1.05,
              margin: "0 auto 0.6rem",
              color: "#111",
              fontWeight: 500,
              maxWidth: "900px",
            }}
          >
            Easy Convert Your Files
            <br />
            in Seconds
          </h2>

          <p
            style={{
              margin: "0 auto",
              color: "#4b4b4b",
              fontSize: "1rem",
              maxWidth: "760px",
              lineHeight: 1.6,
              marginBottom:"85px",
              fontFamily: 'Georgia, "Times New Roman", serif'
            }}
          >
            Our user-friendly platform allows you to convert files effortlessly.
            Just drag <br></br>and drop your documents to get started.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "2.5rem",
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <div
            style={{
              flex: "0 1 58%",
              maxWidth: "720px",
              minWidth: "320px",
              display: "flex",
              gap: "2rem",
              alignItems: "flex-start",
              flexDirection: isMobile ? "column" : "row",
              fontFamily: 'Georgia, "Times New Roman", serif'
            }}
          >
            <div style={{ flex: "1 1 45%", minWidth: "220px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "10px",
                  
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                  
                }}
              >
                <img
                  src="./section3-2.svg"
                  alt="Choose Files"
                  style={{ width: "56px", height: "56px" , marginBottom: "16px"}}
                />
              </div>

              <h3
                style={{
                  fontSize: "1.15rem",
                  margin: "0 0 8px",
                  color: "#111",
                  fontWeight: 600,
                }}
              >
                Choose Files
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "#5a5a5a",
                  lineHeight: 1.6,
                  fontSize: "0.95rem",
                }}
              >
                Start Converting your file quickly
                <br />
                and securely with our intuitive interface.
              </p>

              <div style={{ marginTop: "18px" }}>
                <a
                  href="/blogs"
                  style={{
                    display: "inline-block",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "2px solid #6A89A5",
                    textDecoration: "none",
                    color: "#111",
                    fontSize: "0.95rem",
                    background: "#fff",
                  }}
                >
                  Learn More <IoIosArrowForward style={{ verticalAlign: "-3px" }} />
                </a>
              </div>
            </div>

            <div style={{ flex: "1 1 45%", minWidth: "220px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "10px",
                 
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                 
                }}
              >
                <img
                  src="./section3-1.svg"
                  alt="Get Started"
                  style={{ width: "56px", height: "56px",marginBottom: "16px" }}
                />
              </div>

              <h3
                style={{
                  fontSize: "1.15rem",
                  margin: "0 0 8px",
                  color: "#111",
                  fontWeight: 600,
                }}
              >
                Get Started
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "#5a5a5a",
                  lineHeight: 1.6,
                  fontSize: "0.95rem",
                }}
              >
                Just upload and start converting your file
                <br />
                in different formats.
              </p>
            </div>
          </div>
        
      <div
        style={{
          flex: "0 1 35%",
          minWidth: "260px",
          maxWidth: "420px",
          display: "flex",
         justifyContent: isMobile ? "center" : "flex-end",
        marginTop: isMobile ? "20px" : "-100px",
        }}
      >
        <img
          src="/conversion-illustration.png"
          alt="File conversion process"
          style={{
            width: "100%",
            maxWidth: "420px",
            height: "auto",
            borderRadius: "6px",
            display: "block",
          }}
        />
      </div>
    </div>
  </div>

  <style jsx>{`
      @media (max-width: 1024px) {
      h2 { font-size: 2.4rem !important; }
    }

    @media (max-width: 800px) {
      section { padding: 3.5rem 14px !important; }
    }

    @media (max-width: 720px) {
      div[style*="display: flex"][style*="align-items: flex-start"] {
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
      }

      div[style*="flex: 0 1 58%"] {
        flex: 1 1 100% !important;
        max-width: 100% !important;
        margin-bottom: 1.5rem;
        text-align: left !important;
      }

      div[style*="flex: 0 1 35%"] {
        flex: 1 1 100% !important;
        max-width: 420px;
        margin: 0 auto !important;
        display: flex !important;
        justify-content: center !important;
      }

      img {
        max-width: 380px !important;
        width: 100% !important;
        height: auto !important;
      }
    }
    `}</style>
</section>


      {/* Features Section */}
         <section
      style={{
        padding: isMobile ? "3rem 1rem" : "5rem 0",
        backgroundColor: "#ffffffff",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            fontSize: isMobile ? "1.9rem" : "2.8rem",
            fontWeight: 500,
            color: "#222",
            marginBottom: isMobile ? "2rem" : "3rem",
            lineHeight: 1.3,
            
          }}
        >
          Effortlessly transform documents
          <br /> with powerful tools.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
          }}
        >
          {tools.map((tool, i) => (
            <div
              key={i}
              style={{
                // backgroundColor: "#fff",
                borderRadius: "16px",
                padding: isMobile ? "1.5rem 1rem" : "2rem",
                textAlign: isMobile ? "center" : "left",
                // boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "transform 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  justifyContent: "left",
                  alignItems: "left",
                  // backgroundColor: `${tool.color}10`,
                  borderRadius: "12px",
                  width: isMobile ? "60px" : "70px",
                  height: isMobile ? "60px" : "70px",
                  marginBottom: "1.2rem",
                  border: `1.5px solid ${tool.color}40`,
                }}
              >
                <img
                  src={tool.img}
                  alt={tool.title}
                  style={{
                    width: isMobile ? "60px" : "70px",
                    height: isMobile ? "60px" : "70px",
                    objectFit: "contain",
                  }}
                />
              </div>

              <h3
                style={{
                  fontSize: isMobile ? "1.1rem" : "1.25rem",
                  fontWeight: 600,
                  marginBottom: "0.6rem",
                  color: "#222",
                }}
              >
                {tool.title}
              </h3>

              <p
                style={{
                  color: "#555",
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  lineHeight: 1.6,
                  marginBottom: "1.4rem",
                }}
              >
                {tool.desc}
              </p>

              <Link
                href={tool.link}
                style={{
                  display: "inline-block",
                  padding: "0.45rem 1.1rem",
                  borderRadius: "8px",
                  fontWeight: 500,
                  textDecoration: "none",
                  color: tool.btnColor,
                  border: `1.8px solid ${tool.btnColor}`,
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  transition: "all 0.3s",
                }}
              >
                {tool.btnText} <IoIosArrowForward style={{ verticalAlign: "-3px" }} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
      <section
      style={{
        padding: isMobile ? "3rem 1rem" : "5rem 0",
        backgroundColor: "#ffffffff",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            fontSize: isMobile ? "1.9rem" : "2.8rem",
            fontWeight: 500,
            color: "#222",
            marginBottom: isMobile ? "2rem" : "3rem",
            lineHeight: 1.3,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          Convert your files in 3 quick,
          <br />  hassle-free steps!
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
          }}
        >
          {newtools.map((tool, i) => (
            <div
              key={i}
              style={{
                // backgroundColor: "#fff",
                borderRadius: "16px",
                padding: isMobile ? "1.5rem 1rem" : "2rem",
                textAlign: isMobile ? "center" :"left",
                // boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "transform 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  // backgroundColor: `${tool.color}10`,
                  borderRadius: "12px",
                  width: isMobile ? "60px" : "70px",
                  height: isMobile ? "0px" : "70px",
                  marginBottom: "1.2rem",
                  border: `1.5px solid ${tool.color}40`,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                <img
                  src={tool.img}
                  alt={tool.title}
                  style={{
                    width: isMobile ? "60px" : "70px",
                    height: isMobile ? "60px" : "70px",
                    objectFit: "contain",
                  }}
                />
              </div>

              <h3
                style={{
                  fontSize: isMobile ? "1.1rem" : "1.25rem",
                  fontWeight: 500,
                  marginBottom: "0.6rem",
                  color: "#222",
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                {tool.title}
              </h3>

              <p
                style={{
                  color: "#555",
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                  lineHeight: 1.6,
                  marginBottom: "1.4rem",
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                {tool.desc}
              </p>

              <Link
                href={tool.link}
                style={{
                  display: "inline-block",
                  padding: "0.45rem 1.1rem",
                  borderRadius: "8px",
                  fontWeight: 500,
                  textDecoration: "none",
                  color: tool.btnColor,
                  border: `1.8px solid ${tool.btnColor}`,
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  transition: "all 0.3s",
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                {tool.btnText}<IoIosArrowForward style={{ verticalAlign: "-3px" }} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>


      {/* Trusted By Section */}
      <section
      style={{
        padding: isMobile ? "1.5rem 0" : "3rem 0",
        backgroundColor: "",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: isMobile ? "90%" : "1000px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            fontSize: isMobile ? "1rem" : "1.5rem",
            fontWeight: 600,
            marginBottom: isMobile ? "1rem" : "2rem",
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          Trusted By:
        </h3>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: isMobile ? "1rem" : "3rem",
            flexWrap: "wrap",
          }}
        >
          <img
            src="/google-cloud-logo.png"
            alt="Google Cloud"
            style={{
              height: isMobile ? "20px" : "40px",
              opacity: "0.6",
            }}
          />
          <img
            src="/onedrive-logo.png"
            alt="OneDrive"
            style={{
              height: isMobile ? "20px" : "40px",
              opacity: "0.6",
            }}
          />
          <img
            src="/norton-logo.png"
            alt="Norton"
            style={{
              height: isMobile ? "20px" : "40px",
              opacity: "0.6",
            }}
          />
          <img
            src="/dropbox-logo.png"
            alt="Dropbox"
            style={{
              height: isMobile ? "20px" : "40px",
              opacity: "0.6",
            }}
          />
        </div>
      </div>
    </section>

      {/* Final CTA Section */}
      <section
      style={{
        width: "100%",
        maxWidth: "100vw",
        background: "#ffffffff",
        padding: isMobile ? "3rem 1rem" : "6rem 2rem",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "3rem",
              lineHeight: 1.05,
              margin: "0 auto 0.6rem",
              color: "#111",
              fontWeight: 500,
              maxWidth: "900px",
            }}
          >
            Convert Files in a Click
            <br />
            Fast, Easy & Free
          </h2>

          <p
            style={{
              margin: "0 auto",
              color: "#4b4b4b",
              fontSize: "1rem",
              maxWidth: "760px",
              lineHeight: 1.6,
              marginBottom:"80px",
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            Our user-friendly platform allows you to convert files effortlessly. Just drag and drop your documents to get started.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "2.5rem",
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <div
            style={{
              flex: "0 1 58%",
              maxWidth: "720px",
              minWidth: "320px",
              display: "flex",
              gap: "2rem",
              alignItems: "flex-start",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <div style={{ flex: "1 1 45%", minWidth: "220px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "10px",
                  // border: "2px solid #f5ffd6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                  background: "#fff",
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                <img
                  src="./imagefianl3.svg"
                  alt="Choose Files"
                  style={{ width: "50px", height: "50px" }}
                />
              </div>

              <h3
                style={{
                  fontSize: "1.15rem",
                  margin: "0 0 8px",
                  color: "#111",
                  fontWeight: 600,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                Choose Files
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "#5a5a5a",
                  lineHeight: 1.6,
                  fontSize: "0.95rem",
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                Start Converting your file quickly
                <br />
                and securely with our intuitive interface.
              </p>

              <div style={{ marginTop: "18px" }}>
                <a
                  href="/blogs"
                  style={{
                    display: "inline-block",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "2px solid #6A89A5",
                    textDecoration: "none",
                    color: "#111",
                    fontSize: "0.95rem",
                    background: "#fff",
                    fontFamily: 'Georgia, "Times New Roman", serif',
                  }}
                >
                  Learn More <IoIosArrowForward style={{ verticalAlign: "-3px" }} />
                </a>
              </div>
            </div>

            <div style={{ flex: "1 1 45%", minWidth: "220px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "10px",
                  // border: "2px solid #b4e5feff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                  background: "#fff",
                }}
              >
                <img
                  src="./imagefianl2.svg"
                  alt="Get Started"
                  style={{ width: "50px", height: "50px" }}
                />
              </div>

              <h3
                style={{
                  fontSize: "1.15rem",
                  margin: "0 0 8px",
                  color: "#111",
                  fontWeight: 600,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                Get Started
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "#5a5a5a",
                  lineHeight: 1.6,
                  fontSize: "0.95rem",
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                Just upload and start converting your file
                <br />
                in different formats.
              </p>
            </div>
          </div>
        
      <div
        style={{
          flex: "0 1 35%",
          minWidth: "260px",
          maxWidth: "420px",
          display: "flex",
         justifyContent: isMobile ? "center" : "flex-end",
        marginTop: isMobile ? "20px" : "-100px",
        }}
      >
        <img
          src="/imagefianl1.svg"
          alt="File conversion process"
          style={{
            width: "100%",
            maxWidth: "420px",
            height: "auto",
            borderRadius: "6px",
            display: "block",
          }}
        />
      </div>
    </div>
  </div>

  <style jsx>{`
      @media (max-width: 1024px) {
      h2 { font-size: 2.4rem !important; }
    }

    @media (max-width: 800px) {
      section { padding: 3.5rem 14px !important; }
    }

    @media (max-width: 720px) {
      div[style*="display: flex"][style*="align-items: flex-start"] {
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
      }

      div[style*="flex: 0 1 58%"] {
        flex: 1 1 100% !important;
        max-width: 100% !important;
        margin-bottom: 1.5rem;
        text-align: left !important;
      }

      div[style*="flex: 0 1 35%"] {
        flex: 1 1 100% !important;
        max-width: 420px;
        margin: 0 auto !important;
        display: flex !important;
        justify-content: center !important;
      }

      img {
        max-width: 380px !important;
        width: 100% !important;
        height: auto !important;
      }
    }
    `}</style>
</section>

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



      {/* Global CSS fixes for horizontal scroll */}
      {/* <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        html, body {
          overflow-x: hidden;
          width: 100%;
          margin: 0;
          padding: 0;
        }
      `}</style> */}

    
    </>
  );
}