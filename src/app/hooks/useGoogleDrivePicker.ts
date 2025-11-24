"use client";

import { useEffect, useState, useCallback } from "react";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface UseGoogleDrivePickerProps {
  onFilePicked: (file: File) => void;
}

export function useGoogleDrivePicker({ onFilePicked }: UseGoogleDrivePickerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

   const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;

  // Load Google API scripts
  useEffect(() => {
    const loadScripts = async () => {
      // Load Google API
      if (!document.getElementById("google-api-script")) {
        const gapiScript = document.createElement("script");
        gapiScript.id = "google-api-script";
        gapiScript.src = "https://apis.google.com/js/api.js";
        gapiScript.onload = () => {
          window.gapi.load("picker", () => {
            setIsLoaded(true);
          });
        };
        document.body.appendChild(gapiScript);
      }

      // Load Google Identity Services
      if (!document.getElementById("google-gsi-script")) {
        const gsiScript = document.createElement("script");
        gsiScript.id = "google-gsi-script";
        gsiScript.src = "https://accounts.google.com/gsi/client";
        document.body.appendChild(gsiScript);
      }
    };

    loadScripts();
  }, []);

  // Handle OAuth
  const authorize = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        callback: (response: any) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            setIsAuthorized(true);
            resolve(response.access_token);
          } else {
            reject(new Error("Failed to get access token"));
          }
        },
      });
      tokenClient.requestAccessToken();
    });
  }, [clientId]);

  // Create and show picker
  const openPicker = useCallback(async () => {
    if (!isLoaded) {
      alert("Google Picker is still loading. Please try again.");
      return;
    }

    try {
      let token = accessToken;
      if (!token) {
        token = await authorize();
      }

      const picker = new window.google.picker.PickerBuilder()
        .addView(
          new window.google.picker.DocsView()
            .setIncludeFolders(false)
            .setMimeTypes("application/pdf")
        )
        .setOAuthToken(token)
        .setDeveloperKey(apiKey)
        .setAppId(appId)
        .setCallback(async (data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0];
            await downloadFile(doc.id, doc.name, token!);
          }
        })
        .build();

      picker.setVisible(true);
    } catch (error) {
      console.error("Error opening picker:", error);
      alert("Failed to open Google Drive picker");
    }
  }, [isLoaded, accessToken, authorize, apiKey, appId]);

  // Download file from Google Drive
  const downloadFile = async (fileId: string, fileName: string, token: string) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "application/pdf" });
      onFilePicked(file);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file from Google Drive");
    }
  };

  return { openPicker, isLoaded };
}