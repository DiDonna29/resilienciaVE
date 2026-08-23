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
  
  // Replace background: "white" or 'white' with var(--color-white) 
  // BUT only if it is NOT part of an input component inline style that we want white. 
  // Actually, replacing "white" with "var(--color-white)" globally is safer for cards.
  c = c.replace(/background:\s*["']white["']/g, 'background: "var(--color-white)"');
  
  if (c !== original) {
    fs.writeFileSync(f, c, 'utf8');
    console.log('Fixed background: white in', f);
  }
});
