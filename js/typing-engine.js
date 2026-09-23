(function (AT) {
  AT.TypingEngine = function(options){
    let text = options.text || "";
    let correctLetters = 0;
    let index = 0, correct = 0, errors = 0, total = 0, words = 0, elapsedMs = 0;
    let running = false, paused = false, completed = false, lastTick = performance.now();
    let events = [];
    const rollingSeconds = options.rollingWpmSeconds || 10;

    function start(){ running = true; paused = false; completed = false; lastTick = performance.now(); }
    function tick(now = performance.now()){
      if (running && !paused && !completed) {
        const delta = Math.max(0, Math.min(1000, now - lastTick));
        elapsedMs += delta;
      }
      lastTick = now;
    }
    function pause(){
      if (!running || paused || completed) return false;
      tick(); paused = true; return true;
    }
    function resume(){
      if (!running || !paused || completed) return false;
      paused = false; lastTick = performance.now(); return true;
    }
    function currentChar(){ return text[index] ?? ""; }
    function processInput(ch){
      if (!running || paused || completed || typeof ch !== "string" || ch.length !== 1) return {accepted:false};
      const now = performance.now();
      tick(now);
      const expected = currentChar();
      total += 1;
      if (ch === expected) {
        correct += 1; index += 1;
        if (!/\s/.test(ch)) correctLetters += 1;
        if (ch === " " || index === text.length) words += 1;
        events.push({t:now, correct:true});
        if (index >= text.length) { completed = true; running = false; }
        trimEvents(now);
        return {accepted:true, correct:true, expected, complete:completed};
      }
      errors += 1;
      events.push({t:now, correct:false});
      trimEvents(now);
      return {accepted:true, correct:false, expected, complete:false};
    }
    function trimEvents(now){
      const cutoff = now - rollingSeconds * 1000;
      events = events.filter(e => e.t >= cutoff);
    }
    function metrics(){
      const mins = elapsedMs / 60000;
      const wpm = mins >= (1/120) ? (correct / 5) / mins : 0;
      const accuracy = total ? (correct / total) * 100 : 100;
      const now = performance.now();
      trimEvents(now);
      const recentCorrect = events.filter(e => e.correct).length;
      const recentTotal = events.length;
      const rollAccuracy = recentTotal ? recentCorrect / recentTotal * 100 : 100;
      const recentSpanMs = events.length > 1 ? Math.max(1000, Math.min(rollingSeconds*1000, now - events[0].t)) : 1000;
      const rollWpm = events.length ? (recentCorrect / 5) / (recentSpanMs / 60000) : 0;
      const score = wpm * (accuracy / 100);
      return {
        index, correct, correctLetters, errors, total, words, elapsedMs,
        wpm:Math.max(0,wpm), accuracy:Math.max(0,Math.min(100,accuracy)),
        rollingWpm:Math.max(0,rollWpm), rollingAccuracy:Math.max(0,Math.min(100,rollAccuracy)),
        score:Math.max(0,score), progress:text.length ? index/text.length : 0,
        completed, paused, currentChar:currentChar()
      };
    }
    function isPaused(){ return paused; }
    function isComplete(){ return completed; }
    function getText(){ return text; }
    return {start,tick,pause,resume,processInput,metrics,currentChar,isPaused,isComplete,getText};
  };
})(window.AnimalTyping);
