"use client";

import { useEffect, useState, useCallback } from "react";

declare global {
  interface Window {
    Dropbox: any;
  }
}

interface UseDropboxPickerProps {
  onFilePicked: (file: File) => void;
}

export function useDropboxPicker({ onFilePicked }: UseDropboxPickerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY!;

  // Load Dropbox SDK
  useEffect(() => {
    if (!document.getElementById("dropbox-sdk-script")) {
      const script = document.createElement("script");
      script.id = "dropbox-sdk-script";
      script.src = "https://www.dropbox.com/static/api/2/dropins.js";
      script.setAttribute("data-app-key", appKey);
      script.onload = () => {
        setIsLoaded(true);
      };
      document.body.appendChild(script);
    } else if (window.Dropbox) {
      setIsLoaded(true);
    }
  }, [appKey]);

  const openPicker = useCallback(() => {
    if (!isLoaded || !window.Dropbox) {
      alert("Dropbox picker is still loading. Please try again.");
      return;
    }

    window.Dropbox.choose({
      success: async (files: any[]) => {
        try {
          const fileInfo = files[0];
          
          
          const response = await fetch(fileInfo.link);
          const blob = await response.blob();
          
         
          const file = new File([blob], fileInfo.name, { type: "application/pdf" });
          onFilePicked(file);
        } catch (error) {
          console.error("Error downloading from Dropbox:", error);
          alert("Failed to download file from Dropbox");
        }
      },
      cancel: () => {
       
      },
      linkType: "direct", 
      multiselect: false,
      extensions: [".pdf"],
      folderselect: false,
    });
  }, [isLoaded, onFilePicked]);

  return { openPicker, isLoaded };
}