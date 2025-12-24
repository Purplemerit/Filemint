const fs = require('fs');
const path = require('path');

const filesToFix = [
  'pdftoexcel', 'pdftohtml', 'pdftojpg', 'pdftomarkdown', 'pdftopng'
];

const basePath = 'c:\\Users\\harsh\\OneDrive\\Desktop\\purple-merit\\newpdf\\PDFConverter\\src\\app';

filesToFix.forEach(folder => {
  const filePath = path.join(basePath, folder, 'page.tsx');

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${folder}/page.tsx`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Pattern to match the duplicate closing tags after modal
  const pattern = /(\s+)\}\)\s+<\/div>\s+\n\s+\{\/\* Right Ad \*\/\}\s+<VerticalAdRight \/>\s+<\/div>\s+\n\s+<ToolInstructions/;

  if (content.match(pattern)) {
    content = content.replace(pattern, '$1})\n\n      <ToolInstructions');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${folder}/page.tsx`);
  } else {
    console.log(`⚠️  Pattern not found in ${folder}/page.tsx`);
  }
});

console.log('\n🎉 Final fix complete!');
