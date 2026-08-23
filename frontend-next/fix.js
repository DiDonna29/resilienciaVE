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

const colorString1 = 'color: "var(--color-white)"';
const colorString2 = "color: 'var(--color-white)'";

walk('./src').forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let original = c;
  c = c.replace(/color:\s*["']var\(--color-white\)["']/g, 'color: "#fff"');
  if (c !== original) {
    fs.writeFileSync(f, c, 'utf8');
    console.log('Fixed color in', f);
  }
});
