// Build a genuinely standalone offline page: styles, scripts, images and audio are embedded.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mime = {'.svg':'image/svg+xml','.png':'image/png','.wav':'audio/wav'};
const cache = new Map();
function embedAssets(text) {
  return text.replace(/(?:\.\.\/)?assets\/[a-zA-Z0-9_./-]+\.(?:svg|png|wav)/g, reference => {
    const relative = reference.replace(/^\.\.\//,'');
    if (!cache.has(relative)) {
      const bytes = fs.readFileSync(path.join(root,relative));
      cache.set(relative,`data:${mime[path.extname(relative)]};base64,${bytes.toString('base64')}`);
    }
    return cache.get(relative);
  });
}
let html = fs.readFileSync(path.join(root,'index.html'),'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_,file) =>
  '<style>'+embedAssets(fs.readFileSync(path.join(root,file),'utf8'))+'</style>');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_,file) =>
  '<script>'+embedAssets(fs.readFileSync(path.join(root,file),'utf8')).replace(/<\/script/gi,'<\\/script')+'</script>');
html = embedAssets(html);
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist','index.html'),html);
console.log(`Built dist/index.html (${(Buffer.byteLength(html)/1024/1024).toFixed(1)} MB), ${cache.size} embedded assets. No companion folders needed.`);
