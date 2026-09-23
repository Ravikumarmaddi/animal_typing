const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
let now=0;const ctx={window:{AnimalTyping:{}},performance:{now:()=>now}};vm.createContext(ctx);
for(const file of ['js/typing-engine.js','js/animal-engine.js','config/game-config.runtime.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const config=JSON.parse(fs.readFileSync('config/game-config.json','utf8'));
assert.equal(JSON.stringify(config),JSON.stringify(ctx.window.AnimalTypingRuntimeConfig));
assert.deepEqual(config.animalTiers.map(x=>x.id),['snail','turtle','elephant','rabbit','deer','horse','ostrich','cheetah']);
for(const tier of config.animalTiers){assert.ok(fs.existsSync(tier.asset));const a=ctx.window.AnimalTyping.AnimalEngine(config);assert.equal(a.update({correctLetters:3,elapsedMs:100}).tier.id,'snail');assert.equal(a.update({correctLetters:4,elapsedMs:48000/(tier.minEffectiveWpm+1)}).tier.id,tier.id);}
const a=ctx.window.AnimalTyping.AnimalEngine(config);
assert.equal(a.update({correctLetters:4,elapsedMs:500}).tier.id,'cheetah');
assert.equal(a.update({correctLetters:7,elapsedMs:20000}).tier.id,'cheetah');
assert.equal(a.update({correctLetters:8,elapsedMs:20500}).tier.id,'snail');
assert.equal(a.reset().id,'snail');
const t=ctx.window.AnimalTyping.TypingEngine({text:'ab cd efgh'});t.start();
function type(ch){now+=500;t.processInput(ch);a.update(t.metrics());}
type('a');type('x');type('b');type(' ');type('c');assert.equal(t.metrics().correctLetters,3);assert.equal(a.get().id,'snail');
t.pause();now+=10000;t.resume();type('d');assert.equal(t.metrics().correctLetters,4);assert.equal(t.metrics().elapsedMs,3000);assert.equal(a.get().id,'elephant');
assert.equal(t.metrics().errors,1);
for(const file of fs.readdirSync('js'))new vm.Script(fs.readFileSync('js/'+file,'utf8'));
console.log('PASS: all 8 speed tiers, 4-character boundaries, speed drops, reset, spaces, mistakes, pause exclusion, configuration parity, and JS syntax.');
