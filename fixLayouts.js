const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'app/lib/templates');
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix intro/outro texts by ensuring x: "50%" and x_alignment: "50%"
  // We'll look for `type: "text",` and add them if not present.
  // Actually, we can use a more targeted regex. We know text elements have `name:` and `type: "text"`.
  
  const textElementRegex = /name:\s*["'][^"']+["'],\s*type:\s*["']text["'],([^}]+?)(?=\}\);|\},)/g;
  
  content = content.replace(textElementRegex, (match, body) => {
    let newBody = body;
    // Remove existing x, x_alignment, x_anchor if they exist
    newBody = newBody.replace(/\s*x:\s*["'][^"']+["'],/g, '');
    newBody = newBody.replace(/\s*x_alignment:\s*["'][^"']+["'],/g, '');
    newBody = newBody.replace(/\s*x_anchor:\s*["'][^"']+["'],/g, '');
    
    // For Price-KM, Title, Subtitle, CTA, Phone, Specs, we want them centered.
    // So we inject x: "50%", x_alignment: "50%", width: "90%"
    // Wait, width is usually already there.
    
    // Inject right after duration or time
    newBody = newBody.replace(/(duration[:,].+?\n)/, '$1      x: "50%",\n      x_alignment: "50%",\n');
    
    // For width, if width is present, ensure it's 90% or keep it.
    // If it's a Spec-Label and width was 40% or 80%, let's make it 90% since it's centered now.
    newBody = newBody.replace(/width:\s*["'][^"']+["']/g, 'width: "90%"');
    
    return match.replace(body, newBody);
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
