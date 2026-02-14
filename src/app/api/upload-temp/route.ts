import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getStore } from "@netlify/blobs";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check if AWS S3 is configured
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const hasS3Config = bucketName && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

    if (hasS3Config) {
      // Upload to S3
      const uploadParams = {
        Bucket: bucketName,
        Key: `shared-files/${blobKey}`,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
        Metadata: {
          originalFileName: originalFileName,
          uploadedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        },
        ACL: 'public-read' as any,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      // Generate shareable URL
      const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/shared-files/${blobKey}`;
      return NextResponse.json({ url: s3Url, fileId });
    }

    // Fallback to Netlify Blobs if on Netlify or if S3 is missing
    try {
      const store = getStore("shared-files");
      await store.set(blobKey, buffer, {
        metadata: {
          originalFileName,
          uploadedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
      const shareUrl = `${baseUrl}/shared/${blobKey}`;

      return NextResponse.json({
        url: shareUrl,
        fileId,
        storage: "netlify-blobs"
      });
    } catch (blobError) {
      console.error("Netlify Blobs error:", blobError);

      // If NOT on Netlify and S3 is missing, fall back to the warning logic
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
      const shareUrl = `${baseUrl}/shared/${blobKey}`;

      return NextResponse.json({
        url: shareUrl,
        fileId,
        warning: "AWS S3 and Netlify Blobs not configured. File sharing may not work properly."
      });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({
      error: "Upload failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
