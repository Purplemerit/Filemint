import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Store file metadata (in production, use a database)
const fileStore = new Map<string, { path: string; expiry: number; mimeType: string }>();

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
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "shared");
    await mkdir(uploadsDir, { recursive: true });
    
    // Save file with original extension
    const fileName = `${fileId}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
    
    // Store metadata with 2-hour expiry and MIME type
    const expiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    fileStore.set(fileId, { 
      path: filePath, 
      expiry,
      mimeType: file.type || 'application/octet-stream'
    });
    
    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    const shareUrl = `${baseUrl}/shared/${fileName}`;
    
    // Optional: Schedule cleanup after expiry
    setTimeout(() => {
      fileStore.delete(fileId);
      try {
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted expired file: ${fileName}`);
        }
      } catch (err) {
        console.error("Failed to delete expired file:", err);
      }
    }, 2 * 60 * 60 * 1000); // 2 hours
    
    return NextResponse.json({ url: shareUrl, fileId });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// Optional: GET endpoint to check file status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileId = searchParams.get('fileId');
  
  if (!fileId) {
    return NextResponse.json({ error: "No fileId provided" }, { status: 400 });
  }
  
  const fileData = fileStore.get(fileId);
  
  if (!fileData) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  
  const isExpired = Date.now() > fileData.expiry;
  
  return NextResponse.json({
    exists: !isExpired,
    expiry: new Date(fileData.expiry).toISOString(),
    expired: isExpired,
  });
}