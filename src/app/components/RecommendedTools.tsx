
"use client";
import React from "react";
import Link from "next/link";

const relatedTools = [
    { title: "Merge PDF", route: "/mergepdf", color: "#E6F4EA", icon: "📄" },
    { title: "Split PDF", route: "/splitpdf", color: "#FDE8E8", icon: "✂️" },
    { title: "Compress PDF", route: "/compresspdf", color: "#E1EFFE", icon: "📉" },
    { title: "Excel to PDF", route: "/exceltopdf", color: "#EBF5FF", icon: "📊" },
    { title: "Word to PDF", route: "/wordtopdf", color: "#E1EFFE", icon: "📝" },
    { title: "Edit PDF", route: "/editpdf", color: "#F3F4F6", icon: "🖋️" },
];

export default function RecommendedTools() {
    return (
        <div style={{ marginTop: "4rem", width: "100%", maxWidth: "1000px" }}>
            <h3 style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#333",
                marginBottom: "1.5rem",
                textAlign: "center",
                fontFamily: "inherit"
            }}>
                You might also need these tools:
            </h3>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "1rem"
            }}>
                {relatedTools.map((tool, i) => (
                    <Link
                        key={i}
                        href={tool.route}
                        style={{ textDecoration: "none" }}
                    >
                        <div style={{
                            backgroundColor: tool.color,
                            padding: "1.25rem",
                            borderRadius: "12px",
                            textAlign: "center",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                            cursor: "pointer",
                            border: "1px solid rgba(0,0,0,0.05)",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem"
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-4px)";
                                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            <span style={{ fontSize: "1.5rem" }}>{tool.icon}</span>
                            <span style={{
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                color: "#333"
                            }}>
                                {tool.title}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
