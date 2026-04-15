import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
      return new NextResponse(
        JSON.stringify({
          error: "Storage not configured",
          message: "Cloudinary is not properly configured. Please contact the administrator."
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Construct Cloudinary URL for the file
    // filename format is the public_id from Cloudinary (e.g., shared-files/uuid)
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${filename}`;

    try {
      // Verify file exists in Cloudinary by making a HEAD request
      const headResponse = await fetch(cloudinaryUrl, { method: "HEAD" });

      if (!headResponse.ok) {
        return new NextResponse(
          JSON.stringify({
            error: "File not found",
            message: "The file you're looking for may have been deleted or the link is invalid."
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Redirect to Cloudinary URL for direct access
      return NextResponse.redirect(cloudinaryUrl, { status: 302 });
    } catch (error) {
      console.error("Cloudinary verification error:", error);
      return new NextResponse(
        JSON.stringify({
          error: "File retrieval failed",
          message: "Unable to retrieve the file from Cloudinary."
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Shared file retrieval error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
