"use client";

import React, { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/footer';
import { PiCaretDown, PiQuestionBold } from 'react-icons/pi';

const faqs = [
  {
    question: 'How do I upload a PDF file for editing or conversion?',
    answer: 'Simply drag and drop your file into the designated upload area on the tool page, or click the "Select Files" button to browse from your device, Google Drive, or Dropbox.'
  },
  {
    question: 'Are my files safe and private on this website?',
    answer: 'Yes, your files are encrypted via SSL/TLS and automatically deleted from our servers within 1-2 hours. We never share your data with third parties.'
  },
  {
    question: 'Is there a limit to the file size I can upload?',
    answer: 'Free users can upload files up to 50MB. Pro users enjoy larger limits up to 2GB per file.'
  },
  {
    question: 'Do I need to create an account to use the tools?',
    answer: 'No account is required for basic usage. However, creating a free account allows you to track your conversion history and access more features.'
  },
  {
    question: 'What types of tools are available on this website?',
    answer: 'We offer a comprehensive suite including Merge, Split, Compress, Edit, and conversions between PDF and Word, Excel, PPT, JPG, and more.'
  },
  {
    question: 'Can I use this website on my mobile phone or tablet?',
    answer: 'Absolutely! Our website is fully responsive and optimized for all mobile devices and tablets, providing a seamless experience on the go.'
  },
  {
    question: 'What happens to my file after I download it?',
    answer: 'Once you’ve downloaded your converted file, it remains on our secure servers for a short duration (1-2 hours) before being permanently deleted.'
  },
  {
    question: 'Can I convert scanned PDFs or images into editable text?',
    answer: 'Yes, our advanced OCR (Optical Character Recognition) tool can extract text from scanned documents and images with high accuracy.'
  },
  {
    question: 'Is there a desktop version or Chrome extension available?',
    answer: 'We currently offer a powerful Chrome extension for quick access. A dedicated desktop application is currently in development.'
  },
];

const AccordionItem = ({ question, answer, isOpen, onClick }: { question: string, answer: string, isOpen: boolean, onClick: () => void }) => {
  return (
    <div style={{
      borderBottom: '1px solid #f0f0f0',
      overflow: 'hidden',
    }}>
      <button
        onClick={onClick}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.3s ease',
        }}
      >
        <span style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          color: isOpen ? '#e11d48' : '#1a1a1a',
          transition: 'color 0.3s ease',
        }}>
          {question}
        </span>
        <PiCaretDown
          size={20}
          style={{
            color: isOpen ? '#e11d48' : '#666',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease, color 0.3s ease',
          }}
        />
      </button>
      <div style={{
        maxHeight: isOpen ? '500px' : '0',
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <p style={{
          paddingBottom: '1.5rem',
          color: '#555',
          lineHeight: '1.7',
          fontSize: '1rem',
          margin: 0,
        }}>
          {answer}
        </p>
      </div>
    </div>
  );
};

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <style>{`
        .faq-hero {
          background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
          padding: 5rem 1rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .faq-hero::before {
          content: "";
          position: absolute;
          top: -10%;
          left: -10%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(225, 29, 72, 0.05) 0%, transparent 70%);
          z-index: 0;
        }
        .faq-container {
          max-width: 800px;
          margin: -3rem auto 5rem;
          padding: 3rem;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          position: relative;
          z-index: 10;
        }
        @media (max-width: 768px) {
          .faq-container {
            margin: 1rem;
            padding: 1.5rem;
          }
          .faq-hero {
            padding: 3rem 1rem;
          }
        }
      `}</style>

      <section className="faq-hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(225, 29, 72, 0.1)',
            borderRadius: '100px',
            color: '#e11d48',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: '1.5rem'
          }}>
            <PiQuestionBold size={18} />
            Support Center
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#1a1b1e',
            marginBottom: '1rem',
            fontFamily: 'Georgia, serif'
          }}>
            Have a Question?
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Everything you need to know about FileMint. Can't find an answer? Feel free to reach out to our support team.
          </p>
        </div>
      </section>

      <main className="faq-container">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        <div style={{
          marginTop: '3.5rem',
          padding: '2rem',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          textAlign: 'center',
          border: '1px dashed #e2e8f0'
        }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: '700' }}>Still have questions?</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>We're here to help you get the most out of our tools.</p>
          <button
            onClick={() => window.location.href = 'mailto:support@filemint.com'}
            style={{
              backgroundColor: '#e11d48',
              color: 'white',
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Contact Support
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

