"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token, isPremium, refreshUserData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth <= 768);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async (plan: string, price: number) => {
    if (!user || !token) {
      router.push("/login");
      return;
    }

    if (plan === "basic") {
      alert("You are already on the Basic plan!");
      return;
    }

    setIsLoading(true);

    try {
      // Create order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan, amount: price }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.message || "Failed to create order");
      }

      // Initialize Razorpay
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "FileMint",
        description: "Premium Subscription",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                plan,
                amount: price,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              alert("🎉 Payment successful! You are now a Premium member.");
              // Refresh user data to update isPremium status
              await refreshUserData();
              router.push("/all"); // Redirect to tools page
            } else {
              throw new Error(verifyData.message || "Payment verification failed");
            }
          } catch (error: any) {
            alert(error.message || "Payment verification failed");
          }
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        theme: {
          color: "#323D68",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const features = {
    basic: [
      "Access to all basic PDF tools",
      "Merge, Split, Compress PDFs",
      "Convert to/from PDF (Word, Excel, JPG, PNG, etc.)",
      "Edit, Rotate, Delete pages",
      "Add watermarks",
      "OCR support",
      "Standard processing speed",
      "Email support",
    ],
    premium: [
      "All Basic features included",
      "AI-powered PDF Summarizer",
      "PDF Language Translator (100+ languages)",
      "AI Questions Generator from PDFs",
      "Priority processing (5x faster)",
      "Unlimited file size",
      "Batch processing (up to 50 files)",
      "Priority email & chat support",
      "Ad-free experience",
      "Advanced security features",
    ],
  };

  return (
    <>
      <Navbar />
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#ffffff",
          paddingBottom: "3rem",
        }}
      >
        {/* Hero Section */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: isMobile ? "3rem 1rem" : "4rem 2rem",
            textAlign: "center",
            color: "white",
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? "2rem" : "3rem",
              fontWeight: "700",
              marginBottom: "1rem",
            }}
          >
            Choose Your Plan
          </h1>
          <p
            style={{
              fontSize: isMobile ? "1rem" : "1.25rem",
              maxWidth: "600px",
              margin: "0 auto",
              opacity: 0.95,
            }}
          >
            Unlock powerful features and take your PDF workflow to the next level
          </p>
        </div>

        {/* Pricing Cards */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: isMobile ? "2rem 1rem" : "3rem 2rem",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: "2rem",
          }}
        >
          {/* Basic Plan */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "2px solid #e5e7eb",
              transition: "transform 0.3s ease",
            }}
          >
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "700",
                marginBottom: "0.5rem",
                color: "#323D68",
              }}
            >
              Basic
            </h2>
            <div style={{ marginBottom: "1.5rem" }}>
              <span
                style={{
                  fontSize: "3rem",
                  fontWeight: "700",
                  color: "#323D68",
                }}
              >
                ₹0
              </span>
              <span style={{ fontSize: "1.125rem", color: "#666" }}>/month</span>
            </div>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              Perfect for occasional PDF tasks
            </p>
            <button
              style={{
                width: "100%",
                padding: "0.875rem",
                backgroundColor: "#e5e7eb",
                color: "#666",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "not-allowed",
                marginBottom: "2rem",
              }}
              disabled
            >
              Current Plan
            </button>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {features.basic.map((feature, index) => (
                <li
                  key={index}
                  style={{
                    padding: "0.75rem 0",
                    borderBottom:
                      index !== features.basic.length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <span style={{ color: "#10b981", fontSize: "1.25rem" }}>✓</span>
                  <span style={{ color: "#374151" }}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Plan */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 8px 30px rgba(102, 126, 234, 0.3)",
              border: "2px solid #667eea",
              position: "relative",
              transition: "transform 0.3s ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-12px",
                right: "20px",
                backgroundColor: "#667eea",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              POPULAR
            </div>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: "700",
                marginBottom: "0.5rem",
                color: "#667eea",
              }}
            >
              Premium
            </h2>
            <div style={{ marginBottom: "1.5rem" }}>
              <span
                style={{
                  fontSize: "3rem",
                  fontWeight: "700",
                  color: "#667eea",
                }}
              >
                ₹299
              </span>
              <span style={{ fontSize: "1.125rem", color: "#666" }}>/month</span>
            </div>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              For professionals who need advanced AI features
            </p>
            <button
              onClick={() => handleSubscribe("premium", 29900)}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "0.875rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                marginBottom: "2rem",
                transition: "opacity 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {isLoading ? "Processing..." : "Subscribe Now"}
            </button>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {features.premium.map((feature, index) => (
                <li
                  key={index}
                  style={{
                    padding: "0.75rem 0",
                    borderBottom:
                      index !== features.premium.length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <span style={{ color: "#667eea", fontSize: "1.25rem" }}>✓</span>
                  <span
                    style={{
                      color: "#374151",
                      fontWeight: index < 3 ? "600" : "400",
                    }}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Features Comparison Table */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "3rem auto",
            padding: isMobile ? "2rem 1rem" : "3rem 2rem",
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? "1.75rem" : "2.25rem",
              fontWeight: "700",
              marginBottom: "2rem",
              textAlign: "center",
              color: "#323D68",
            }}
          >
            Feature Comparison
          </h2>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#374151",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Feature
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      fontWeight: "600",
                      color: "#374151",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Basic
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      fontWeight: "600",
                      color: "#667eea",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Basic PDF Operations", basic: true, premium: true },
                  { feature: "File Conversions", basic: true, premium: true },
                  { feature: "Edit & Rotate Pages", basic: true, premium: true },
                  { feature: "AI PDF Summarizer", basic: false, premium: true },
                  { feature: "Language Translator", basic: false, premium: true },
                  { feature: "Questions Generator", basic: false, premium: true },
                  { feature: "File Size Limit", basic: "10 MB", premium: "Unlimited" },
                  { feature: "Processing Speed", basic: "Standard", premium: "5x Faster" },
                  { feature: "Batch Processing", basic: "5 files", premium: "50 files" },
                  { feature: "Priority Support", basic: false, premium: true },
                  { feature: "Ad-free Experience", basic: false, premium: true },
                ].map((row, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                    }}
                  >
                    <td
                      style={{
                        padding: "1rem",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#374151",
                      }}
                    >
                      {row.feature}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {typeof row.basic === "boolean" ? (
                        row.basic ? (
                          <span style={{ color: "#10b981", fontSize: "1.25rem" }}>
                            ✓
                          </span>
                        ) : (
                          <span style={{ color: "#ef4444", fontSize: "1.25rem" }}>
                            ✗
                          </span>
                        )
                      ) : (
                        <span style={{ color: "#6b7280" }}>{row.basic}</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {typeof row.premium === "boolean" ? (
                        row.premium ? (
                          <span style={{ color: "#667eea", fontSize: "1.25rem" }}>
                            ✓
                          </span>
                        ) : (
                          <span style={{ color: "#ef4444", fontSize: "1.25rem" }}>
                            ✗
                          </span>
                        )
                      ) : (
                        <span style={{ color: "#667eea", fontWeight: "600" }}>
                          {row.premium}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div
          style={{
            maxWidth: "900px",
            margin: "3rem auto",
            padding: isMobile ? "2rem 1rem" : "3rem 2rem",
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? "1.75rem" : "2.25rem",
              fontWeight: "700",
              marginBottom: "2rem",
              textAlign: "center",
              color: "#323D68",
            }}
          >
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[
              {
                q: "Can I cancel my subscription anytime?",
                a: "Yes, you can cancel your Premium subscription at any time. Your access will continue until the end of your billing period.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit/debit cards, UPI, net banking, and digital wallets through Razorpay.",
              },
              {
                q: "Is my payment information secure?",
                a: "Absolutely! All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We never store your payment information.",
              },
              {
                q: "What happens if I downgrade to Basic?",
                a: "If you downgrade, you'll lose access to premium features at the end of your current billing period. All your files and data remain safe.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "white",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: "#323D68",
                  }}
                >
                  {faq.q}
                </h3>
                <p style={{ color: "#666", margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
