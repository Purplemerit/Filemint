"use client";

import React, { useRef, useState, useEffect } from "react";
import { PiStar, PiStarFill } from "react-icons/pi";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  rating: number;
  text: string;
}

interface TestimonialsProps {
  title?: string;
  testimonials: Testimonial[];
  autoScrollInterval?: number;
}

export default function Testimonials({ 
  title = "Testimonials", 
  testimonials,
  autoScrollInterval = 3000
}: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [testimonials.length, autoScrollInterval, isHovered]);

  // Render stars based on rating
  const renderStars = (rating: number) => {
    return (
      <div style={{ display: "flex", gap: "2px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? (
            <PiStarFill key={star} size={14} style={{ color: "#f59e0b" }} />
          ) : (
            <PiStar key={star} size={14} style={{ color: "#d1d5db" }} />
          )
        ))}
      </div>
    );
  };

  // Get visible cards (5 cards: 2 left, center, 2 right)
  const getVisibleCards = () => {
    const cards = [];
    for (let i = -2; i <= 2; i++) {
      let index = currentIndex + i;
      // Wrap around for infinite loop effect
      if (index < 0) index = testimonials.length + index;
      if (index >= testimonials.length) index = index % testimonials.length;
      cards.push({ position: i, testimonial: testimonials[index] });
    }
    return cards;
  };

  // Get card styles based on position
  const getCardStyle = (position: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      width: "280px",
      backgroundColor: "#EFF5FF66",
      borderRadius: "12px",
      padding: "1.5rem",
      border: "2px solid #1B95F852",
      transition: "all 0.5s ease",
      cursor: "pointer",
      height: "300px"
    };

    switch (position) {
      case -2: // Far left
        return {
          ...baseStyle,
          left: "-15%",
          transform: "translateX(-30%) scale(0.75)",
          opacity: 1,
          zIndex: 1,
        };
      case -1: // Left
        return {
          ...baseStyle,
          left: "20%",
          transform: "translateX(-50%) scale(1)",
          opacity: 1,
          zIndex: 2,
        };
      case 0: // Center
        return {
          ...baseStyle,
          left: "50%",
          transform: "translateX(-50%) scale(1)",
          opacity: 1,
          zIndex: 3,
          boxShadow: "0 8px 24px rgba(59, 130, 246, 0.15)",
          border: "2px solid #60a5fa",
        };
      case 1: // Right
        return {
          ...baseStyle,
          left: "80%",
          transform: "translateX(-50%) scale(1)",
          opacity: 1,
          zIndex: 2,
        };
      case 2: // Far right
        return {
          ...baseStyle,
          left: "115%",
          transform: "translateX(-70%) scale(0.75)",
          opacity: 1,
          zIndex: 1,
        };
      default:
        return baseStyle;
    }
  };

  const handleCardClick = (position: number) => {
    if (position !== 0) {
      setCurrentIndex((prev) => {
        let newIndex = prev + position;
        if (newIndex < 0) newIndex = testimonials.length + newIndex;
        if (newIndex >= testimonials.length) newIndex = newIndex % testimonials.length;
        return newIndex;
      });
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Mobile view - single card with navigation
  if (isMobile) {
    const currentTestimonial = testimonials[currentIndex];
    
    return (
      <div style={{
        padding: "3rem 1rem",
        backgroundColor: "#ffffffff",
        overflow: "hidden",
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}>
        {/* Title */}
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          textAlign: "center",
          marginBottom: "2rem",
          color: "#1a1a1a",
        }}>
          {title}
        </h2>

        {/* Single Card */}
        <div style={{
          maxWidth: "400px",
          margin: "0 auto",
          backgroundColor: "#EFF5FF66",
          borderRadius: "12px",
          padding: "1.5rem",
          border: "2px solid #60a5fa",
          boxShadow: "0 8px 24px rgba(59, 130, 246, 0.15)",
          minHeight: "280px",
        }}>
          {/* User Info */}
          <div style={{ marginBottom: "0.75rem" }}>
            <h4 style={{
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#1a1a1a",
              marginBottom: "0.25rem",
            }}>
              {currentTestimonial.name}
            </h4>
            <p style={{
              fontSize: "0.75rem",
              color: "#666",
              marginBottom: "0.5rem",
            }}>
              {currentTestimonial.role}
            </p>
            {renderStars(currentTestimonial.rating)}
          </div>

          {/* Testimonial Text */}
          <p style={{
            fontSize: "0.85rem",
            lineHeight: "1.6",
            color: "#444",
            marginTop: "1rem",
          }}>
            <strong>{currentTestimonial.text.split('.')[0]}.</strong>
            {currentTestimonial.text.split('.').slice(1).join('.')}
          </p>
        </div>

        {/* Navigation Arrows */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginTop: "1.5rem",
        }}>
          <button
            onClick={handlePrev}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "2px solid #60a5fa",
              backgroundColor: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              color: "#60a5fa",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#60a5fa";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.color = "#60a5fa";
            }}
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "2px solid #60a5fa",
              backgroundColor: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              color: "#60a5fa",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#60a5fa";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.color = "#60a5fa";
            }}
          >
            ›
          </button>
        </div>

        {/* Dots Indicator */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          marginTop: "1.5rem",
        }}>
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: index === currentIndex ? "24px" : "8px",
                height: "8px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: index === currentIndex ? "#60a5fa" : "#d1d5db",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop view - carousel (original design)
  return (
    <div style={{
      padding: "5rem 5rem",
      backgroundColor: "#ffffffff",
      overflow: "hidden",
      fontFamily: 'Georgia, "Times New Roman", serif',
    }}>
      {/* Title */}
      <h2 style={{
        fontSize: "1.75rem",
        fontWeight: "600",
        textAlign: "center",
        marginBottom: "3rem",
        color: "#1a1a1a",
      }}>
        {title}
      </h2>

      {/* Carousel Container */}
      <div 
        style={{ 
          position: "relative", 
          maxWidth: "1000px", 
          margin: "0 auto",
          height: "320px",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {getVisibleCards().map(({ position, testimonial }) => (
          <div
            key={`${testimonial.id}-${position}`}
            style={getCardStyle(position)}
            onClick={() => handleCardClick(position)}
          >
            {/* User Info */}
            <div style={{ marginBottom: "0.75rem" }}>
              <h4 style={{
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "0.25rem",
              }}>
                {testimonial.name}
              </h4>
              <p style={{
                fontSize: "0.75rem",
                color: "#666",
                marginBottom: "0.5rem",
              }}>
                {testimonial.role}
              </p>
              {renderStars(testimonial.rating)}
            </div>

            {/* Testimonial Text */}
            <p style={{
              fontSize: "0.8rem",
              lineHeight: "1.6",
              color: "#444",
              marginTop: "1rem",
            }}>
              <strong>{testimonial.text.split('.')[0]}.</strong>
              {testimonial.text.split('.').slice(1).join('.')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}