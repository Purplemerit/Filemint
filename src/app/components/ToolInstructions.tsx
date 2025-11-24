"use client";

import React,{useState,useEffect} from "react";

interface Step {
  id: number;
  title: string;
  text: string;
  image: string;
  imagePosition: "left" | "right";
}

interface ToolInstructionsProps {
  title: string;
  steps: Step[];
}

export default function ToolInstructions({ title, steps }: ToolInstructionsProps) {
   const [isMobile, setIsMobile] = useState(false);
   useEffect(() => {
       const checkWidth = () => setIsMobile(window.innerWidth <= 720);
       checkWidth();
       window.addEventListener("resize", checkWidth);
       return () => window.removeEventListener("resize", checkWidth);
     }, []);
  return (
    <div style={{ 
      maxWidth: "1000px", 
      margin: "4rem auto", 
      padding: "0 2rem" ,
      fontFamily: 'Georgia, "Times New Roman", serif',
    }}>
      {/* Main Title */}
      <h2 style={{
        fontSize: "1.75rem",
        fontWeight: "600",
        marginBottom: "3rem",
        color: "#1a1a1a",
      }}>
        {title}
      </h2>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
        {steps.map((step) => (
          <div
            key={step.id}
            style={{
              display: "flex",
              flexDirection: step.imagePosition === "left" ? "row-reverse" : "row",
              alignItems: "center",
              gap: "3rem",
              flexWrap: "wrap",
            }}
          >
            {/* Text Content */}
            <div style={{ 
              flex: "1", 
              minWidth: "280px",
            }}>
              <h3 style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#1a1a1a",
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: "0.95rem",
                lineHeight: "1.7",
                color: "#555",
              }}>
                {step.text}
              </p>
            </div>

            {/* Image */}
            <div style={{ 
              flex: "1", 
              minWidth: "280px",
              display: "flex",
              justifyContent: "center",
              
            }}>
              <img
                src={step.image}
                alt={step.title}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  marginTop:"70px"
                }}
                onError={(e) => {
                 
                  (e.target as HTMLImageElement).src = "/placeholder-instruction.png";
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}