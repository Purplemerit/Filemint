"use client";

import Navbar from '../components/Navbar';
import Footer from '../components/footer';
import React from "react";
import { PiShieldCheckBold, PiFilesBold, PiUserCircleBold } from 'react-icons/pi';

const Terms = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: '#fff' }}>
      <Navbar />

      <style>{`
        .terms-hero {
          background-color: #f8fafc;
          padding: 4rem 1rem;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }
        .terms-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 4rem 2rem;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .terms-section {
          margin-bottom: 3.5rem;
        }
        .terms-section h2 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          color: #1a1a1a;
          margin-bottom: 1.25rem;
          font-weight: 700;
        }
        .terms-section p, .terms-section li {
          font-size: 1.05rem;
          line-height: 1.75;
          color: #4a5568;
        }
        .terms-section ul {
          margin-top: 1rem;
          padding-left: 1.5rem;
        }
        .terms-section li {
          margin-bottom: 0.75rem;
        }
        @media (max-width: 768px) {
          .terms-content {
            padding: 2rem 1.25rem;
          }
          .terms-hero h1 {
            font-size: 2rem !important;
          }
        }
      `}</style>

      <section className="terms-hero">
        <h1 style={{ fontSize: "2.75rem", fontWeight: "800", color: "#1a1b1e", margin: 0, fontFamily: 'Georgia, serif' }}>
          Terms and Conditions
        </h1>
        <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '1.1rem' }}>
          Last Updated: February 24, 2026
        </p>
      </section>

      <main className="terms-content">
        <section className="terms-section">
          <h2><PiShieldCheckBold style={{ color: '#e11d48' }} /> Use of Services</h2>
          <p>
            By accessing and using FileMint, you agree to comply with and be bound by the following terms. We grant you a limited, non-exclusive, non-transferable license to use our platform and tools for personal or professional use.
          </p>
          <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#fff5f5', borderRadius: '12px', borderLeft: '4px solid #e11d48' }}>
            <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#c53030' }}>Prohibited Actions:</p>
            <ul>
              <li>Using services for any illegal activities or unauthorized document manipulation.</li>
              <li>Attempting to bypass security measures or overload our infrastructure.</li>
              <li>Distributing malicious software or automated scrapers on our platform.</li>
            </ul>
          </div>
        </section>

        <section className="terms-section">
          <h2><PiUserCircleBold style={{ color: '#e11d48' }} /> User Responsibilities</h2>
          <p>
            You are solely responsible for the content of the files you upload. You represent and warrant that you own the rights to or have obtained necessary permissions for all uploaded documents.
          </p>
          <ul>
            <li>Ensure accuracy of data before and after conversion.</li>
            <li>Maintain the confidentiality of your account credentials.</li>
            <li>Use tools in a manner that does not infringe on intellectual property rights.</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2><PiFilesBold style={{ color: '#e11d48' }} /> File Handling & Privacy</h2>
          <p>
            Your privacy is our top priority. We implement strict security protocols to ensure your data remains confidential.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Automated Deletion</h3>
              <p style={{ fontSize: '0.95rem' }}>All uploaded and processed files are permanently deleted from our servers within 1-2 hours automatically.</p>
            </div>
            <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Secure Encryption</h3>
              <p style={{ fontSize: '0.95rem' }}>We use bank-grade 256-bit SSL encryption to protect your files during transit and while stored.</p>
            </div>
          </div>
        </section>

        <section className="terms-section" style={{ borderTop: '1px solid #eee', paddingTop: '2rem' }}>
          <p style={{ fontSize: '0.95rem', color: '#718096', fontStyle: 'italic' }}>
            FileMint reserves the right to update these terms at any time. Continued use of the site after changes constitutes acceptance of the new terms.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;

