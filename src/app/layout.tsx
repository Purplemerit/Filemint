import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import '@fortawesome/fontawesome-free/css/all.min.css';

import "./globals.css";
import { AuthProvider } from "./context/AuthContext";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FileMint",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Loading screen - shows until page is ready */
            #loading-screen {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: #ffffff;
              z-index: 99999;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: opacity 0.3s ease-out;
            }
            
            #loading-screen.hidden {
              opacity: 0;
              pointer-events: none;
            }
            
            #loading-screen .loader {
              font-family: Georgia, serif;
              font-size: 1.5rem;
              color: #323D68;
              font-weight: 500;
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Loading screen */}
        <div id="loading-screen">
          <div className="loader">FileMint</div>
        </div>

        <AuthProvider>
          {children}
        </AuthProvider>

        {/* Hide loading screen after page loads */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Wait for everything to load
            if (document.readyState === 'complete') {
              document.getElementById('loading-screen').classList.add('hidden');
            } else {
              window.addEventListener('load', function() {
                setTimeout(function() {
                  var loader = document.getElementById('loading-screen');
                  if (loader) loader.classList.add('hidden');
                }, 100);
              });
            }
          `
        }} />
      </body>
    </html>
  );
}