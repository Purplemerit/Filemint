import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getStore } from "@netlify/blobs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique ID
    const fileId = uuidv4();

    // Get original file extension
    const originalFileName = file.name;
    const fileExtension = originalFileName.split('.').pop() || 'bin';

    // Create blob key with extension
    const blobKey = `${fileId}.${fileExtension}`;

    // Get Netlify Blobs store
    const store = getStore({
      name: "shared-files",
      consistency: "strong",
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Store file in Netlify Blobs with metadata
    await store.set(blobKey, buffer, {
      metadata: {
        fileName: originalFileName,
        mimeType: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      },
    });

    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    const shareUrl = `${baseUrl}/shared/${blobKey}`;

    return NextResponse.json({ url: shareUrl, fileId });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
