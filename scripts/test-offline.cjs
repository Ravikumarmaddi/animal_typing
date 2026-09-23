const fs=require('fs'),path=require('path'),os=require('os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'animal-offline-check-'));
 const file=path.join(folder,'index.html');fs.copyFileSync('dist/index.html',file);
 const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1366,height:900}});
 const failures=[];page.on('requestfailed',r=>failures.push(r.url()));
 await page.goto(require('url').pathToFileURL(file).href);await page.waitForSelector('#animalSprite svg image');
 assert.equal(await page.locator('#gameShell').evaluate(e=>getComputedStyle(e).display),'flex');
 assert.equal(await page.locator('#mainGamePanel').evaluate(e=>getComputedStyle(e).display),'grid');
 assert.equal(await page.locator('#setupModal').isVisible(),false);
 assert.ok(await page.locator('#keyboard .key').count()>40);
 const text=await page.locator('#typingText').innerText();await page.keyboard.type(text.replace(/\u00a0/g,' ').slice(0,8),{delay:80});
 assert.ok(Number(await page.locator('#correctDisplay').innerText())>=4);
 await page.screenshot({path:'dist/game-preview.png'});
 assert.deepEqual(failures,[]);await browser.close();
 fs.unlinkSync(file);fs.rmdirSync(folder);
 console.log('PASS: isolated temporary-folder copy loads styling, artwork, keyboard and gameplay with no failed requests.');
})().catch(e=>{console.error(e);process.exit(1)});
