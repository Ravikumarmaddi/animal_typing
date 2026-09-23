
(function(AT){
  "use strict";
  let config, storage, lessons, ui, keyboard, audio, animal;
  let settings, lesson, engine, timerId = null, gameToken = 0;
  let setupModal, resultsModal;

  const $ = id => document.getElementById(id);
  const backgrounds = {
    meadow:{name:"Sunny Meadow",asset:"assets/backgrounds/meadow.svg"},
    forest:{name:"Forest",asset:"assets/backgrounds/forest.svg"},
    beach:{name:"Beach",asset:"assets/backgrounds/beach.svg"},
    desert:{name:"Desert",asset:"assets/backgrounds/desert.svg"},
    night:{name:"Starry Night",asset:"assets/backgrounds/night.svg"}
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init(){
    config = await AT.ConfigService.load();
    storage = AT.StorageService(config);
    lessons = AT.LessonService(config);
    ui = AT.UI();
    audio = AT.AudioService(config);
    keyboard = AT.KeyboardRenderer(config, $("keyboard"));
    settings = normalizeSettings(storage.getSettings());

    setupModal = bootstrap.Modal.getOrCreateInstance($("setupModal"), {backdrop:"static"});
    resultsModal = bootstrap.Modal.getOrCreateInstance($("resultsModal"), {backdrop:"static", keyboard:false});

    populateStaticSetup();
    bindEvents();
    applySettingsToForm();
    startGame(settings, false);
  }

  function normalizeSettings(s){
    const merged = {...config.defaults, ...(s || {})};
    if(!config.lessonSets.some(x=>x.id===merged.lessonSet)) merged.lessonSet=config.defaults.lessonSet;
    const setLessons = config.lessons.filter(l=>l.lessonSet===merged.lessonSet);
    if(!setLessons.some(l=>l.id===merged.lessonId)) merged.lessonId=setLessons[0]?.id || config.defaults.lessonId;
    const selectedLesson=config.lessons.find(l=>l.id===merged.lessonId);
    if(!Number.isInteger(merged.patternIndex) || merged.patternIndex < 0 || merged.patternIndex >= (selectedLesson?.patterns?.length || 1)) merged.patternIndex=0;
    if(!config.animalSets.some(s=>s.id===merged.animalSet)) merged.animalSet=config.defaults.animalSet;
    if(!config.keyboardLayouts.includes(merged.keyboardLayout)) merged.keyboardLayout=config.defaults.keyboardLayout;
    if(!Object.hasOwn(backgrounds,merged.sceneBackground)) merged.sceneBackground="meadow";
    merged.playerName=(merged.playerName||"Player 1").trim().slice(0,24)||"Player 1";
    return merged;
  }

  function populateStaticSetup(){
    $("animalSet").innerHTML=config.animalSets.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join("");
    $("lessonSet").innerHTML=config.lessonSets.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join("");
    $("keyboardLayout").innerHTML=config.keyboardLayouts.map(id=>{
      const l=config.keyboardLayoutDefinitions[id]; return `<option value="${escapeHtml(id)}">${escapeHtml(l?.name||id)}</option>`;
    }).join("");
    $("sceneBackground").innerHTML=Object.entries(backgrounds).map(([id,b])=>`<option value="${id}">${b.name}</option>`).join("");
  }

  function populateLessons(setId, preferredId){
    const list=lessons.bySet(setId);
    $("lessonSelect").innerHTML=list.map(l=>`<option value="${escapeHtml(l.id)}">${escapeHtml(l.title)}</option>`).join("");
    const chosen=list.some(l=>l.id===preferredId)?preferredId:(list[0]?.id||"");
    $("lessonSelect").value=chosen;
    toggleCustomText();
    updatePatternOptions();
  }

  function updatePatternOptions(){
    const selected=lessons.get($("lessonSelect").value);
    const patterns=selected?.patterns;
    $("patternSelectWrap").hidden=!patterns;
    $("patternSelect").innerHTML=patterns ? patterns.map((_,i)=>`<option value="${i}">Pattern ${i+1} of ${patterns.length}</option>`).join("") : "";
  }

  function applySettingsToForm(){
    $("playerName").value=settings.playerName;
    $("lessonSet").value=settings.lessonSet;
    populateLessons(settings.lessonSet, settings.lessonId);
    $("patternSelect").value=String(settings.patternIndex || 0);
    $("keyboardLayout").value=settings.keyboardLayout;
    $("sceneBackground").value=settings.sceneBackground;
    $("animalSet").value=settings.animalSet;
    $("showKeyboard").checked=!!settings.showKeyboard;
    $("soundToggle").checked=!!settings.sound;
    $("reducedMotion").checked=!!settings.reducedMotion;
    $("tapKeys").checked=!!settings.allowOnScreenKeyTap;
    $("customText").value=settings.customText||"";
  }

  function readSettingsFromForm(){
    return normalizeSettings({
      ...settings,
      playerName:$("playerName").value,
      lessonSet:$("lessonSet").value,
      lessonId:$("lessonSelect").value,
      patternIndex:Number($("patternSelect").value || 0),
      keyboardLayout:$("keyboardLayout").value,
      sceneBackground:$("sceneBackground").value,
      animalSet:$("animalSet").value,
      showKeyboard:$("showKeyboard").checked,
      sound:$("soundToggle").checked,
      reducedMotion:$("reducedMotion").checked,
      allowOnScreenKeyTap:$("tapKeys").checked,
      customText:$("customText").value
    });
  }

  function bindEvents(){
    $("lessonSet").addEventListener("change",()=>populateLessons($("lessonSet").value,""));
    $("lessonSelect").addEventListener("change",()=>{ toggleCustomText(); updatePatternOptions(); });

    $("btnStart").addEventListener("click",()=>{
      settings=readSettingsFromForm();
      storage.saveSettings(settings);
      setupModal.hide();
      startGame(settings,true);
    });
    $("btnNew").addEventListener("click",()=>startGame(settings,true));
    $("btnRetry").addEventListener("click",()=>{ resultsModal.hide(); startGame(settings,true); });
    $("btnNext").addEventListener("click",()=>{
      const hasNextPattern=lesson.patterns && settings.patternIndex < lesson.patterns.length-1;
      const next=hasNextPattern ? lesson : lessons.next(lesson);
      resultsModal.hide();
      if(next){ settings={...settings,lessonId:next.id,lessonSet:next.lessonSet,patternIndex:hasNextPattern ? settings.patternIndex+1 : 0}; storage.saveSettings(settings); applySettingsToForm(); startGame(settings,true); }
      else { setupModal.show(); }
    });
    $("btnPause").addEventListener("click",togglePause);
    $("btnSound").addEventListener("click",()=>{
      settings.sound=!settings.sound; storage.saveSettings(settings); audio.setEnabled(settings.sound);
      $("btnSound").setAttribute("aria-pressed",String(settings.sound)); $("soundToggle").checked=settings.sound;
    });
    $("btnKeyboard").addEventListener("click",()=>{
      settings.showKeyboard=!settings.showKeyboard; storage.saveSettings(settings); applyVisibility();
      $("showKeyboard").checked=settings.showKeyboard;
    });
    $("btnFullscreen").addEventListener("click",toggleFullscreen);

    $("btnResetSetup").addEventListener("click",()=>{
      storage.resetSetup(); settings=normalizeSettings(config.defaults); applySettingsToForm();
    });
    $("btnResetAll").addEventListener("click",()=>{
      if(confirm("Reset all saved preferences, scores, lesson records, and history? This cannot be undone.")){
        storage.resetAll(); settings=normalizeSettings(config.defaults); applySettingsToForm(); refreshStoredPanels();
      }
    });

    document.addEventListener("keydown",onKeyDown,{passive:false});
    window.addEventListener("blur",()=>{ if(config.autoPauseOnBlur && engine && !engine.isPaused() && !engine.isComplete()) pauseGame(); });

    $("setupModal").addEventListener("show.bs.modal",()=>{ applySettingsToForm(); if(engine && !engine.isPaused() && !engine.isComplete()) pauseGame(); });
    document.addEventListener("fullscreenchange",()=>$("btnFullscreen").classList.toggle("active",!!document.fullscreenElement));
  }

  function toggleCustomText(){
    $("customTextWrap").hidden=$("lessonSelect").value!=="custom";
  }

  function startGame(nextSettings, userInitiated){
    stopTimer();
    gameToken++;
    settings=normalizeSettings(nextSettings);
    storage.saveSettings(settings);
    lesson=lessons.get(settings.lessonId)||lessons.first(settings.lessonSet);
    settings.lessonId=lesson.id;

    let text=lesson.patterns?.[settings.patternIndex] || lesson.text;
    if(lesson.id==="custom"){
      text=(settings.customText||"").replace(/\s+/g," ").trim();
      if(!text) text="practice typing with calm hands";
    }
    if(!text) text="practice typing with calm hands";

    engine=AT.TypingEngine({text,rollingWpmSeconds:config.rollingWpmSeconds});
    animal=AT.AnimalEngine(config,settings.animalSet);
    const tier=animal.reset();
    audio.setEnabled(settings.sound);
    document.body.classList.toggle("reduced-motion",!!settings.reducedMotion);
    $("scene").style.backgroundImage=`url("${backgrounds[settings.sceneBackground].asset}")`;

    keyboard.setLayout(settings.keyboardLayout);
    keyboard.configureTap(settings.allowOnScreenKeyTap,(ch,code)=>handleTypingCharacter(ch,code));
    applyVisibility();

    ui.setPlayer(settings.playerName);
    ui.renderLesson(lesson,text,settings.patternIndex);
    ui.renderTyping(engine.metrics());
    ui.setAnimal(tier);
    refreshStoredPanels();
    setPausedUi(false);
    engine.start();
    updateAll();
    startTimer(gameToken);

    $("typingText").focus({preventScroll:true});
    if(userInitiated) audio.play("correct");
  }

  function startTimer(token){
    stopTimer();
    timerId=setInterval(()=>{
      if(token!==gameToken){ stopTimer(); return; }
      if(!engine) return;
      engine.tick();
      const metrics=engine.metrics();
      const tierResult=animal.update(metrics);
      if(tierResult.changed){ ui.setAnimal(tierResult.tier); audio.play("tier"); }
      ui.renderMetrics(metrics,tierResult.tier);
      ui.renderTyping(metrics);
      updateHints(metrics);
    },200);
  }

  function stopTimer(){ if(timerId){ clearInterval(timerId); timerId=null; } }

  function onKeyDown(e){
    if(e.ctrlKey||e.altKey||e.metaKey||e.repeat) return;
    if(!engine || engine.isPaused() || engine.isComplete()) return;
    if(document.querySelector(".modal.show")) return;
    if(e.key.length===1){
      if(e.key===" ") e.preventDefault();
      handleTypingCharacter(e.key,e.code);
    }
  }

  function handleTypingCharacter(ch, code){
    if(!engine || engine.isPaused() || engine.isComplete()) return;
    const expected=engine.currentChar();
    // Beginner/lowercase lessons should not mark the correct letter wrong only because Caps Lock is on.
    // Uppercase targets still require uppercase so Shift lessons remain meaningful.
    if(/^[a-z]$/.test(expected) && typeof ch === "string" && ch.toLowerCase() === expected) ch=expected;
    const r=engine.processInput(ch);
    if(!r.accepted) return;
    keyboard.press(code||"");
    if(r.correct){
      if(settings.keyClickSound) audio.play("correct");
    } else {
      audio.play("wrong"); ui.flashError(r.expected);
    }
    const metrics=engine.metrics();
    const tierResult=animal.update(metrics);
    if(tierResult.changed){ ui.setAnimal(tierResult.tier); audio.play("tier"); }
    ui.renderTyping(metrics); ui.renderMetrics(metrics,tierResult.tier); updateHints(metrics);
    if(r.complete) completeGame();
  }

  function updateAll(){
    const metrics=engine.metrics();
    const tier=animal.get();
    ui.renderMetrics(metrics,tier); ui.renderTyping(metrics); updateHints(metrics);
  }

  function updateHints(metrics){
    keyboard.setTarget(metrics.currentChar);
  }

  function applyVisibility(){
    ui.setKeyboardVisible(settings.showKeyboard);
    $("btnKeyboard").setAttribute("aria-pressed",String(settings.showKeyboard));
    $("btnSound").setAttribute("aria-pressed",String(settings.sound));
  }

  function togglePause(){
    if(!engine || engine.isComplete()) return;
    if(engine.isPaused()) resumeGame(); else pauseGame();
  }

  function pauseGame(){
    if(engine && engine.pause()) setPausedUi(true);
  }
  function resumeGame(){
    if(engine && engine.resume()){ setPausedUi(false); $("typingText").focus({preventScroll:true}); }
  }
  function setPausedUi(paused){
    ui.setPaused(paused);
    $("pauseLabel").textContent=paused?"Resume":"Pause";
    $("pauseIcon").src=paused?"assets/icons/play.svg":"assets/icons/pause.svg";
  }

  function completeGame(){
    stopTimer();
    const metrics=engine.metrics(), tier=animal.get();
    ui.renderMetrics(metrics,tier); ui.renderTyping(metrics);
    const result=storage.completeSession(settings,lesson,metrics,tier);
    refreshStoredPanels();
    audio.play("complete");

    $("resultWpm").textContent=Math.round(metrics.wpm);
    $("resultAccuracy").textContent=Math.round(metrics.accuracy)+"%";
    $("resultErrors").textContent=metrics.errors;
    $("resultTime").textContent=ui.fmtTime(metrics.elapsedMs);
    $("resultScore").textContent=Math.round(metrics.score);
    $("resultTier").textContent=tier.name;
    $("resultCorrect").textContent=metrics.correct;
    $("resultPresses").textContent=metrics.total;

    const metAcc=lesson.targetAccuracy ? metrics.accuracy>=lesson.targetAccuracy : true;
    const metWpm=lesson.targetWpm ? metrics.wpm>=lesson.targetWpm : true;
    $("resultMessage").textContent = metAcc && metWpm ? "Great accuracy and rhythm!" : metAcc ? "Great accuracy! Keep building speed." : "Lesson complete. Aim for a little more accuracy next time.";
    $("personalBestBadge").hidden=!result.newBest;
    const hasNextPattern=lesson.patterns && settings.patternIndex < lesson.patterns.length-1;
    $("btnNext").textContent=hasNextPattern ? "Next Pattern" : "Next Lesson";
    $("btnNext").disabled=!hasNextPattern && !lessons.next(lesson);
    setTimeout(()=>resultsModal.show(),160);
  }

  function refreshStoredPanels(){
    if(!lesson) return;
    ui.setBest(storage.getLessonBest(settings.playerName,lesson.id));
    ui.setRecent(storage.lastResult());
  }

  async function toggleFullscreen(){
    try{
      if(document.fullscreenElement) await document.exitFullscreen();
      else await $("appRoot").requestFullscreen();
    } catch(e){
      alert("Full Screen is not available in this browser or was denied.");
    }
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }
})(window.AnimalTyping);
