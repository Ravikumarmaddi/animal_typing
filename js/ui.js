(function (AT) {
  function $(id){ return document.getElementById(id); }
  AT.UI = function(){
    const els = {
      player:$("playerNameDisplay"),lesson:$("lessonDisplay"),
      wpm:$("wpmDisplay"),accuracy:$("accuracyDisplay"),errors:$("errorsDisplay"),correct:$("correctDisplay"),
      words:$("wordsDisplay"),progress:$("progressDisplay"),time:$("timeDisplay"),score:$("scoreDisplay"),target:$("targetDisplay"),
      bestWpm:$("bestWpm"),bestAccuracy:$("bestAccuracy"),bestScore:$("bestScore"),recent:$("recentSummary"),
      animal:$("animalSprite"),text:$("typingText"),error:$("errorFlash"),
      pauseOverlay:$("pausedOverlay"),main:$("mainGamePanel"),keyboardZone:$("keyboardZone")
    };
    function fmtTime(ms){ const s=Math.floor(ms/1000); return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); }
    function fmtChar(ch){
      if(ch === " ") return "SPACE";
      if(ch === "") return "Done";
      return /^[a-z]$/i.test(ch) ? ch.toUpperCase() : ch;
    }
    function renderLesson(lesson, text, patternIndex=0){
      els.lesson.textContent=lesson.title+(lesson.patterns ? ` · Pattern ${patternIndex+1}/${lesson.patterns.length}` : "");
      els.text.innerHTML="";
      els.text.scrollTop=0;
      [...text].forEach((ch,i)=>{
        const s=document.createElement("span");
        s.className="char remaining"+(ch===" "?" space-char":""); s.dataset.i=i; s.textContent=ch===" "?"\u00a0":ch;
        els.text.appendChild(s);
      });
    }
    function renderTyping(metrics){
      const nodes=els.text.querySelectorAll(".char");
      nodes.forEach((n,i)=>{
        n.classList.remove("correct","current","remaining");
        n.classList.add(i < metrics.index ? "correct" : i === metrics.index ? "current" : "remaining");
      });
      const current=els.text.querySelector(".char.current");
      if(current){
        const viewport=els.text.getBoundingClientRect();
        const target=current.getBoundingClientRect();
        if(target.top < viewport.top || target.bottom > viewport.bottom){
          els.text.scrollTop+=target.top-viewport.top-(els.text.clientHeight-target.height)/2;
        }
      }
      els.text.setAttribute("aria-label","Current target: "+fmtChar(metrics.currentChar));
    }
    function renderMetrics(metrics, tier){
      els.wpm.textContent=Math.round(metrics.wpm);
      els.accuracy.textContent=Math.round(metrics.accuracy)+"%"; els.errors.textContent=metrics.errors;
      els.correct.textContent=metrics.correct; els.words.textContent=metrics.words;
      els.progress.textContent=Math.round(metrics.progress*100)+"%"; els.time.textContent=fmtTime(metrics.elapsedMs);
      els.score.textContent=Math.round(metrics.score); els.target.textContent=fmtChar(metrics.currentChar);
      document.documentElement.style.setProperty("--animal-left", (Math.max(0,Math.min(.98,metrics.progress))*82).toFixed(2)+"%");
      els.animal.classList.toggle("running", metrics.correct > 0 && !metrics.paused && !metrics.completed);
    }
    function setAnimal(tier){
      els.animal.style.opacity="0";
      setTimeout(()=>{ els.animal.src=tier.asset; els.animal.alt=tier.name+" performance animal"; els.animal.style.opacity="1"; },120);
    }
    function setPlayer(name){ els.player.textContent=name; }
    function setBest(best){
      els.bestWpm.textContent=best ? Math.round(best.bestWpm) : "—";
      els.bestAccuracy.textContent=best ? Math.round(best.bestAccuracy)+"%" : "—";
      els.bestScore.textContent=best ? Math.round(best.bestScore) : "—";
    }
    function setRecent(r){
      els.recent.textContent = r ? `${r.lessonTitle}: ${Math.round(r.wpm)} WPM · ${Math.round(r.accuracy)}% · ${r.finalTier}` : "No completed session yet.";
    }
    function flashError(expected){
      els.error.textContent="Incorrect key — press "+fmtChar(expected)+".";
      els.error.classList.add("show"); clearTimeout(flashError.t); flashError.t=setTimeout(()=>els.error.classList.remove("show"),900);
    }
    function setPaused(v){ els.pauseOverlay.hidden=!v; }
    function setKeyboardVisible(v){ els.keyboardZone.classList.toggle("keyboard-hidden",!v); els.main.classList.toggle("no-keyboard",!v); }
    return {els,fmtTime,renderLesson,renderTyping,renderMetrics,setAnimal,setPlayer,setBest,setRecent,flashError,setPaused,setKeyboardVisible};
  };
})(window.AnimalTyping);
