'use client'
import React, { useState } from 'react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/footer'
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
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <Navbar />

      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: isMobile ? '5rem 1.5rem 4rem' : '6rem 2rem 5rem',
          textAlign: 'center',
          color: 'white',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: isMobile ? '2.5rem' : '3.5rem',
              fontWeight: '500',
              marginBottom: '1.25rem',
              lineHeight: 1.2,
            }}
          >
            Our Blogs
          </h1>
          <p
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: isMobile ? '1.1rem' : '1.35rem',
              opacity: 0.95,
              lineHeight: 1.6,
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            Dive into our expert articles on everything PDF—tips, deep dives, and quick tricks to make your workflow seamless.
          </p>
        </div>
      </section>

      <main style={{ padding: isMobile ? '3rem 1.5rem' : '4rem 2rem', maxWidth: '1200px', margin: '-2rem auto 0', position: 'relative', zIndex: 10 }}>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '2rem' : '2.5rem',
            justifyItems: 'stretch',
          }}
        >
          {posts.map(({ title, desc, image }, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.15)';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden' }}>
                <Image
                  src={image}
                  alt={title}
                  fill
                  style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
                />
              </div>

              <div style={{ padding: isMobile ? '1.25rem' : '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h2
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: isMobile ? '1.25rem' : '1.35rem',
                    fontWeight: '600',
                    margin: '0 0 0.75rem',
                    color: '#323D68',
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h2>
                <p
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: '.95rem',
                    color: '#6b7280',
                    margin: 0,
                    lineHeight: 1.6,
                    flexGrow: 1,
                  }}
                >
                  {desc}
                </p>
              </div>

              <div style={{ padding: isMobile ? '0 1.25rem 1.25rem' : '0 1.5rem 1.5rem' }}>
                <button
                  onClick={() => setSelectedPost({ title, desc, image })}
                  style={{
                    color: '#667eea',
                    fontWeight: 600,
                    fontSize: '.95rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem 0',
                    fontFamily: "system-ui, sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  Read Blog <span style={{ fontSize: '1.1rem' }}>→</span>
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
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: isMobile ? '1rem' : '2rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: '20px',
                maxWidth: '600px',
                width: '100%',
                padding: 0,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease',
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: isMobile ? 200 : 300 }}>
                <Image
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>

              <div style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                <h2
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: isMobile ? '1.5rem' : '1.75rem',
                    fontWeight: '600',
                    color: '#323D68',
                    marginBottom: '1rem',
                    lineHeight: 1.3,
                  }}
                >
                  {selectedPost.title}
                </h2>
                <p
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    color: '#6b7280',
                    fontSize: '1rem',
                    lineHeight: 1.7,
                    marginBottom: '1.5rem',
                  }}
                >
                  {selectedPost.desc}
                </p>

                <button
                  onClick={closeModal}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  )
}
