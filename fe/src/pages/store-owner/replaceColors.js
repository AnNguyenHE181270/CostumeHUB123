const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'replaceColors.js');

const replacements = [
  { regex: /bg-gray-50(?![\/\w])/g, replacement: 'bg-[#faf9f7]' },
  { regex: /text-gray-900/g, replacement: 'text-[#1a1a1a]' },
  { regex: /text-gray-800/g, replacement: 'text-[#1a1a1a]' },
  { regex: /text-gray-700/g, replacement: 'text-[#555]' },
  { regex: /text-gray-600/g, replacement: 'text-[#555]' },
  { regex: /text-gray-500/g, replacement: 'text-[#999]' },
  { regex: /text-gray-400/g, replacement: 'text-[#999]' },
  { regex: /border-gray-200/g, replacement: 'border-[#eaeaea]' },
  { regex: /border-gray-300/g, replacement: 'border-[#eaeaea]' },
  { regex: /border-gray-100/g, replacement: 'border-[#f0f0f0]' },
  { regex: /bg-blue-500/g, replacement: 'bg-[#1a1a1a]' },
  { regex: /hover:bg-blue-600/g, replacement: 'hover:bg-[#333]' },
  { regex: /text-blue-600/g, replacement: 'text-[#1a1a1a]' },
  { regex: /hover:bg-blue-50(?![\/\w])/g, replacement: 'hover:bg-[#eaeaea]' },
  { regex: /text-\[\#858585\]/g, replacement: 'text-[#999]' },
  { regex: /text-\[\#474747\]/g, replacement: 'text-[#555]' },
  { regex: /bg-\[\#f9f9f9\]/g, replacement: 'bg-[#faf9f7]' },
  { regex: /bg-\[\#fcfcfc\]/g, replacement: 'bg-[#faf9f7]' },
  { regex: /border-\[\#e8e8e8\]/g, replacement: 'border-[#eaeaea]' },
  { regex: /text-emerald-600/g, replacement: 'text-[#1a1a1a]' },
  { regex: /hover:bg-emerald-50(?![\/\w])/g, replacement: 'hover:bg-[#eaeaea]' },
  { regex: /text-primary-700/g, replacement: 'text-[#1a1a1a]' },
  { regex: /bg-primary-100/g, replacement: 'bg-[#eaeaea]' },
  { regex: /text-primary-600/g, replacement: 'text-[#1a1a1a]' },
  { regex: /focus:ring-primary-500/g, replacement: 'focus:ring-[#1a1a1a]' },
  { regex: /bg-primary-500/g, replacement: 'bg-[#1a1a1a]' },
  { regex: /text-\[\#f94a00\]/g, replacement: 'text-[#1a1a1a]' },
  { regex: /hover:text-\[\#f94a00\]/g, replacement: 'hover:text-[#555]' },
  { regex: /focus:ring-\[\#f94a00\]/g, replacement: 'focus:ring-[#1a1a1a]' },
  { regex: /bg-orange-50(?![\/\w])/g, replacement: 'bg-[#faf9f7]' },
  { regex: /hover:bg-orange-100/g, replacement: 'hover:bg-[#eaeaea]' },
  { regex: /hover:bg-blue-100/g, replacement: 'hover:bg-[#eaeaea]' },
  { regex: /border-blue-100/g, replacement: 'border-[#eaeaea]' },
  { regex: /bg-blue-50\/30/g, replacement: 'bg-[#faf9f7]' },
  { regex: /text-blue-900/g, replacement: 'text-[#1a1a1a]' },
  { regex: /text-blue-500/g, replacement: 'text-[#555]' },
  { regex: /from-blue-500 via-indigo-500 to-purple-600/g, replacement: 'from-[#1a1a1a] via-[#333] to-[#555]' },
  { regex: /border-borderlue-500/g, replacement: 'border-[#1a1a1a]' },
  { regex: /<h1 className="([^"]+)"/g, replacement: '<h1 className="$1" style={{ fontFamily: "\'Cormorant Garamond\', serif" }}' },
  { regex: /<h2 className="([^"]+)"/g, replacement: '<h2 className="$1" style={{ fontFamily: "\'Cormorant Garamond\', serif" }}' }
];

files.forEach(file => {
  let content = fs.readFileSync(path.join(dir, file), 'utf-8');
  let newContent = content;
  replacements.forEach(r => {
    newContent = newContent.replace(r.regex, r.replacement);
  });
  if (newContent !== content) {
    fs.writeFileSync(path.join(dir, file), newContent, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
