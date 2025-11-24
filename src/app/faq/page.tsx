// src/app/faq/page.tsx
import React from 'react'
import Navbar from '@/app/components/Navbar'

const faqs = [
  { icon: './pen.png', question: 'How do I upload a PDF file for editing or conversion?', answer: 'Simply drag and drop…' },
  { icon: '🛡️', question: 'Are my files safe and private on this website?', answer: 'Yes, your files are encrypted…' },
  { icon: '📦', question: 'Is there a limit to the file size I can upload?', answer: 'Free users can upload…' },
  { icon: '🔒', question: 'Do I need to create an account to use the tools?', answer: 'No account is required…' },
  { icon: '🛠️', question: 'What types of tools are available on this website?', answer: 'We offer tools to merge…' },
  { icon: '📱', question: 'Can I use this website on my mobile phone or tablet?', answer: 'Absolutely! Our website is…' },
  { icon: '📥', question: 'What happens to my file after I download it?', answer: 'Once you’ve downloaded…' },
  { icon: '📷', question: 'Can I convert scanned PDFs or images into editable text?', answer: 'Yes, our OCR tool can…' },
  { icon: '💻', question: 'Is there a desktop version or Chrome extension available?', answer: 'We currently offer a Chrome extension…' },
]

export default function FAQPage() {
  return (
    <>
      <Navbar />

      {/* wrap in relative container so our stickers can absolutely position */}
      <main
        style={{
          position: 'relative',
          padding: '3rem 5%',
          maxWidth: '1000px',
          margin: '0 auto',
          background: '#ffffffff',
          borderRadius: '12px',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* Decorative stickers */}
        <img
          src="/stickers/blob-yellow.svg"
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            top: '-20px',
            left: '-30px',
            width: '120px',
            opacity: 0.3,
            zIndex: 0,
          }}
        />
        <img
          src="/stickers/dot-grid-blue.svg"
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '-40px',
            width: '100px',
            opacity: 0.25,
            zIndex: 0,
          }}
        />
        <img
          src="/stickers/star-pink.svg"
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            right: '20%',
            width: '60px',
            opacity: 0.4,
            zIndex: 0,
          }}
        />

        {/* ——— Heading & Intro ——— */}
        <h1 style={{ position: 'relative', zIndex: 1, fontSize: '2.5rem', marginBottom: '.5rem' }}>
          Frequently Asked Questions
        </h1>
        <p
          style={{
            position: 'relative',
            zIndex: 1,
            color: '#666',
            marginBottom: '2rem',
            lineHeight: 1.5,
          }}
        >
          Here are the most asked questions based on our users.
        </p>

        {/* ——— FAQ Grid ——— */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {faqs.map(({ icon, question, answer }, idx) => (
            <div
              key={idx}
              style={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: '1.5rem',
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: '#f0f8ff',
                  marginBottom: '0.75rem',
                }}
              >
                <img src={icon} alt="" style={{ width: '1.5rem'}} />
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, marginBottom: '.5rem' }}>
                {question}
              </h3>
              <p style={{ fontSize: '.95rem', color: '#555', lineHeight: 1.5, margin: 0 }}>
                {answer}
              </p>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
