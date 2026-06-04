const fs = require('fs');

const files = [
  'C:/Users/MARTI/.gemini/antigravity/brain/4f1bc64f-7b36-4a6b-8ef7-8ce7dd74fe32/walkthrough.md',
  'C:/Users/MARTI/.gemini/antigravity/brain/4f1bc64f-7b36-4a6b-8ef7-8ce7dd74fe32/analysis_results.md',
  'C:/Users/MARTI/.gemini/antigravity/brain/4f1bc64f-7b36-4a6b-8ef7-8ce7dd74fe32/implementation_plan.md',
  'C:/Users/MARTI/.gemini/antigravity/brain/4f1bc64f-7b36-4a6b-8ef7-8ce7dd74fe32/task.md'
];

console.log('Actualizando marcas en artefactos...');

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/PharmaSync/g, 'Vitara Health');
    content = content.replace(/pharmasync/g, 'vitarahealth');
    fs.writeFileSync(f, content, 'utf8');
    console.log(`✓ Rebrandeado: ${f}`);
  }
});
