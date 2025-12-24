const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'watermark', 'comparepdf', 'ocr', 'translate', 'summarizer', 'wordtopdf', 'exceltopdf',
  'ppttopdf', 'jpgtopdf', 'pngtopdf', 'tifftopdf', 'htmltopdf', 'scantopdf',
  'pdftoexcel', 'pdftoppt', 'pdftojpg', 'pdftopng', 'pdftotext', 'pdftohtml',
  'pdftomarkdown', 'pdftoepub', 'pdftoxml', 'esignpdf', 'quiz', 'pdftoword'
];

const basePath = 'c:\\Users\\harsh\\OneDrive\\Desktop\\purple-merit\\newpdf\\PDFConverter\\src\\app';

filesToUpdate.forEach(folder => {
  const filePath = path.join(basePath, folder, 'page.tsx');

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${folder}/page.tsx`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already updated
  if (content.includes('<VerticalAdLeft')) {
    console.log(`✅ Already updated: ${folder}/page.tsx`);
    return;
  }

  // Step 1: Replace the main wrapper opening (after Navbar)
  const navbarPattern = /(<Navbar\s*\/>\s*)\n\s*<div style=\{\{\s*maxWidth:\s*"900px",\s*margin:\s*"4rem auto",\s*padding:\s*"0 2rem"\s*\}\}>/;

  if (!content.match(navbarPattern)) {
    console.log(`⚠️  ${folder}/page.tsx - navbar wrapper pattern not found`);
    return;
  }

  content = content.replace(
    navbarPattern,
    `$1\n      <div style={{\n        display: "flex",\n        maxWidth: "1400px",\n        margin: "4rem auto",\n        padding: "0 2rem",\n        gap: "2rem",\n        alignItems: "flex-start"\n      }}>\n        {/* Left Ad */}\n        <VerticalAdLeft />\n\n        {/* Main Content */}\n        <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto" }}>`
  );

  // Step 2: Add closing divs and right ad before ToolInstructions
  const toolPattern = /\n(\s*)<ToolInstructions/;
  const match = content.match(toolPattern);

  if (!match) {
    console.log(`⚠️  ${folder}/page.tsx - ToolInstructions not found`);
    return;
  }

  content = content.replace(
    toolPattern,
    `\n        </div>\n\n        {/* Right Ad */}\n        <VerticalAdRight />\n      </div>\n\n${match[1]}<ToolInstructions`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Updated: ${folder}/page.tsx`);
});

console.log('\n🎉 All files updated!');
