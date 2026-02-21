import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const maxDuration = 120;

async function findPython(): Promise<string> {
  // Check venv first, then system python
  const candidates = [
    "/opt/pdf2docx-env/bin/python",
    "/opt/pdf2docx-env/bin/python3",
    "python3",
    "python",
  ];
  for (const bin of candidates) {
    try {
      await execAsync(`${bin} -c "import pdfplumber, openpyxl"`);
      return bin;
    } catch { }
  }
  throw new Error(
    "pdfplumber/openpyxl not found. On EC2:\n" +
    "pip3 install pdfplumber openpyxl --break-system-packages\n" +
    "OR: /opt/pdf2docx-env/bin/pip install pdfplumber openpyxl"
  );
}

const PYTHON_SCRIPT = `
import sys
import json
import pdfplumber
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

input_path = sys.argv[1]
output_path = sys.argv[2]

wb = openpyxl.Workbook()
# Remove default sheet
if "Sheet" in wb.sheetnames:
    del wb["Sheet"]

thin_border = Border(
    left=Side(style='thin'),
    right=Side(style='thin'),
    top=Side(style='thin'),
    bottom=Side(style='thin')
)

with pdfplumber.open(input_path) as pdf:
    for page_num, page in enumerate(pdf.pages):
        # Try extracting tables first
        tables = page.extract_tables({
            "vertical_strategy": "lines_strict",
            "horizontal_strategy": "lines_strict",
            "snap_tolerance": 3,
            "join_tolerance": 3,
            "edge_min_length": 3,
            "min_words_vertical": 1,
            "min_words_horizontal": 1,
        })
        
        if not tables:
            # Fallback: try with text strategy
            tables = page.extract_tables({
                "vertical_strategy": "text",
                "horizontal_strategy": "text",
            })

        if tables:
            for t_idx, table in enumerate(tables):
                sheet_name = f"Page{page_num+1}"
                if t_idx > 0:
                    sheet_name += f"_T{t_idx+1}"
                
                # Truncate sheet name to 31 chars (Excel limit)
                sheet_name = sheet_name[:31]
                
                ws = wb.create_sheet(title=sheet_name)
                
                for r_idx, row in enumerate(table):
                    if row is None:
                        continue
                    for c_idx, cell_val in enumerate(row):
                        cell = ws.cell(row=r_idx+1, column=c_idx+1)
                        cell.value = str(cell_val).strip() if cell_val is not None else ""
                        cell.border = thin_border
                        cell.alignment = Alignment(wrap_text=True, vertical='center')
                        
                        # Bold first row (header)
                        if r_idx == 0:
                            cell.font = Font(bold=True)
                            cell.fill = PatternFill(start_color="D3D3D3", end_color="D3D3D3", fill_type="solid")
                
                # Auto-size columns
                for col in ws.columns:
                    max_len = 0
                    col_letter = get_column_letter(col[0].column)
                    for c in col:
                        try:
                            if c.value and len(str(c.value)) > max_len:
                                max_len = len(str(c.value))
                        except:
                            pass
                    ws.column_dimensions[col_letter].width = min(max_len + 4, 50)
        else:
            # No table found: extract words and place in grid
            words = page.extract_words()
            if words:
                ws = wb.create_sheet(title=f"Page{page_num+1}"[:31])
                # Group words by approximate y-position (row)
                rows_dict = {}
                for word in words:
                    y_key = round(word['top'] / 10) * 10
                    if y_key not in rows_dict:
                        rows_dict[y_key] = []
                    rows_dict[y_key].append(word)
                
                for r_idx, y_key in enumerate(sorted(rows_dict.keys())):
                    row_words = sorted(rows_dict[y_key], key=lambda w: w['x0'])
                    for c_idx, word in enumerate(row_words):
                        ws.cell(row=r_idx+1, column=c_idx+1, value=word['text'])

# Remove empty workbook guard
if not wb.sheetnames:
    ws = wb.create_sheet("Sheet1")
    ws.cell(row=1, column=1, value="No content found in PDF")

wb.save(output_path)
print("SUCCESS")
`;

export async function POST(req: NextRequest) {
  const tmpId = Date.now().toString();
  const inputPath = path.join(tmpdir(), `pdftoexcel_${tmpId}.pdf`);
  const outputPath = path.join(tmpdir(), `pdftoexcel_${tmpId}.xlsx`);
  const scriptPath = path.join(tmpdir(), `pdftoexcel_script_${tmpId}.py`);

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0)
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });

    const pdfFile = files[0];
    const buffer = Buffer.from(await pdfFile.arrayBuffer());
    const baseName = pdfFile.name.replace(/\.[^/.]+$/, "");

    // Write input PDF
    fs.writeFileSync(inputPath, buffer);

    // Write Python script to temp file (avoids escaping issues)
    fs.writeFileSync(scriptPath, PYTHON_SCRIPT);

    // Find python with pdfplumber
    let python: string;
    try {
      python = await findPython();
    } catch {
      // Try to auto-install
      await execAsync("pip3 install pdfplumber openpyxl --break-system-packages 2>&1 || true");
      python = "python3";
    }

    const { stdout, stderr } = await execAsync(
      `${python} "${scriptPath}" "${inputPath}" "${outputPath}"`,
      { timeout: 110000 }
    );

    if (!stdout.includes("SUCCESS")) {
      throw new Error(`pdfplumber failed: ${stdout} ${stderr}`);
    }

    if (!fs.existsSync(outputPath)) {
      throw new Error("Output Excel file was not created");
    }

    const xlsxBuffer = fs.readFileSync(outputPath);

    return new NextResponse(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error("❌ PDF→Excel Error:", err.message);
    return NextResponse.json(
      { error: `Conversion failed: ${err.message}` },
      { status: 500 }
    );
  } finally {
    try { fs.unlinkSync(inputPath); } catch { }
    try { fs.unlinkSync(outputPath); } catch { }
    try { fs.unlinkSync(scriptPath); } catch { }
  }
}