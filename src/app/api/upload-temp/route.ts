import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

    if (!bucketName || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      // Fallback to local storage if AWS is not configured
      console.warn("AWS S3 not configured. Using local storage fallback.");

      // Store in memory (temporary solution - not recommended for production)
      // You should implement a proper local file storage or use a different storage solution
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
      const shareUrl = `${baseUrl}/shared/${blobKey}`;

      // Note: This is a temporary solution. The file won't actually be stored.
      // You need to implement proper storage (filesystem, database, etc.)
      return NextResponse.json({
        url: shareUrl,
        fileId,
        warning: "AWS S3 not configured. File sharing may not work properly. Please configure AWS credentials."
      });
    }

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
      // Make the file publicly accessible
      ACL: 'public-read',
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/shared-files/${blobKey}`;

    // Use the S3 URL directly since we made it public
    const shareUrl = s3Url;

    return NextResponse.json({ url: shareUrl, fileId });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({
      error: "Upload failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
