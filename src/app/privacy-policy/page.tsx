// src/app/privacy-policy/page.tsx
import React from "react";
import Navbar from '../components/Navbar';
const PrivacyPolicy = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <Navbar />
      <main
        style={{
          flexGrow: 1,
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
          padding: "40px 20px",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "2rem", textAlign: "left" }}>
          Privacy Policy
        </h1>

        {/* Section 1 */}
        <section style={{ marginBottom: "2.5rem" }}>
          <p style={{ marginBottom: "1rem", lineHeight: "1.6" }}>
            At FileMint, we respect your privacy and are committed to protecting your personal data and uploaded documents. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website and services.
          </p>
          <p style={{ marginBottom: "1rem", lineHeight: "1.6" }}>
            By using our website, you agree to the practices outlined in this Privacy Policy.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "600", marginBottom: "1rem" }}>
            What Information We Collect
          </h2>
          <p style={{ marginBottom: "1rem", lineHeight: "1.6" }}>
            We may collect the following types of information:
          </p>

          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem", lineHeight: "1.6" }}>
            <li style={{ marginBottom: "0.5rem" }}>
              <a>a) Uploaded Files:</a>
              <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem", lineHeight: "1.6" }}>
                <li>Files you upload for editing, merging, converting, etc.</li>
                <li>These are temporarily stored and automatically deleted after a short period (see Section 4).</li>
              </ul>
            </li>

            <li style={{ marginBottom: "0.5rem" }}>
              <a>b) Personal Information (Optional):</a>
              <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem", lineHeight: "1.6" }}>
                <li>Name</li>
                <li>Email address</li>
                <li>Password (encrypted)</li>
                <li>Billing information (for Pro users)</li>
              </ul>
            </li>

            <li style={{ marginBottom: "0.5rem" }}>
              <a>c) Usage Data (Automatically Collected):</a>
              <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem", lineHeight: "1.6" }}>
                <li>Browser type and version</li>
                <li>Device type</li>
                <li>Operating system</li>
                <li>IP address</li>
                <li>Time spent on pages</li>
                <li>Referring URLs</li>
                <li>Actions taken on the site (e.g., tools used)</li>
              </ul>
            </li>
          </ul>

          <p style={{ lineHeight: "1.6" }}>
            This helps us improve performance and user experience.
          </p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
