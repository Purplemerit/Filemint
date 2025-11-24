'use client'
import React, { useState } from 'react'
import Navbar from '@/app/components/Navbar'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect} from "react";
// your images
import p1 from './p1.png'
import p2 from './p2.png'
import p3 from './p3.png'
import p4 from './p4.png'
import p5 from './p5.png'
import p6 from './p6.png'
import p7 from './p7.png'
import p8 from './p8.png'
import p9 from './p9.png'
import p10 from './p10.png'
import p0 from './p0.png'

const posts = [
  {
    slug: 'how-to-merge-pdfs-easily',
    title: 'How to Merge PDFs Easily',
    desc: 'A step-by-step guide to combine multiple PDF files into one seamless document.',
    image: p5,
  },
  {
    slug: 'best-way-to-compress-a-pdf',
    title: 'Best Way to Compress a PDF',
    desc: 'Learn how to reduce PDF file size quickly without compromising quality.',
    image: p2,
  },
  {
    slug: 'pdf-vs-word-whats-better-for-you',
    title: 'PDF vs Word: What’s Better for You?',
    desc: 'Understand when to use PDFs and when Word files are a better fit for work, study, or official use.',
    image: p3,
  },
  {
    slug: 'how-to-edit-a-pdf-online',
    title: 'How to Edit a PDF Online',
    desc: 'Discover simple tools to update your PDF content directly in your browser.',
    image: p4,
  },
  {
    slug: 'convert-pdfs-to-word-or-jpg',
    title: 'Convert PDFs to Word or JPG',
    desc: 'A guide to switching your PDF into editable Word docs or shareable JPGs.',
    image: p1,
  },
  {
    slug: 'what-is-ocr-in-pdf-tools',
    title: 'What Is OCR in PDF Tools?',
    desc: 'How Optical Character Recognition turns scanned images into editable text.',
    image: p6,
  },
  {
    slug: 'how-to-reorder-or-rotate-pdf-pages',
    title: 'How to Reorder or Rotate PDF Pages',
    desc: 'Rearrange and pivot your pages for perfect flow and layout every time.',
    image: p7,
  },
  {
    slug: 'how-to-create-fillable-pdf-forms',
    title: 'How to Create Fillable PDF Forms',
    desc: 'Make interactive forms with checkboxes, text fields, and more—ideal for surveys.',
    image: p8,
  },
  {
    slug: 'how-secure-are-online-pdf-editors',
    title: 'How Secure Are Online PDF Editors?',
    desc: 'We break down the encryption, privacy, and safety of today’s top PDF editors.',
    image: p9,
  },
  {
    slug: 'everything-you-need-to-know-about-editing-pdfs-online',
    title: 'Everything You Need to Know About Editing PDFs Online',
    desc: 'From basic tweaks to advanced redaction—master every online PDF tool.',
    image: p10,
  },
  {
    slug: 'Top 5 mistakes to avoid when editing PDFS',
    title: 'Top 5 mistakes to avoid when editing PDFS',
    desc: 'Keep your personal and business files safe with easy encryption methods and secure sharing options.',
    image: p2,
  },
  {
    slug: 'Why businesses prefer PDFS over other formats',
    title: 'Why businesses prefer PDFS over other formats',
    desc: 'A step by step guide to combine multiple PDF file into one document without losing quality.',
    image: p0,
  },
]

export default function BlogsPage() {
  const [selectedPost, setSelectedPost] = useState<any>(null)

  const closeModal = () => setSelectedPost(null)
  const [isMobile, setIsMobile] = useState(false);
      useEffect(() => {
          const checkWidth = () => setIsMobile(window.innerWidth <= 720);
          checkWidth();
          window.addEventListener("resize", checkWidth);
          return () => window.removeEventListener("resize", checkWidth);
        }, []);
  return (
    <>
      <Navbar />

      <main style={{ padding: '3rem 5%', maxWidth: '1200px', margin: '0 auto' ,fontFamily: "Georgia, Times New Roman, serif" }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>Our Blogs</h1>
        <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.6 }}>
          Dive into our expert articles on everything PDF—tips, deep dives, and quick tricks to make your workflow seamless.
        </p>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {posts.map(({ title, desc, image }, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: 180 }}>
                <Image src={image} alt={title} fill style={{ objectFit: 'cover' }} />
              </div>

              <div style={{ padding: '1rem', flexGrow: 1 }}>
                <h2 style={{ fontSize: '1.25rem', margin: '0 0 .5rem' }}>{title}</h2>
                <p style={{ fontSize: '.95rem', color: '#555', margin: 0 }}>{desc}</p>
              </div>

              <div style={{ padding: '0 1rem 1rem' }}>
                <button
                  onClick={() => setSelectedPost({ title, desc, image })}
                  style={{
                    color: '#0070f3',
                    fontWeight: 600,
                    fontSize: '.9rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Read Blog →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL */}
        {selectedPost && (
          <div
            onClick={closeModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: '10px',
                maxWidth: '500px',
                width: '100%',
                padding: '1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              <Image
                src={selectedPost.image}
                alt={selectedPost.title}
                width={500}
                height={300}
                style={{ borderRadius: '6px', objectFit: 'cover', width: '100%', height: 'auto' }}
              />
              <h2 style={{ marginTop: '1rem', fontSize: '1.5rem' }}>{selectedPost.title}</h2>
              <p style={{ color: '#555', marginTop: '.5rem', lineHeight: 1.6 }}>
                {selectedPost.desc}
              </p>

              <button
                onClick={closeModal}
                style={{
                  marginTop: '1rem',
                  background: '#0070f3',
                  color: 'white',
                  border: 'none',
                  padding: '.6rem 1.2rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
        
      </main>
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
  )
}
