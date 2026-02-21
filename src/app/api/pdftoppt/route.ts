import { NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { pdfToImages } from "@/lib/converter";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0)
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });

    const file = files[0];
    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    // Step 1: Render each PDF page to a JPEG image at 120 DPI
    const images = await pdfToImages(buffer, "jpeg", 120);

    // Step 2: Create PowerPoint — one slide per page image
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches (16:9)

    for (let i = 0; i < images.length; i++) {
      const slide = pptx.addSlide();
      const imgData = `data:image/jpeg;base64,${images[i].toString("base64")}`;

      // Fill the entire slide with the PDF page image
      slide.addImage({
        data: imgData,
        x: 0, y: 0,
        w: "100%", h: "100%",
      });
    }

    const pptxBuffer = await (pptx.write as any)({ outputType: "nodebuffer" });

    return new NextResponse(new Uint8Array(pptxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${baseName}.pptx"`,
      },
    });
  } catch (err: any) {
    console.error("❌ PDF→PPT Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
