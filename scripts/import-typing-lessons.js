// Import the 80-lesson Markdown course into both online and offline configs.
// Usage: node scripts/import-typing-lessons.js path/to/TYPING_LESSONS_80_FULL_FINAL.md
const fs = require("node:fs");
const path = require("node:path");

const source = process.argv[2];
if (!source) throw new Error("Provide the Markdown lesson file path.");
const markdown = fs.readFileSync(source, "utf8");
const lessons = [];
let section = "";
let current = null;
for (const line of markdown.split(/\r?\n/)) {
  const sectionMatch = line.match(/^## (Home Row|Top Row|Bottom Row|Numbers & Punctuation|Mixed Rows|Difficult|Complex)\s*$/);
  if (sectionMatch) { section = sectionMatch[1]; continue; }
  const lessonMatch = line.match(/^### Lesson (\d+): (.+?)\s*$/);
  if (lessonMatch) {
    current = {number:Number(lessonMatch[1]),title:lessonMatch[2],section,patterns:[]};
    lessons.push(current);
    continue;
  }
  const patternMatch = line.match(/^([1-5])\. `([^`]*)`\s*$/);
  if (patternMatch && current) {
    if (Number(patternMatch[1]) !== current.patterns.length + 1) throw new Error(`Out-of-order pattern in lesson ${current.number}`);
    current.patterns.push(patternMatch[2].replace(/\s+/g," ").trim());
  }
}
if (lessons.length !== 80 || lessons.some((l,i) => l.number !== i+1 || l.patterns.length !== 5 || !l.section)) {
  throw new Error("Expected 80 numbered lessons with five patterns each and a section.");
}

const configPath = path.resolve(__dirname,"../config/game-config.json");
const runtimePath = path.resolve(__dirname,"../config/game-config.runtime.js");
const config = JSON.parse(fs.readFileSync(configPath,"utf8"));
const setId = "course-80";
config.lessonSets = [{id:setId,name:"80-Lesson Course"}];
config.defaults.lessonSet = setId;
config.defaults.lessonId = "course-80-01";
config.defaults.patternIndex = 0;
const imported = lessons.map(l => {
  const chars = [...new Set(l.patterns.join("").replace(/ /g,""))];
  const difficulty = l.number <= 44 ? "beginner" : l.number <= 69 ? "intermediate" : l.number <= 74 ? "advanced" : "expert";
  return {
    id:`course-80-${String(l.number).padStart(2,"0")}`,
    title:`${l.number}. ${l.title}`,
    lessonSet:setId,
    section:l.section,
    targetKeys:chars,
    difficulty,
    text:l.patterns[0],
    patterns:l.patterns,
    targetWpm:l.number <= 44 ? 8 : l.number <= 69 ? 15 : 20,
    targetAccuracy:92,
    needsShift:chars.some(ch => /[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(ch)),
    usesNumbers:chars.some(ch => /[0-9]/.test(ch)),
    usesPunctuation:chars.some(ch => /[^a-zA-Z0-9]/.test(ch)),
    instruction:`${l.section} · Pattern 1 of 5`
  };
});
config.lessons = imported;
fs.writeFileSync(configPath,JSON.stringify(config,null,2)+"\n");
fs.writeFileSync(runtimePath,"window.AnimalTypingRuntimeConfig = "+JSON.stringify(config,null,2)+";\n");
const shortest = Math.min(...lessons.flatMap(l => l.patterns.map(p => p.length)));
console.log(`Imported ${lessons.length} lessons and ${lessons.length*5} patterns. Shortest pattern: ${shortest} characters.`);
