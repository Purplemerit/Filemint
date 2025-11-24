// src/app/terms/page.tsx
import Navbar from '../components/Navbar';
import React from "react";
import Link from "next/link";

const Terms = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" ,fontFamily: 'Georgia, "Times New Roman", serif'}}>
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
          Terms and Conditions
        </h1>

        {/* Section 1 */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "600", marginBottom: "1rem" }}>Use of Services</h2>
          <p style={{ marginBottom: "1rem", lineHeight: "1.6" }}>
            You may access and use the services provided by [Your Website Name] solely for lawful purposes and in accordance with these Terms. You are granted a limited, non-exclusive, non-transferable license to use our platform and tools.
          </p>
          <p style={{ marginBottom: "0.5rem" }}>You agree not to:</p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem", lineHeight: "1.6" }}>
            <li>Use our services in a way that violates any laws or regulations.</li>
            <li>Upload or distribute files containing viruses, malware, or any other harmful software.</li>
            <li>Use automated scripts, bots, or other means to overload or interfere with our systems.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "600", marginBottom: "1rem" }}>User Responsibilities</h2>
          <p style={{ marginBottom: "1rem", lineHeight: "1.6" }}>When using our services, you agree to:</p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem", lineHeight: "1.6" }}>
            <li>Ensure all files uploaded belong to you or that you have permission to use them.</li>
            <li>Not upload any sensitive personal data unless necessary and done with informed consent.</li>
            <li>Not use our tools to manipulate copyrighted documents unless you own the rights.</li>
          </ul>
          <p style={{ marginTop: "1rem", lineHeight: "1.6" }}>
            You are solely responsible for the contents of your uploaded documents and their subsequent use.
          </p>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "600", marginBottom: "1rem" }}>File Uploads and Data Privacy</h2>
          <p style={{ marginBottom: "1rem", lineHeight: "1.6" }}>
            We understand that privacy and data security are critical when working with files. Here's how we handle your files:
          </p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem", lineHeight: "1.6" }}>
            <li>
              <strong>Temporary Storage:</strong> Uploaded files are stored on our secure servers temporarily and automatically deleted within [e.g., 1-2 hours] unless saved by registered users.
            </li>
            <li>
              <strong>No Manual Access:</strong> Our team does not view or access your files unless you provide explicit permission for support purposes.
            </li>
          </ul>
        </section>
      </main>

      {/* Footer remains unchanged */}
      
    </div>
  );
};

export default Terms;
