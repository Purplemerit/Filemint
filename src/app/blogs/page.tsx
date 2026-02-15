'use client'
import React, { useState, useEffect } from 'react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/footer'
import Image from 'next/image'
import Link from 'next/link'
import { posts } from './data'

export default function BlogsPage() {
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

      <main style={{ padding: isMobile ? '3rem 1.5rem' : '4rem 2rem', maxWidth: '1200px', margin: '-2rem auto 4rem', position: 'relative', zIndex: 10 }}>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '2rem' : '2.5rem',
            justifyItems: 'stretch',
          }}
        >
          {posts.map(({ title, desc, image, slug }, idx) => (
            <Link
              key={idx}
              href={`/blogs/${slug}`}
              style={{ textDecoration: 'none', display: 'flex' }}
            >
              <div
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
                  width: '100%',
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
                    style={{ objectFit: 'cover' }}
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
                  <div
                    style={{
                      color: '#667eea',
                      fontWeight: 600,
                      fontSize: '.95rem',
                      fontFamily: "system-ui, sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    Read Blog <span style={{ fontSize: '1.1rem' }}>→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
