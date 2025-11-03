"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  // ✅ Safe initials generator with fallback
  const getInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.charAt(0) || user.email?.charAt(0) || "?";
    const last = user.lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase();
  };

  return (
    <>
      <header className="header">
        {/* Logo */}
        <div className="logo-container">
          <Link href="/">
            <img src="/Group-14.svg" alt="Logo" className="logo" />
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
            <li><a href="/"><span className="nav-link">Home page</span></a></li>
            <li><a href="/all"><span className="nav-link">Tools</span></a></li>
            {/* <li><a href="/blogs"><span className="nav-link">Blogs</span></a></li> */}
            <li><a href="/about"><span className="nav-link">About</span></a></li>
            <li><a href="/blogs"><img src="subway_world.png" alt="Settings" /></a></li>

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
                <span className="nav-link login">Login</span>
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

      {/* ✅ Styles */}
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
    border-radius: 20px;
    width: 25%;
    text-align: center;
    margin: 0 auto;
    transition: all 0.3s ease;
    border: none;
    box-shadow: none;
  }

  .nav ul {
    display: flex;
    justify-content: space-around;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 1.1rem;
    gap: 10px;
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
  }
  .nav a:hover,
  .nav a:focus,
  .nav a:active,
  .nav a:visited,
  .nav-link:hover,
  .nav-link:focus,
  .nav-link:active {
    text-decoration: none !important;
    color: #0077cc !important;
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
    background-color: #74caff;
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.3s;
  }

  .login:hover {
    background-color: #60b8f0;
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

  /* ---------- MOBILE (single, clear block) ---------- */
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
    top: 70px; /* appears below header */
    left: 50%;
    transform: translateX(-50%);
    width: 88%; /* narrower box */
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

  .nav a:hover {
    background-color: #e6f4ff;
    color: #0077cc !important;
  }

  /* ---------- PROFILE CIRCLE (mobile version) ---------- */
  .profile-circle {
    width: 42px;
    height: 42px;
    margin: 0 auto;
    margin-top: 8px; /* adds small space below the last nav link */
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


  /* small animation */
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
