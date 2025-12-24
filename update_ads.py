import os
import re

# List of files to update
files_to_update = [
    "rotatepdf/page.tsx",
    "reorderpdf/page.tsx",
    "deletepdfpages/page.tsx",
    "watermark/page.tsx",
    "comparepdf/page.tsx",
    "ocr/page.tsx",
    "translate/page.tsx",
    "summarizer/page.tsx",
    "wordtopdf/page.tsx",
    "exceltopdf/page.tsx",
    "ppttopdf/page.tsx",
    "jpgtopdf/page.tsx",
    "pngtopdf/page.tsx",
    "tifftopdf/page.tsx",
    "htmltopdf/page.tsx",
    "scantopdf/page.tsx",
    "pdftoexcel/page.tsx",
    "pdftoppt/page.tsx",
    "pdftojpg/page.tsx",
    "pdftopng/page.tsx",
    "pdftotext/page.tsx",
    "pdftohtml/page.tsx",
    "pdftomarkdown/page.tsx",
    "pdftoepub/page.tsx",
    "pdftoxml/page.tsx",
    "esignpdf/page.tsx",
    "quiz/page.tsx",
]

base_path = r"c:\Users\harsh\OneDrive\Desktop\purple-merit\newpdf\PDFConverter\src\app"

for file_path in files_to_update:
    full_path = os.path.join(base_path, file_path)

    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        continue

    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if already updated
    if 'import VerticalAdBanner' in content:
        print(f"Already updated: {file_path}")
        continue

    # Step 1: Add import after Footer import
    content = re.sub(
        r'(import Footer from ["\']\.\.\/components\/footer["\'];)',
        r'\1\nimport VerticalAdBanner from "../components/VerticalAdBanner";',
        content
    )

    # Step 2: Replace the main wrapper
    # Find the return statement with the Navbar pattern
    content = re.sub(
        r'(return \(\s*<div>\s*<Navbar />\s*<div style={{[^}]*maxWidth: "900px"[^}]*margin: "4rem auto"[^}]*padding: "0 2rem"[^}]*}}>)',
        r'''return (
    <div>
      <Navbar />

      <div style={{
        display: "flex",
        maxWidth: "1400px",
        margin: "4rem auto",
        padding: "0 2rem",
        gap: "2rem",
        alignItems: "flex-start"
      }}>
        {/* Left Ad */}
        <VerticalAdBanner className="left-ad" />

        {/* Main Content */}
        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>''',
        content,
        flags=re.DOTALL
    )

    # Step 3: Add closing divs and right ad before URL Input Modal
    content = re.sub(
        r'(</div>\s*</div>\s*</div>\s*{/\* URL Input Modal \*/})',
        r'''</div>
        </div>
        </div>

        {/* Right Ad */}
        <VerticalAdBanner className="right-ad" />
      </div>

      {/* URL Input Modal */}''',
        content,
        flags=re.DOTALL
    )

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated: {file_path}")

print("Done!")
