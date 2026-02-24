"use client";

import Navbar from '../components/Navbar';
import Footer from '../components/footer';
import React from "react";
import { PiEyeBold, PiKeyBold, PiChartBarBold, PiLockBold } from 'react-icons/pi';

const PrivacyPolicy = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: '#fff' }}>
      <Navbar />

      <style>{`
        .privacy-hero {
          background-color: #f8fafc;
          padding: 4rem 1rem;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }
        .privacy-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 4rem 2rem;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .privacy-section {
          margin-bottom: 3.5rem;
        }
        .privacy-section h2 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          color: #1a1a1a;
          margin-bottom: 1.25rem;
          font-weight: 700;
        }
        .privacy-section p, .privacy-section li {
          font-size: 1.05rem;
          line-height: 1.75;
          color: #4a5568;
        }
        .privacy-section ul {
          margin-top: 1rem;
          padding-left: 1.5rem;
        }
        .privacy-section li {
          margin-bottom: 0.75rem;
        }
        @media (max-width: 768px) {
          .privacy-content {
            padding: 2rem 1.25rem;
          }
          .privacy-hero h1 {
            font-size: 2rem !important;
          }
        }
      `}</style>

      <section className="privacy-hero">
        <h1 style={{ fontSize: "2.75rem", fontWeight: "800", color: "#1a1b1e", margin: 0, fontFamily: 'Georgia, serif' }}>
          Privacy Policy
        </h1>
        <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '1.1rem' }}>
          Your data security is our commitment.
        </p>
      </section>

      <main className="privacy-content">
        <section className="privacy-section">
          <h2><PiEyeBold style={{ color: '#e11d48' }} /> Overview</h2>
          <p>
            At FileMint, we respect your privacy and are committed to protecting your personal data and uploaded documents. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website and services.
          </p>
          <p style={{ marginTop: '1rem' }}>
            By using our website, you agree to the practices outlined in this policy. We ensure that your files remain private and are only processed for the specific tasks you request.
          </p>
        </section>

        <section className="privacy-section">
          <h2><PiKeyBold style={{ color: '#e11d48' }} /> What Information We Collect</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', border: '1px solid #f1f5f9', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>a) Uploaded Files</h3>
              <p style={{ fontSize: '0.95rem' }}>Files you upload for editing, merging, or converting are temporarily stored and automatically deleted from our servers within 1-2 hours.</p>
            </div>
            <div style={{ padding: '1.5rem', border: '1px solid #f1f5f9', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>b) Account Information</h3>
              <p style={{ fontSize: '0.95rem' }}>For registered users, we collect your name, email address, and encrypted password to manage your account and subscription preferences.</p>
            </div>
            <div style={{ padding: '1.5rem', border: '1px solid #f1f5f9', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>c) Usage Data</h3>
              <p style={{ fontSize: '0.95rem' }}>We collect technical data such as browser type, IP address, and time spent on pages to improve our service performance and user experience.</p>
            </div>
          </div>
        </section>

        <section className="privacy-section">
          <h2><PiLockBold style={{ color: '#e11d48' }} /> Data Protection</h2>
          <p>
            We use industry-standard security measures, including HTTPS encryption and secure server environments, to protect your data from unauthorized access or disclosure.
          </p>
          <ul>
            <li>Files are never manually accessed by our staff.</li>
            <li>We do not sell or monetize your personal data or document content.</li>
            <li>Processing is done through secure, isolated environments.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2><PiChartBarBold style={{ color: '#e11d48' }} /> Cookies & Analytics</h2>
          <p>
            We use essential cookies to maintain your session and basic analytics to understand site performance. You can manage your cookie preferences through your browser settings.
          </p>
        </section>

        <section className="privacy-section" style={{ borderTop: '1px solid #eee', paddingTop: '2rem' }}>
          <p style={{ fontSize: '0.95rem', color: '#718096', fontStyle: 'italic' }}>
            If you have any questions regarding this Privacy Policy, please contact our privacy officer at privacy@filemint.com.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

