const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

walk('./src').forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let original = c;
  
  // Revert all
  c = c.replace(/background:\s*["']#ffffff["'],\s*color:\s*["']#0A0A0A["']/g, 'background: "var(--color-white)"');
  
  // Now ONLY fix inputs/selects by looking for <input and <select blocks... Wait, doing this via regex is hard.
  // Instead, let's just write this to revert, and then manually inspect where the inputs are.
  
  if (c !== original) {
    fs.writeFileSync(f, c, 'utf8');
    console.log('Reverted in', f);
  }
});
