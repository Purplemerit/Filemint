"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { usePathname } from 'next/navigation';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const getInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.charAt(0) || user.email?.charAt(0) || "?";
    const last = user.lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="header">
        {/* Logo */}
        <div className="logo-container">
          <Link href="/">
            <img src="/Group-14.svg" alt="Logo" className="logo" style={{ height: "26px" }} />
          </Link>
        </div>

        {/* Hamburger for mobile */}
        <div
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Navigation */}
        <nav className={`nav ${menuOpen ? "active" : ""}`}>
          <ul>
            <li><a href="/" className={pathname === "/" ? "active" : ""}><span className="nav-link">Home page</span></a></li>
            <li><a href="/all" className={pathname === "/all" ? "active" : ""}><span className="nav-link">Tools</span></a></li>
            <li><a href="/pricing" className={pathname === "/pricing" ? "active" : ""}><span className="nav-link">Pricing</span></a></li>
            <li><a href="/about" className={pathname === "/about" ? "active" : ""}><span className="nav-link">About</span></a></li>

            {/* Language Dropdown */}
            <li className="lang-dropdown-wrapper" ref={dropdownRef} >
              <button
                className="lang-button"
                onClick={() => setLangOpen(!langOpen)}
                aria-label="Language selector"

              >
                <img src="/subway_world.png" alt="Language" className="world-icon" />
              </button>
              {langOpen && (
                <div className="lang-dropdown">
                  <div className="lang-option active">English</div>
                </div>
              )}
            </li>

            {/* Mobile Login/Profile */}
            {!isLoading && (
              <>
                {!user ? (
                  <li className="mobile-only">
                    <a className="no-underline" href="/login">
                      <span className="nav-link login">Login</span>
                    </a>
                  </li>
                ) : (
                  <li className="mobile-only">
                    <Link href="/profile">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt="Profile"
                          className="profile-circle"
                        />
                      ) : (
                        <div className="profile-circle">{getInitials()}</div>
                      )}
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </nav>

        {/* Desktop Right Section */}
        {!isLoading && (
          <div className="right desktop-only">
            {!user ? (
              <a href="/login" className="no-underline">
                <span className="nav-link login"><span style={{ color: "white" }}>Login</span></span>
              </a>
            ) : (
              <Link href="/profile">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="profile-circle"
                  />
                ) : (
                  <div className="profile-circle">{getInitials()}</div>
                )}
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Styles */}
      <style jsx>{`
  /* ---------- GLOBAL HEADER ---------- */
  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 24px;
    background: #fff;
    border-bottom: none;
    box-shadow: none;
    position: relative;
    z-index: 1000;
    gap: 36px;
  }

  /* ---------- LOGO ---------- */
  .logo-container {
    position: absolute;
    left: 2rem;
  }

  .logo {
    height: 42px;
    cursor: pointer;
  }

  .no-underline {
    text-decoration: none !important;
  }

  /* ---------- NAVIGATION ---------- */
  .nav {
    background-color: #f0f8ff;
    padding: 1.1rem 2.5rem;
    border-radius: 25px;
    min-width: fit-content;
    text-align: center;
    margin: 0 auto;
    transition: all 0.3s ease;
    border: none;
    box-shadow: none;
  }

  .nav ul {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 1.1rem;
    gap: 32px;
    width: 100%;
  }

  .lang-dropdown-wrapper {
    margin-left: auto;
  }

  /* explicit default: desktop shows desktop-only, hides mobile-only */
  .desktop-only {
    display: flex;
    align-items: center;
  }
  .mobile-only {
    display: none;
  }

  /* ---------- LINKS ---------- */
  .nav a,
  .nav-link {
    color: black !important;
    text-decoration: none !important;
    font-weight: 500;
    white-space: nowrap;
  }

  /* Make active links bold */
  .nav a.active .nav-link {
    font-weight: 700 !important;
    color: #000 !important;
  }

  .nav a:hover,
  .nav a:focus,
  .nav a:active,
  .nav a:visited,
  .nav-link:hover,
  .nav-link:focus,
  .nav-link:active {
    text-decoration: none !important;
    color: #000000ff !important;
  }

  /* ---------- LANGUAGE DROPDOWN ---------- */
  .lang-dropdown-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .lang-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  .lang-button:hover {
    transform: scale(1.1);
  }

  .world-icon {
    width: 24px;
    height: 24px;
    display: block;
    margin-left: 40px;
  }

  .lang-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 120px;
    z-index: 1001;
    animation: slideDown 0.2s ease;
  }

  .lang-option {
    padding: 10px 16px;
    cursor: pointer;
    transition: background 0.2s ease;
    font-size: 0.95rem;
    color: #374151;
  }

  .lang-option:hover {
    background: #f3f4f6;
  }

  .lang-option.active {
    font-weight: 600;
    color: #1d4ed8;
  }

  /* ---------- RIGHT SECTION ---------- */
  .right {
    display: flex;
    align-items: center;
    gap: 1rem;
    position: absolute;
    right: 2rem;
  }

  .login {
    margin-right: 1rem;
    color: white;
    background-color: #323D68;
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.3s;
  }

  .login:hover {
    background-color: #2a3459;
  }

  /* ---------- PROFILE CIRCLE ---------- */
  .profile-circle {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #1e2b50;
    color: #fff;
    font-weight: bold;
    font-size: 16px;
    border: 2px solid #1d4ed8;
    cursor: pointer;
    transition: transform 0.2s ease;
    object-fit: cover;
    margin: 0;
  }

  .profile-circle:hover {
    transform: scale(1.08);
  }

  /* ---------- HAMBURGER ---------- */
  .hamburger {
    display: none;
    flex-direction: column;
    justify-content: space-between;
    width: 28px;
    height: 20px;
    cursor: pointer;
    position: absolute;
    right: 1.5rem;
  }

  .hamburger span {
    display: block;
    height: 3px;
    width: 100%;
    background-color: black;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  .hamburger.open span:nth-child(1) {
    transform: rotate(45deg) translateY(8px);
  }
  .hamburger.open span:nth-child(2) {
    opacity: 0;
  }
  .hamburger.open span:nth-child(3) {
    transform: rotate(-45deg) translateY(-8px);
  }

  /* ---------- RESPONSIVE (MOBILE) ---------- */
  @media (max-width: 768px) {
    .header {
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      box-shadow: none;
      position: relative;
    }

    .logo-container {
      position: static;
      margin: 0;
    }

    .hamburger {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 26px;
      height: 20px;
      cursor: pointer;
    }

    .nav {
      position: absolute;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      width: 88%;
      background: #f0f8ff;
      padding: 1rem 0.8rem;
      border-radius: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .nav.active {
      opacity: 1;
      visibility: visible;
    }

    .nav ul {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      margin: 0;
      padding: 0;
    }

    .lang-dropdown-wrapper {
      margin-left: 0 !important;
    }

    .nav li {
      width: 100%;
      text-align: center;
    }

    .nav a {
      display: inline-block;
      width: 100%;
      padding: 0.6rem 0;
      font-size: 1.05rem;
      font-weight: 500;
      color: #000 !important;
      text-decoration: none !important;
      border-radius: 8px;
      transition: background 0.2s ease;
    }

    .nav a.active {
      font-weight: 700 !important;
    }

    .nav a:hover {
      background-color: #e6f4ff;
      color: #0077cc !important;
    }

    /* Language dropdown in mobile */
    .world-icon {
      margin-left: 0;
    }

    .lang-dropdown {
      position: static;
      width: 100%;
      margin-top: 8px;
      transform: none;
    }

    .lang-button {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    /* ---------- PROFILE CIRCLE (mobile version) ---------- */
    .profile-circle {
      width: 42px;
      height: 42px;
      margin: 0 auto;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #1e2b50;
      color: #fff;
      font-size: 15px;
      font-weight: bold;
      border: 2px solid #1d4ed8;
    }

    /* ---------- Visibility helpers ---------- */
    .mobile-only {
      display: block;
    }

    .desktop-only {
      display: none;
    }
  }

  /* Responsive adjustments for medium screens */
  @media (min-width: 769px) and (max-width: 1200px) {
    .nav {
      padding: 1.1rem 1.5rem;
    }
    
    .nav ul {
      gap: 20px;
      font-size: 1rem;
    }
  }

  /* Animation */
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`}</style>
    </>
  );
}