const fs = require('fs');
const path = require('path');

const filesToFix = [
  'watermark', 'ocr', 'translate', 'summarizer', 'wordtopdf', 'exceltopdf',
  'ppttopdf', 'jpgtopdf', 'pngtopdf', 'tifftopdf', 'htmltopdf', 'scantopdf',
  'pdftoexcel', 'pdftoppt', 'pdftojpg', 'pdftopng', 'pdftotext', 'pdftohtml',
  'pdftomarkdown', 'pdftoepub', 'pdftoxml', 'esignpdf', 'quiz', 'pdftoword'
];

const basePath = 'c:\\Users\\harsh\\OneDrive\\Desktop\\purple-merit\\newpdf\\PDFConverter\\src\\app';

filesToFix.forEach(folder => {
  const filePath = path.join(basePath, folder, 'page.tsx');

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${folder}/page.tsx`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Remove duplicate closing tags after modal (they should be before the modal)
  // Pattern 1: with extra blank line
  content = content.replace(
    /      \}\)\s+<\/div>\s+\n\s+\n\s+\{\/\* Right Ad \*\/\}\s+<VerticalAdRight \/>\s+<\/div>/g,
    '      })'
  );

  // Pattern 2: without extra blank line
  content = content.replace(
    /      \}\)\s+<\/div>\s+\n\s+\{\/\* Right Ad \*\/\}\s+<VerticalAdRight \/>\s+<\/div>/g,
    '      })'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed: ${folder}/page.tsx`);
});

console.log('\n🎉 Fix complete!');
