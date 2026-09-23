const {chromium}=require('playwright');
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1366,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(require('node:url').pathToFileURL(require('node:path').resolve(process.env.GAME_ENTRY || 'index.html')).href);
await page.waitForSelector('#animalSprite svg image');
const config=JSON.parse(fs.readFileSync('config/game-config.json','utf8'));
const initial=await page.locator('#animalSprite').boundingBox();assert.equal(initial.width,initial.height);assert.ok(Math.abs(initial.width-Math.min(117,Math.max(59.8,1366*0.0845)))<0.1);
for(const set of config.animalSets){
 await page.locator('#btnSetup').click();await page.locator('#setupModal').waitFor({state:'visible'});
 await page.locator('#animalSet').selectOption(set.id);await page.locator('#btnStart').click();
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem('animalTyping.v1.settings')).animalSet===id,set.id);
 await page.waitForFunction(id=>document.querySelector('#animalSprite image').getAttribute('href')===window.AnimalTypingRuntimeConfig.animalSets.find(s=>s.id===id).asset,set.id);
 await page.reload();await page.waitForSelector('#animalSprite svg image');
 assert.equal(await page.locator('#animalSprite image').getAttribute('href'),await page.evaluate(id=>window.AnimalTypingRuntimeConfig.animalSets.find(s=>s.id===id).asset,set.id));
 const result=await page.evaluate(set=>{
  const cfg=window.AnimalTypingRuntimeConfig,ui=window.AnimalTyping.UI();
  const a=window.AnimalTyping.AnimalEngine(cfg,set.id),out=[];
  for(let i=0;i<8;i++){
   a.reset();const tier=a.update({correctLetters:4,elapsedMs:48000/(cfg.animalTiers[i].minEffectiveWpm+1)}).tier;
   ui.setAnimal(tier);out.push({name:tier.name,box:document.querySelector('#animalSprite').getBoundingClientRect().toJSON(),href:document.querySelector('#animalSprite image').getAttribute('href')});
  }return out;
 },set);
 for(let i=0;i<8;i++){assert.equal(result[i].name,set.characters[i]);assert.ok(result[i].href===set.asset || result[i].href.startsWith('data:image/png;base64,'));assert.equal(result[i].box.width,initial.width);assert.equal(result[i].box.height,initial.height);}
}
// Build a visual QA sheet using the same renderer used by the game.
await page.evaluate(()=>{
 const config=window.AnimalTypingRuntimeConfig,ui=window.AnimalTyping.UI();
 const board=document.createElement('div');board.id='spriteQA';board.style='position:fixed;inset:0;z-index:99999;background:#e6efd9;padding:24px;display:grid;grid-template-columns:repeat(8,1fr);gap:12px;overflow:auto';
 for(const set of config.animalSets)for(let i=0;i<8;i++){
  const engine=window.AnimalTyping.AnimalEngine(config,set.id);const tier=engine.update({correctLetters:4,elapsedMs:48000/(config.animalTiers[i].minEffectiveWpm+1)}).tier;ui.setAnimal(tier);
  const tile=document.createElement('div');tile.style='display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff9;border-radius:12px;padding:8px;text-align:center;font:12px Arial';
  const sprite=document.querySelector('#animalSprite').cloneNode(true);sprite.removeAttribute('id');sprite.className='';sprite.style='width:100px;height:100px;flex:none';
  const key='clip-'+set.id+'-'+i;sprite.querySelector('clipPath').id=key;sprite.querySelector('image').setAttribute('clip-path','url(#'+key+')');sprite.querySelector('svg').style='width:100%;height:100%';
  tile.append(sprite,document.createTextNode(tier.name));board.append(tile);
 }document.body.append(board);
});
await page.screenshot({path:'assets/animals/sets/preview.png'});
assert.deepEqual(errors,[]);
console.log('PASS: all 4 set selections, persisted preferences after reload, all 32 speed mappings, identical dimensions enlarged by 30%, offline image rendering, no browser errors.');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
